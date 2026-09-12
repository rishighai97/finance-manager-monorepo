import re

import pandas as pd
import math
import xlrd

from model.account_statement import AccountStatementExtension
from model.account_statement_upload_request import AccountStatementUploadRequest
from model.transaction import Transaction
from service.statement_reader.statement_reader import StatementReader
from typing import List, override
from io import StringIO, BytesIO

from utils.data_type_utils import is_null
from utils.datetime_utils import parse_flexible_date

# Day-first (Indian convention) formats - see
# utils/datetime_utils.py's parse_flexible_date docstring for why these
# must never mix with a month-first format. The old "%d/%m/%y" is kept as
# a fallback (not removed) in case an older real export really did use it
# - see jira/JIRA_19.md, where the real export turned out to use
# "%d-%m-%Y" instead of this reader's original "%d/%m/%y" assumption.
_DATE_FORMATS = ["%d-%m-%Y", "%d/%m/%Y", "%d/%m/%y", "%d-%m-%y"]


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
                is_credit_amount: bool = is_null(row[4])
                debit_or_credit_amount: float = float(row.iloc[5]) if is_credit_amount else float(row.iloc[4])
                transactions.append(
                    Transaction(
                        # transaction_id=str(account_id) + "|" + str(row.iloc[0]) + "|" + row.iloc[1],
                        date=parse_flexible_date(row.iloc[1], _DATE_FORMATS),
                        user_account_id=request.user_account_id,
                        title=row.iloc[3],
                        debit_or_credit_amount=debit_or_credit_amount,
                        is_credit_amount=is_credit_amount,
                        closing_balance=float(row.iloc[6]),
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
                date = parse_flexible_date(date_string, _DATE_FORMATS)
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
