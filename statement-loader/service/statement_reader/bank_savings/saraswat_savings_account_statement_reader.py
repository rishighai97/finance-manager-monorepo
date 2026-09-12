
import re

import xlrd
from model.account_statement import AccountStatementExtension
from model.account_statement_upload_request import AccountStatementUploadRequest
from model.transaction import Transaction
from service.statement_reader.statement_reader import StatementReader
import pandas as pd
from typing import List, override
from utils.datetime_utils import parse_flexible_date

# Day-first (Indian convention) formats - see
# utils/datetime_utils.py's parse_flexible_date docstring for why these
# must never mix with a month-first format.
_DATE_FORMATS = ["%d/%m/%Y", "%d/%m/%y", "%d-%m-%Y", "%d-%m-%y"]
_DATE_LIKE = re.compile(r"^\d{2}[/-]\d{2}[/-]\d{2,4}$")


class SaraswatXlsSavingsAccountStatementReader(StatementReader):

    @override
    def read_statement(self, request: AccountStatementUploadRequest, file: bytes) -> List[Transaction]:
        df = pd.read_excel(xlrd.open_workbook(file_contents=file))
        transactions = []
        start = False
        for idx, row in df.iterrows():
            if start is True and (type(row.iloc[2]) != str or row.iloc[2].strip() == ''):
                break
            if start is True and _DATE_LIKE.match(row[2].strip()):
                date_string = str(row.iloc[2])
                date = parse_flexible_date(date_string, _DATE_FORMATS)
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