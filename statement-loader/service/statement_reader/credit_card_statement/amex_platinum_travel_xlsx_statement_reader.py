from io import BytesIO

import pandas as pd

from model.account_statement import AccountStatementExtension
from model.account_statement_upload_request import AccountStatementUploadRequest
from model.transaction import Transaction
from service.statement_reader.statement_reader import StatementReader
from typing import List, override
from utils.datetime_utils import parse_flexible_date

# Month-first (US convention) formats - Amex is a US card issuer, unlike
# every other reader here (Indian banks, day-first). See
# utils/datetime_utils.py's parse_flexible_date docstring for why these
# must never mix with a day-first format.
_DATE_FORMATS = ["%m/%d/%Y", "%m-%d-%Y", "%m/%d/%y"]


class AmexPlatinumTravelXlsxStatementReader(StatementReader):

    @override
    def read_statement(self, request: AccountStatementUploadRequest, file: bytes) -> List[Transaction]:
        df = pd.read_excel(BytesIO(file), sheet_name="Transaction Details", skiprows=6)
        transactions = []
        for _, row in df.iterrows():
            if pd.isna(row["Date"]) or pd.isna(row["Amount"]):
                continue
            amount = float(row["Amount"])
            transactions.append(
                Transaction(
                    date=parse_flexible_date(str(row["Date"]), _DATE_FORMATS),
                    user_account_id=request.user_account_id,
                    title=str(row["Description"]).strip(),
                    debit_or_credit_amount=abs(amount),
                    is_credit_amount=amount < 0,
                )
            )
        return transactions

    @override
    def account_id(self) -> int:
        return 8

    @override
    def version(self) -> int:
        return 1

    @override
    def extension(self) -> str:
        return AccountStatementExtension.xlsx
