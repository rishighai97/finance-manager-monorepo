from typing import List, Mapping

import pandas as pd
import xlrd
from flask import Request
from werkzeug.datastructures import FileStorage
from werkzeug.exceptions import BadRequest
from model.account_details import AccountDetails
from model.transaction import Transaction
from service.transaction_service import TransactionService





class StatementUploader:

    def __init__(self):
        self.transaction_service : TransactionService = TransactionService()

    def upload_statement(self, api_request: Request) -> int:
        account_details: AccountDetails = self.get_account_details()
        StatementUploader.validate_http_request(api_request=api_request, account_details=account_details)
        transactions_with_possible_duplicates : List[Transaction] = self.get_all_transactions(files=list(api_request.files.values()))
        transactions: List[Transaction] = StatementUploader.filter_out_duplicate_transactions(transactions=transactions_with_possible_duplicates)
        self.transaction_service.save(transactions)
        return len(transactions)

    def get_account_details(self) -> AccountDetails:
        pass

    def get_all_transactions(self, files: List[FileStorage]) -> List[Transaction]:
        pass

    @staticmethod
    def filter_out_duplicate_transactions(transactions: List[Transaction]) -> List[Transaction]:
        return list({t.transaction_id: t for t in transactions}.values())

    @staticmethod
    def validate_http_request(api_request: Request, account_details: AccountDetails):
        files = api_request.files
        if files is None or len(files) == 0:
            raise BadRequest("No statements attached in API request")
        for file in files.values():
            filename = file.filename
            if filename == None:
                raise BadRequest("No filename found in API request")
            is_valid_extenstion = False
            for valid_extension in account_details.valid_formats:
                if filename.strip().lower().endswith(valid_extension.strip().lower()):
                    is_valid_extenstion = True
                    break
            if not is_valid_extenstion:
                raise BadRequest(f"No valid format found for account - {account_details.bank_name} | uploaded file : {filename} | expected file formats : {account_details.valid_formats}")
