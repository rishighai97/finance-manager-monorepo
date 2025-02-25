from flask import Request
from typing_extensions import override

from service.statement_upload_service import StatementUploadService


class HdfcStatementUploader(StatementUploadService):
    pass