from flask import Blueprint, request

from service.hdfc_statement_uploader import HdfcStatementUploader
from service.statement_uploader import StatementUploader

blueprint = Blueprint('statement_upload_controller', __name__,url_prefix='/statement/upload/v1')
service = StatementUploader()

@blueprint.route(rule="/healthcheck", methods=['GET'])
def healthcheck():
    return "<p>Statement API is up and running!</p>"


@blueprint.route(rule="/hdfc", methods=['POST'])
def hdfc():
    print("Received request to upload hdfc statement")
    count : int = HdfcStatementUploader().upload_statement(api_request=request)
    return f'Saved {count} hdfc transactions'


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
