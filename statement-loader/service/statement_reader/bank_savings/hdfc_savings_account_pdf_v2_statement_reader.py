import re
from datetime import datetime
from io import BytesIO
from typing import List

import pdfplumber
from typing_extensions import override

from model.account_statement import AccountStatementExtension
from model.account_statement_upload_request import AccountStatementUploadRequest
from model.transaction import Transaction
from service.statement_reader.statement_reader import StatementReader

# Demonstrates format drift for jira/JIRA_11.md's statement-onboard skill:
# a hypothetical v2 of HDFC's PDF export that drops the Chq./Ref.No. and
# ValueDt columns and prints its opening balance as a single "Opening Bal:"
# line instead of a trailing STATEMENTSUMMARY block. This is a synthetic
# exercise of the onboarding mechanics (a new version/reader added
# alongside v1, without touching v1's ability to parse its own
# time-ranged statements) - not based on any real future HDFC change.
#
# No page-count or coordinate assumptions: pages are iterated whatever
# their number, in_table is reset per page (not assumed constant across
# pages), and the table/opening-balance markers are found by content, not
# position - see hdfc_savings_account_pdf_statement_reader.py's v1 comment
# for the fuller rationale.
_TRANSACTION_LINE = re.compile(
    r"^(?P<date>\d{2}/\d{2}/\d{2})\s+(?P<narration>.+?)\s+"
    r"(?P<amount>[\d,]+\.\d{2})\s+(?P<balance>[\d,]+\.\d{2})$"
)

_TABLE_START_MARKER = "transactiondetails"
_OPENING_BALANCE_LINE = re.compile(r"^OpeningBal:\s*(?P<opening>[\d,]+\.\d{2})$")


class HdfcSavingsAccountPdfV2StatementReader(StatementReader):

    @override
    def read_statement(self, request: AccountStatementUploadRequest, file: bytes) -> List[Transaction]:
        opening_balance, rows = self._extract_rows(file)

        transactions = []
        previous_balance = opening_balance
        for row in rows:
            is_credit = previous_balance is not None and row["balance"] > previous_balance
            transactions.append(
                Transaction(
                    date=datetime.strptime(row["date"], "%d/%m/%y"),
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

        with pdfplumber.open(BytesIO(file)) as pdf:
            for page in pdf.pages:
                in_table = False
                text = page.extract_text() or ""
                for raw_line in text.splitlines():
                    line = raw_line.strip()
                    if not line:
                        continue

                    opening_match = _OPENING_BALANCE_LINE.match(line)
                    if opening_match:
                        opening_balance = float(opening_match.group("opening").replace(",", ""))
                        continue

                    if _TABLE_START_MARKER in line.lower().replace(" ", ""):
                        in_table = True
                        continue

                    if not in_table:
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
        return 2

    @override
    def extension(self) -> str:
        return AccountStatementExtension.pdf
