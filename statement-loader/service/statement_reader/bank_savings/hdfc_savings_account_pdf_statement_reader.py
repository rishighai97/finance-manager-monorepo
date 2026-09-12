import re
from io import BytesIO
from typing import List

import pdfplumber
from typing_extensions import override

from model.account_statement import AccountStatementExtension
from model.account_statement_upload_request import AccountStatementUploadRequest
from model.transaction import Transaction
from service.statement_reader.statement_reader import StatementReader
from utils.datetime_utils import parse_flexible_date

# Day-first (Indian convention) formats seen/plausible for HDFC's real pdf
# export - see utils/datetime_utils.py's parse_flexible_date docstring for
# why these must never mix with a month-first format.
_DATE_FORMATS = ["%d/%m/%y", "%d/%m/%Y", "%d-%m-%Y", "%d-%m-%y"]

# HDFC's PDF export has no per-row table grid (pdfplumber's extract_table()
# collapses whole columns into one multi-line cell each, misaligning rows
# whenever a column - Withdrawal vs Deposit - is blank for a given row), so
# this reads line-based text instead and matches each transaction with a
# regex against the known column layout:
#   <date> <narration> <ref no> <value date> <amount> <closing balance>
# The narration can wrap onto extra lines with no leading date - those are
# appended to the previous transaction's title.
#
# Deliberately no page-count or coordinate assumptions anywhere below: the
# statement can run any number of pages (a short one might fit on a single
# page, a long one may span many - both are exercised by this reader's own
# tests, the 1-page synthetic fixture and the multi-page real sample), and
# the table/summary markers are detected by their text content wherever
# they occur, not by page index or x/y position. Per-page state (in_table)
# is reset at the top of each page's own loop rather than assumed to carry
# a fixed shape from page to page.
_TRANSACTION_LINE = re.compile(
    r"^(?P<date>\d{2}[/-]\d{2}[/-]\d{2,4})\s+(?P<narration>.+?)\s+(?P<ref>\S+)\s+(?P<value_date>\d{2}[/-]\d{2}[/-]\d{2,4})\s+"
    r"(?P<amount>[\d,]+\.\d{2})\s+(?P<balance>[\d,]+\.\d{2})$"
)

# The one line that reliably marks "the transaction table starts here" on
# EVERY page - unlike the "Date Narration ..." column header, which HDFC
# only prints once, on the first page. Matched with whitespace stripped:
# HDFC's real PDF export drops some inter-word spaces inconsistently
# (pdfplumber sees e.g. "Statementof account", not "Statement of account"),
# so comparing space-insensitively matches both that and a cleanly-spaced
# rendering (e.g. a synthetic test fixture).
_TABLE_START_MARKER = "statementofaccount"

# Marks the end of the table (start of the per-statement summary block) -
# wherever it happens to fall; not assumed to be on any particular page.
_SUMMARY_START_MARKER = "STATEMENTSUMMARY"

# Footer/disclaimer lines that can follow the last transaction on any page
# before that page ends - matched by prefix so a following continuation
# line isn't mistaken for narration overflow.
_FOOTER_LINE_PREFIXES = (
    "HDFCBANKLIMITED",
    "*Closingbalance",
    "Contentsofthisstatement",
    "Stateaccountbranch",
    "HDFCBankGSTIN",
    "RegisteredOfficeAddress",
    "thisstatement",
)


class HdfcSavingsAccountPdfStatementReader(StatementReader):

    @override
    def read_statement(self, request: AccountStatementUploadRequest, file: bytes) -> List[Transaction]:
        opening_balance, rows = self._extract_rows(file)

        transactions = []
        previous_balance = opening_balance
        for row in rows:
            is_credit = previous_balance is not None and row["balance"] > previous_balance
            transactions.append(
                Transaction(
                    date=parse_flexible_date(row["date"], _DATE_FORMATS),
                    user_account_id=request.user_account_id,
                    title=row["narration"],
                    debit_or_credit_amount=row["amount"],
                    is_credit_amount=is_credit,
                    closing_balance=row["balance"],
                )
            )
            previous_balance = row["balance"]
        return transactions

    @staticmethod
    def _extract_rows(file: bytes):
        opening_balance = None
        rows = []
        summary_next = False

        with pdfplumber.open(BytesIO(file)) as pdf:
            for page in pdf.pages:
                in_table = False
                text = page.extract_text() or ""
                for raw_line in text.splitlines():
                    line = raw_line.strip()
                    if not line:
                        continue

                    if _TABLE_START_MARKER in line.lower().replace(" ", ""):
                        in_table = True
                        continue

                    if line.startswith(_SUMMARY_START_MARKER):
                        in_table = False
                        summary_next = True
                        continue

                    if summary_next:
                        if line.startswith("OpeningBalance"):
                            continue
                        parts = line.split()
                        if parts:
                            try:
                                opening_balance = float(parts[0].replace(",", ""))
                            except ValueError:
                                pass
                        summary_next = False
                        continue

                    if not in_table:
                        continue

                    if line.startswith(_FOOTER_LINE_PREFIXES):
                        in_table = False
                        continue

                    match = _TRANSACTION_LINE.match(line)
                    if match:
                        rows.append({
                            "date": match.group("date"),
                            "narration": match.group("narration").strip(),
                            "amount": float(match.group("amount").replace(",", "")),
                            "balance": float(match.group("balance").replace(",", "")),
                        })
                    elif rows:
                        rows[-1]["narration"] += " " + line

        return opening_balance, rows

    @override
    def account_id(self) -> int:
        return 1

    @override
    def version(self) -> int:
        return 1

    @override
    def extension(self) -> str:
        return AccountStatementExtension.pdf
