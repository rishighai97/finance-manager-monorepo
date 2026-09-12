import re

from model.account_statement import AccountStatementExtension
from model.account_statement_upload_request import AccountStatementUploadRequest
from model.transaction import Transaction
from service.statement_reader.statement_reader import StatementReader
from typing import List, override
from utils.datetime_utils import parse_flexible_date

# Day-first (Indian convention) formats - see
# utils/datetime_utils.py's parse_flexible_date docstring for why these
# must never mix with a month-first format.
_DATE_FORMATS = ["%d %b %Y", "%d-%b-%Y", "%d %B %Y", "%d-%b-%y", "%d %b %y"]

# fixme handle cases where title can be allowed to have =
class CanaraStatementReader(StatementReader):
    regex_pattern = r',(?![^"]*"(?:(?:[^"]*"){2})*[^"]*$)'

    @override
    def read_statement(self, request: AccountStatementUploadRequest, file: bytes) -> List[Transaction]:
        start = False
        transactions: List[Transaction] = []
        for line in file.decode().split("\n"):
            words = [word.replace('"', '') for word in re.split(self.regex_pattern, line.replace("=", ""))]
            if start and len(words) < 2:
                break
            elif start:
                date_string = str(words[1]) if type(words[1]) == str else None
                date = parse_flexible_date(date_string, _DATE_FORMATS)
                title = words[3]
                debit_amount = float(words[5].replace(",", "")) if words[5] is not None and len(
                    words[5]) > 0 else float(0)
                credit_amount = float(words[6].replace(",", "")) if words[6] is not None and len(
                    words[6]) > 0 else float(0)
                is_credit_amount = credit_amount is not None and credit_amount > 0
                amount = credit_amount if is_credit_amount else debit_amount
                closing_balance = float(words[7].replace(",", "")) if words[7] is not None and len(
                    words[7]) > 0 else float(0)
                transactions.append(
                    Transaction(
                        # transaction_id=account_id + "|" + date_string + "|" + title,
                        date=date,
                        user_account_id=request.user_account_id,
                        title=title,
                        debit_or_credit_amount=amount,
                        is_credit_amount=is_credit_amount,
                        closing_balance=closing_balance
                    )
                )
            elif not start and 'txn date' in line.lower():
                start = True
        return transactions

    @override
    def account_id(self) -> int:
        return 4

    @override
    def version(self) -> int:
        return 1

    @override
    def extension(self) -> str:
        return AccountStatementExtension.csv
