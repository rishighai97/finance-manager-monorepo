from datetime import datetime

import xlrd
from werkzeug.datastructures import FileStorage

from model.account_statement import AccountStatementExtension
from model.account_statement_upload_request import AccountStatementUploadRequest
from model.transaction import Transaction
from service.statement_reader.statement_reader import StatementReader
import pandas as pd
from typing import List, override


class CanaraStatementReader(StatementReader):

    @override
    def read_statement(self, request: AccountStatementUploadRequest, file: bytes) -> List[Transaction]:
        account_id = request.account_id
        df = pd.read_excel(xlrd.open_workbook(file_contents=file))
        transactions = []
        start = False
        for idx, row in df.iterrows():
            if start is True and type(row.iloc[0]) != str:
                break
            if start is True:
                date_string = str(row.iloc[1]) if type(row.iloc[1]) == str else None
                date = datetime.strptime(date_string, "%d %b %Y")
                title = row.iloc[3]
                debit_amount = float(row.iloc[5]) if row.iloc[5] != None else float(0)
                credit_amount = float(row.iloc[6]) if row.iloc[6] != None else float(0)
                is_credit_amount = credit_amount is not None and credit_amount > 0
                amount = credit_amount if is_credit_amount else debit_amount
                closing_balance = float(row.iloc[7]) if row.iloc[7] != None else float(0)
                transactions.append(
                    Transaction(
                        # transaction_id=account_id + "|" + date_string + "|" + title,
                        date=date,
                        account_id=account_id,
                        user_id=request.user_id,
                        title=title,
                        debit_or_credit_amount=amount,
                        is_credit_amount=is_credit_amount,
                        closing_balance=closing_balance
                    )
                )
            if type(row.iloc[0]) == str and  "txn date" in row.iloc[0].lower().strip():
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
        return AccountStatementExtension.xls