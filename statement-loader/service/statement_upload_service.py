from flask import Request
from werkzeug.exceptions import BadRequest


class StatementUploadService:

    def upload_statement(self, api_request: Request):
        StatementUploadService.validate_http_request(api_request=api_request)

    @staticmethod
    def validate_http_request(api_request: Request):
        files = api_request.files
        if files is None or len(files) == 0:
            raise BadRequest("No statements attached in API request")
