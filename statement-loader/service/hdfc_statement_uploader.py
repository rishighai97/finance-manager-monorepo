from typing import List, Mapping
from io import BytesIO

import pandas as pd
import xlrd
from flask import Request
from typing_extensions import override
from werkzeug.datastructures import FileStorage

from model.account_details_factory import AccountDetailsFactory
from model.account_details import AccountDetails
from model.transaction import Transaction
from service.statement_uploader import StatementUploader
from service.statement_reader.hdfc_statement_reader import HdfcStatementReader



class HdfcStatementUploader(StatementUploader):

    def __init__(self):
        super().__init__()
        self.statement_reader = HdfcStatementReader()

    @override
    def get_account_details(self) -> AccountDetails:
        return AccountDetailsFactory.HDFC

    def get_all_transactions(self, files: List[FileStorage]) -> List[Transaction]:
        result: List[Transaction] = list()

        for file in files:
            file_extension = file.filename.split(".")[-1].lower()
            match file_extension:
                case 'xls':
                    df = df=pd.read_excel(xlrd.open_workbook(file_contents=file.read()))
                    result.extend(self.statement_reader.read_statement(account_id="HDFC", df=df)) # todo add account id received in api request body)
                case _:
                    raise Exception(f"No handler found to read {file_extension} file extension for HDFC bank account")
        return result

    def get_transactions_from_xls_statement(self, df: pd.DataFrame) -> List[Transaction]:
        return self.statement_reader.read_statement(account_id="HDFC", df=df) # todo add account id received in api request body
