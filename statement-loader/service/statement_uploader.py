import base64
import json
from typing import List, Mapping, Set

import pandas as pd
import xlrd
from flask import Request
from werkzeug.datastructures import FileStorage
from werkzeug.exceptions import BadRequest

from model.account import Account
from model.account_details import AccountDetails
from model.account_statement import AccountExtensionData
from model.account_statement_upload_request import AccountStatementUploadRequest
from model.account_statement_upload_response import AccountStatementUploadResponse
from model.transaction import Transaction
from service.statement_reader.statement_reader import StatementReaderKey, StatementReader
from service.statement_reader.statement_reader_factory import StatementReaderFactory
from service.transaction_service import TransactionService


class StatementUploader:

    def __init__(self):
        self.transaction_service: TransactionService = TransactionService()
        self.account_statement_reader_factory: StatementReaderFactory = StatementReaderFactory()

    def upload_statement(self, account_statement_requests: List[AccountStatementUploadRequest]) -> List[
        AccountStatementUploadResponse]:

        extension_to_statement_reader_mapping: Mapping[
            AccountExtensionData, StatementReader] = self.get_extension_to_statement_reader_mapping(
            account_statement_requests)

        response_to_transactions_map: Mapping[AccountStatementUploadResponse, List[Transaction]] = self.get_all_transactions(
            account_statement_requests=account_statement_requests,
            extension_to_statement_reader_mapping=extension_to_statement_reader_mapping

        )
        transactions: List[Transaction] = StatementUploader.filter_out_duplicate_transactions(
            transactions=list(response_to_transactions_map.values()))
        self.transaction_service.save(transactions)
        return list(response_to_transactions_map.keys())

    def get_all_transactions(self, account_statement_requests: List[AccountStatementUploadRequest],
                             extension_to_statement_reader_mapping: Mapping[AccountExtensionData, StatementReader]) -> Mapping[AccountStatementUploadResponse, List[Transaction]]:
        result: Mapping[AccountStatementUploadResponse, List[Transaction]] = {}

        for request in account_statement_requests:

            file_extension = request.extension.strip().lower()
            account_id: int = request.account_id
            transactions = []
            status = False
            error_messages = []
            statement_reader = extension_to_statement_reader_mapping.get(AccountExtensionData(account_id=account_id, extension=file_extension))

            if statement_reader is None:
                status = False
                error_messages.append(f"No statement reader found for request - {request}")
            else:
                try:
                    file, file_conversion_status = self.convert_file_to_bytes(request)
                    if not file_conversion_status:
                        status = False
                        error_messages.append("Unable to read file from base64 encoded string")
                    else:
                        transactions = statement_reader.read_statement(request=request, file=file)
                        status = True
                except Exception as e:
                    status = False
                    error_messages.append(f"Exception occurred while fetching transactions for request - {request}. Exception - {e}")

            response: AccountStatementUploadResponse = AccountStatementUploadResponse(
                request_id=request.request_id,
                status=status,
                transaction_count = len(transactions),
                error_messages=error_messages
            )
            result[response] = transactions
        return result

    def convert_file_to_bytes(self, request) -> (bytes, bool):
        try:
            file = base64.b64decode(request.file)
            return file, True
        except Exception as e:
            error_message = f"Exception occurred while converting converting base 64 encoded to bytes array. Request - {request}"
            print(error_message, e)
            return None, False


    @staticmethod
    def filter_out_duplicate_transactions(transactions: List[List[Transaction]]) -> List[Transaction]:
        result = {}
        for transaction_list in transactions:
            for transaction in transaction_list:
                result[transaction.transaction_id] = transaction
        return list(result.values())

    def get_extension_to_statement_reader_mapping(self, account_statement_requests) -> Mapping[AccountExtensionData, StatementReader]:
        requested_file_extensions: Set[str] = {statement.extension.lower().strip() for statement in
                                               account_statement_requests if
                                               statement is not None and statement.extension is not None}

        requested_account_ids: Set[int] = {statement.account_id for statement in account_statement_requests if
                                           statement is not None and statement.account_id is not None}

        extension_to_statement_reader_mapping: Mapping[
            AccountExtensionData, StatementReader] = self.account_statement_reader_factory.get_extension_to_statement_reader_mapping(
            account_ids=requested_account_ids, extensions=requested_file_extensions)
        return extension_to_statement_reader_mapping
