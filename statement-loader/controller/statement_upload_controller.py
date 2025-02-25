import json

import flask
from flask import Blueprint, request, jsonify, Request
import pandas as pd
from werkzeug.exceptions import BadRequest, HTTPException, abort

from service.hdfc_statement_uploader import HdfcStatementUploader
from service.statement_upload_service import StatementUploadService
from statement_reader.hdfc_statement_reader import HdfcStatementReader

blueprint = Blueprint('statement_upload_controller', __name__,url_prefix='/statement/upload/v1')
service = StatementUploadService()

@blueprint.route(rule="/healthcheck", methods=['GET'])
def healthcheck():
    return "<p>Statement API is up and running!</p>"


@blueprint.route(rule="/hdfc", methods=['POST'])
def hdfc():
    print("Received request to upload hdfc statement")
    HdfcStatementUploader().upload_statement(api_request=request)
    return "<p>Statement API is up and running!</p>"


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
