from datetime import datetime

import xlrd
from werkzeug.datastructures import FileStorage

from model.account_statement_upload_request import AccountStatementUploadRequest
from model.transaction import Transaction
from service.statement_reader.statement_reader import StatementReader
import pandas as pd
from typing import List, override
from model.account_statement import AccountStatementExtension


class GrowwStatementReader(StatementReader):

    # fixme - handle multiple transactions with same key
    @override
    def read_statement(self, request: AccountStatementUploadRequest, file: bytes) -> List[Transaction]:
        account_id = request.account_id
        df = pd.read_excel(file)
        transactions = []
        start = False
        for idx, row in df.iterrows():
            if start and type(row[0]) == str:
                transactions.append(
                    Transaction(
                        # transaction_id=str(account_id) + "|" + str(row[5]) + "|" + row[0],
                        date=datetime.strptime(row[5], "%d %b %Y"),
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
