from datetime import datetime

import xlrd
from typing_extensions import override
from werkzeug.datastructures import FileStorage

from model.account_statement import AccountStatementExtension
from model.account_statement_upload_request import AccountStatementUploadRequest
from model.transaction import Transaction
from service.statement_reader.statement_reader import StatementReader
import pandas as pd
from typing import List
from io import BytesIO
from utils.datetime_utils import parse_flexible_date

# Day-first (Indian convention) formats seen/plausible for HDFC's real xls
# export - see utils/datetime_utils.py's parse_flexible_date docstring for
# why these must never mix with a month-first format.
_DATE_FORMATS = ["%d/%m/%y", "%d/%m/%Y", "%d-%m-%Y", "%d-%m-%y"]


class HdfcSavingsAccountXlsStatementReader(StatementReader):

    @override
    def read_statement(self, request: AccountStatementUploadRequest, file: bytes) -> List[Transaction]:
        df = pd.read_excel(xlrd.open_workbook(file_contents=file))
        asterix_row_count = 0
        transactions = []
        for idx, row in df.iterrows():
            if type(row.iloc[0]) == str and row.iloc[0][0] == "*":
                asterix_row_count += 1
            if asterix_row_count == 2 and type(row.iloc[0]) == str and row.iloc[0][0] != '*':
                transactions.append(
                    Transaction(
                        # transaction_id=str(account_id) + "|" + str(row.iloc[0]) + "|" + row.iloc[1],
                        date=parse_flexible_date(row.iloc[0], _DATE_FORMATS),
                        user_account_id=request.user_account_id,
                        title=row.iloc[1],
                        debit_or_credit_amount=float(row.iloc[4]) if pd.isna(row[5]) else float(row.iloc[5]),
                        is_credit_amount=pd.isna(row[4]),
                        closing_balance=row.iloc[6]
                    )
                )
            if asterix_row_count == 3:
                break
        return transactions


    @override
    def account_id(self) -> int:
        return 1

    @override
    def version(self) -> int:
        return 1

    @override
    def extension(self) -> str:
        return AccountStatementExtension.xls
