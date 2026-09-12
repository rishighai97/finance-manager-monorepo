import xlrd
from werkzeug.datastructures import FileStorage

from model.account_statement_upload_request import AccountStatementUploadRequest
from model.transaction import Transaction
from service.statement_reader.statement_reader import StatementReader
import pandas as pd
from typing import List, override
from model.account_statement import AccountStatementExtension
from utils.datetime_utils import parse_flexible_date

# Day-first (Indian convention) formats - see
# utils/datetime_utils.py's parse_flexible_date docstring for why these
# must never mix with a month-first format.
_DATE_FORMATS = ["%d %b %Y", "%d-%b-%Y", "%d %B %Y", "%d-%b-%y", "%d %b %y"]


class GrowwStatementReader(StatementReader):

    # fixme - handle multiple transactions with same key
    @override
    def read_statement(self, request: AccountStatementUploadRequest, file: bytes) -> List[Transaction]:
        df = pd.read_excel(file)
        transactions = []
        start = False
        for idx, row in df.iterrows():
            if start and type(row[0]) == str:
                transactions.append(
                    Transaction(
                        # transaction_id=str(account_id) + "|" + str(row[5]) + "|" + row[0],
                        date=parse_flexible_date(row[5], _DATE_FORMATS),
                        user_account_id=request.user_account_id,
                        title=row[0],
                        debit_or_credit_amount=float(row[4].replace(',','').replace(' ','')),
                        is_credit_amount=str(row[1]).strip() == "PURCHASE",
                        units=row[2],
                        price_per_unit=row[3]
                    )
                )

            if type(row[0]) == str and row[0] == "Scheme Name":
                start = True
        return transactions

    @override
    def account_id(self) -> int:
        return 7

    @override
    def version(self) -> int:
        return 1

    @override
    def extension(self) -> str:
        return AccountStatementExtension.xlsx
