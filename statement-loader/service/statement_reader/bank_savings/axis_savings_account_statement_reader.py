from datetime import datetime
import re

import pandas as pd
import xlrd

from model.account_statement import AccountStatementExtension
from model.account_statement_upload_request import AccountStatementUploadRequest
from model.transaction import Transaction
from service.statement_reader.statement_reader import StatementReader
from typing import List, override
from io import StringIO, BytesIO

class AxisXlsSavingsAccountStatementReader(StatementReader):
    regex_pattern = r',(?![^"]*"(?:(?:[^"]*"){2})*[^"]*$)'

    @override
    def read_statement(self, request: AccountStatementUploadRequest, file: bytes) -> List[Transaction]:
        df = pd.read_excel(xlrd.open_workbook(file_contents=file))
        start = False
        transactions = []
        for idx, row in df.iterrows():
            if start and (pd.isna(row.iloc[1])):
                break
            if start:
                transactions.append(
                    Transaction(
                        # transaction_id=str(account_id) + "|" + str(row.iloc[0]) + "|" + row.iloc[1],
                        date=datetime.strptime(row.iloc[1], "%d-%m-%Y"),
                        user_account_id=request.user_account_id,
                        title=row.iloc[3],
                        debit_or_credit_amount=float(row.iloc[4].strip()) if type(row.iloc[4]) == str and row.iloc[4].strip() != '' else float(row.iloc[5].strip()),
                        is_credit_amount=type(row.iloc[5]) == str and row.iloc[5].strip() != '',
                        closing_balance=float(row.iloc[6].strip()),
                    )
                )
            if not start and type(row.iloc[0]) == str and "SRL NO" in row.iloc[0].lower().upper():
                start = True
        return transactions

    @override
    def account_id(self) -> int:
        return 5

    @override
    def version(self) -> int:
        return 1

    @override
    def extension(self) -> str:
        return AccountStatementExtension.xls


class AxisCsvSavingsAccountStatementReader(StatementReader):
    regex_pattern = r',(?![^"]*"(?:(?:[^"]*"){2})*[^"]*$)'

    @override
    def read_statement(self, request: AccountStatementUploadRequest, file: bytes) -> List[Transaction]:
        start = False
        transactions: List[Transaction] = []
        for line in file.decode().split("\n"):
            words = [word.replace('"', '') for word in line.split(",")]
            if start and (type(words[0]) != str or words[0].strip() == ''):
                break
            elif start:
                date_string = str(words[0]) if type(words[0]) == str else None
                date = datetime.strptime(date_string, "%d/%m/%y")
                title = words[2]
                debit_amount = float(words[3].strip()) if type(words[3]) == str and words[3].strip() != '' and len(
                    words[3]) > 0 else float(0)
                credit_amount = float(words[4].strip()) if type(words[4]) == str and words[4].strip() != '' is not None and len(
                    words[4]) > 0 else float(0)
                is_credit_amount = credit_amount is not None and credit_amount > 0
                amount = credit_amount if is_credit_amount else debit_amount
                closing_balance = float(words[5].strip()) if type(words[5]) == str and words[5].strip() != '' is not None and len(
                    words[5]) > 0 else float(0)
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
            elif not start and 'tran date' in line.lower().strip():
                start = True
        return transactions

    @override
    def account_id(self) -> int:
        return 5

    @override
    def version(self) -> int:
        return 1

    @override
    def extension(self) -> str:
        return AccountStatementExtension.csv
