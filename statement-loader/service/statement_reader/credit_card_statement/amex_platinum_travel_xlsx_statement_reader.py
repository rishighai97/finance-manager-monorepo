from datetime import datetime
from io import BytesIO

import pandas as pd

from model.account_statement import AccountStatementExtension
from model.account_statement_upload_request import AccountStatementUploadRequest
from model.transaction import Transaction
from service.statement_reader.statement_reader import StatementReader
from typing import List, override


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
                    date=datetime.strptime(str(row["Date"]).strip(), "%m/%d/%Y"),
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
