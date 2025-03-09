import json
from typing import List

from flask import Blueprint, request
from flask_cors import cross_origin

from service.account_service import AccountService

blueprint = Blueprint('account_controller', __name__,url_prefix='/account/v1')
service = AccountService()

@blueprint.route(rule="/healthcheck", methods=['GET'])
def healthcheck():
    return "<p>Account API is up and running!</p>"

@blueprint.route(rule="/fetch_all", methods=['GET'])
@cross_origin()
def fetch_all_accounts_by_user_ids() -> str:
    user_ids: List[int] = [int(i) for i in request.args.getlist('user_ids')]
    print(f"Received request to fetch accounts for user ids {user_ids}")
    result = [record.__dict__ for record in service.get_all_accounts(user_ids=user_ids)]
    return json.dumps(result)