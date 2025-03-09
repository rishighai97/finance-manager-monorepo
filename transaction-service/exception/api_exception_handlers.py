from flask import json, Blueprint
from werkzeug.exceptions import HTTPException


blueprint = Blueprint('error_handler', __name__)

@blueprint.app_errorhandler(HTTPException)
def handle_exception(e):
    """Return JSON instead of HTML for HTTP errors."""
    # start with the correct headers and status code from the error
    response = e.get_response()
    # replace the body with JSON
    response.data = json.dumps({
        "error_code": e.code,
        "error_title": e.name,
        "error_description": e.description,
    })
    response.content_type = "application/json"
    return response