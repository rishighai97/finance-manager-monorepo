import pandas as pd
import xlrd
import base64

from model.account import Account
from model.account_statement_upload_request import AccountStatementUploadRequest
from utils.env_utils import setup_environment_variables
setup_environment_variables()
from app import setup_app, run_app
from datetime import datetime, UTC

def test_account_statement_service():
    from service.account_statement_service import AccountStatementService
    service = AccountStatementService()
    data = service.get_account_statement_mapping(account_id=1, timestamp=datetime.now(UTC))
    print("done")

def test_statement_reader_factory():
    from service.statement_reader.statement_reader_factory import StatementReaderFactory
    service = StatementReaderFactory()
    data = service.get_extension_to_statement_reader_mapping(account_ids={1}, extensions={'xls', 'pdf'})
    print("done")

def test_statement_uploader():
    from service.statement_uploader import StatementUploader
    service = StatementUploader()
    records = get_excel_byte_array(file_path='../statements/HDFC.xls')
    base64_encoded = base64.b64encode(records).decode('utf-8')
    data = service.upload_statement(account_statement_requests=[
        AccountStatementUploadRequest(
            request_id="1",
            account_id=1,
            user_id=1,
            file_extension="xls",
            file=base64_encoded
        )
    ])
    print("done")

def get_excel_byte_array(file_path: str) -> bytes:
    with open(file_path, 'rb') as file:
        return file.read()

if __name__ == '__main__':
    setup_app()
    # test_account_statement_service()
    # test_statement_reader_factory()
    test_statement_uploader()