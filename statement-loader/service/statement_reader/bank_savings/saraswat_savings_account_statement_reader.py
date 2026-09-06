
from datetime import datetime

import xlrd
from model.account_statement import AccountStatementExtension
from model.account_statement_upload_request import AccountStatementUploadRequest
from model.transaction import Transaction
from service.statement_reader.statement_reader import StatementReader
import pandas as pd
from typing import List, override



class SaraswatXlsSavingsAccountStatementReader(StatementReader):

    @override
    def read_statement(self, request: AccountStatementUploadRequest, file: bytes) -> List[Transaction]:
        df = pd.read_excel(xlrd.open_workbook(file_contents=file))
        transactions = []
        start = False
        for idx, row in df.iterrows():
            if start is True and (type(row.iloc[2]) != str or row.iloc[2].strip() == ''):
                break
            if start is True and len(row[2].split("/")) == 3 and len(row[2].strip())==10:
                date_string = str(row.iloc[2])
                date = datetime.strptime(date_string, "%d/%m/%Y")
                title = df.iloc[idx+1].iloc[2]
                debit_credit_amount_string_list = row[11].strip().split(" ")
                is_credit_amount = debit_credit_amount_string_list[0].lower() == "cr"
                amount = float(debit_credit_amount_string_list[1].replace(",",""))
                closing_balance = float(row.iloc[16].strip().replace(",", "")) if row.iloc[16] != None else float(0)
                transactions.append(
                    Transaction(
                        # transaction_id=str(account_id) + "|" + date_string + "|" + title,
                        date=date,
                        user_account_id=request.user_account_id,
                        title=title,
                        debit_or_credit_amount=amount,
                        is_credit_amount=is_credit_amount,
                        closing_balance=closing_balance
                    )
                )
            if type(row.iloc[2]) == str and "remarks" == row.iloc[2].lower().strip():
                start = True
        return transactions


    @override
    def account_id(self) -> int:
        return 3

    @override
    def version(self) -> int:
        return 1

    @override
    def extension(self) -> str:
        return AccountStatementExtension.xls