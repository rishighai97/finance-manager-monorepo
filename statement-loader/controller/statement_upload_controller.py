import json
from typing import List

from flask import Blueprint, request
from flask_cors import CORS, cross_origin
from werkzeug.exceptions import BadRequest

from model.account_statement_upload_request import AccountStatementUploadRequest
from model.account_statement_upload_response import AccountStatementUploadResponse
from service.statement_uploader import StatementUploader

blueprint = Blueprint('statement_upload_controller', __name__,url_prefix='/statement/upload/v1')
service = StatementUploader()

@blueprint.route(rule="/healthcheck", methods=['GET'])
def healthcheck():
    return "<p>Statement API is up and running!</p>"


@blueprint.route(rule="/", methods=['POST'])
@cross_origin()
def upload_statements() -> str:
    print("Received request to upload statements")
    account_statement_requests: List[AccountStatementUploadRequest] = get_account_statement_requests()
    result = [record.__dict__ for record in service.upload_statement(account_statement_requests=account_statement_requests)]
    return json.dumps(result)

def get_account_statement_requests() -> List[AccountStatementUploadRequest]:
    if request is None or request.json is None:
        raise BadRequest("No account passed in API request")
    return [AccountStatementUploadRequest(**data) for data in request.json]

# @blueprint.errorhandler(HTTPException)
# def handle_exception(e):
#     """Return JSON instead of HTML for HTTP errors."""
#     # start with the correct headers and status code from the error
#     response = e.get_response()
#     # replace the body with JSON
#     response.data = json.dumps({
#         "code": e.code,
#         "name": e.name,
#         "description": e.description,
#     })
#     response.content_type = "application/json"
#     return response
