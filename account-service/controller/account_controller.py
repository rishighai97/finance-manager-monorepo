import json
from typing import List

from flask import Blueprint, request
from flask_cors import cross_origin
from werkzeug.exceptions import BadRequest

from service.account_service import AccountService

blueprint = Blueprint('account_controller', __name__,url_prefix='/account/v1')
service = AccountService()

@blueprint.route(rule="/healthcheck", methods=['GET'])
def healthcheck():
    return "Account API is up and running!"


def validate_and_get_user_ids() -> List[int]:
    if 'user_ids' not in request.args.keys():
        raise BadRequest(f"Please pass user_account_ids in request")
    user_ids: List[int] = []
    user_id_list: List[str] = request.args.getlist('user_ids')
    try:
        user_ids = [int(i) for i in user_id_list]
    except Exception as e:
        raise BadRequest(
            f"Invalid user_ids passed in request - {user_id_list}. Please pass valid integer ids")
    return user_ids

@blueprint.route(rule="/fetch_all", methods=['GET'])
@cross_origin()
def fetch_all_accounts_by_user_ids() -> str:
    user_ids: List[int] = validate_and_get_user_ids()
    print(f"Received request to fetch accounts for user ids {user_ids}")
    result = [record.__dict__ for record in service.get_all_accounts(user_ids=user_ids)]
    return json.dumps(result)