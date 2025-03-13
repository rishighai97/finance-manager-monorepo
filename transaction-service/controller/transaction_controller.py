import json
from typing import List

from flask import Blueprint, request
from flask_cors import cross_origin
from werkzeug.exceptions import BadRequest

from service.transaction_service import TransactionService
from utils.datetime_utils import get_datetime_or_none
from datetime import datetime

blueprint = Blueprint('transaction_controller', __name__,url_prefix='/transaction/v1')
service = TransactionService()

@blueprint.route(rule="/healthcheck", methods=['GET'])
def healthcheck():
    return "Transaction API is up and running!"




@blueprint.route(rule="/fetch_all", methods=['GET'])
@cross_origin()
def fetch_all_transactions_by_user_ids_start_date_and_end_date() -> str:
    user_account_ids: List[int] = validate_and_get_user_account_ids()
    start_date: str = validate_and_get_request_date(request_key='start_date')
    end_date: str = validate_and_get_request_date(request_key='end_date')
    print(f"Received request to fetch transactions for user ids {user_account_ids}, start date {start_date} and end date {end_date}")
    result = [record.__dict__ for record in service.fetch_all(user_account_ids=user_account_ids, start_date=start_date, end_date=end_date)]
    return json.dumps(result)


def validate_and_get_user_account_ids() -> List[int]:
    if 'user_account_ids' not in request.args.keys():
        raise BadRequest(f"Please pass user_account_ids in request")
    user_account_ids: List[int] = []
    user_account_id_list: List[str] = request.args.getlist('user_account_ids')
    try:
        user_account_ids = [int(i) for i in user_account_id_list]
    except Exception as e:
        raise BadRequest(
            f"Invalid user_account_ids passed in request - {user_account_id_list}. Please pass valid integer ids")

    if len(user_account_ids) == 0:
        raise BadRequest(f"Please pass valid list of user_account_ids in request")
    return user_account_ids

def validate_and_get_request_date(request_key):

    if request_key not in request.args.keys():
        raise BadRequest(f"Please pass key - {request_key} in request")
    date_str: str = request.args.get(request_key)
    date: datetime =  get_datetime_or_none(datetime_string=date_str, format='%Y-%m-%d')
    if date is None:
        raise BadRequest(f"Invalid date passed in request - {date_str}. Valid date format - yyyy-MM-dd")
    return date_str