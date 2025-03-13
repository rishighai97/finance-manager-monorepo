from contextlib import closing
from typing import List, override
from datetime import datetime

from config.config_manager import ConfigManager
from config.postgres import Postgres
from model.transaction import Transaction
from utils.datetime_utils import get_datetime_string_or_none

class TransactionDao:
    def fetch_all(self, user_account_ids: List[int], start_date: str, end_date: str) -> List[Transaction]:
        pass


class TransactionPostgresDao(TransactionDao):

    @override
    def fetch_all(self, user_account_ids: List[int], start_date: str, end_date: str) -> List[Transaction]:
        print(
            f"Fetching user transactions for user accounts {user_account_ids}, start date {start_date}, end date {end_date} from postgres")
        user_account_id_string = ','.join("{}".format(_id) for _id in user_account_ids)
        sql = f'''
                        select
                            id,
                            date,
                            user_account_id ,
                            title,
                            amount,
                            debit_credit_indicator ,
                            closing_balance,
                            category_id ,
                            units,
                            price_per_unit
                        from
                            transaction
                        where user_account_id in ({user_account_id_string}) and date between '{start_date}' and '{end_date}';
                    '''
        result_sets = ConfigManager.postgres.execute_queries_in_transaction(
            [lambda cur: Postgres.execute_select_statement(cur=cur, sql=sql)])

        user_transactions : List[Transaction]= []
        for result_set in result_sets:
            transactions = []
            for row in result_set:

                _id: str = str(row[0]) if row[0] is not None else None
                date: str = get_datetime_string_or_none(row[1], '%Y-%m-%d')
                user_account_id: int = int(row[2]) if row[2] is not None else None
                title: str = str(row[3]) if row[3] is not None else None
                debit_or_credit_amount: float = float(row[4]) if row[4] is not None else None
                is_debit_or_credit: str = str(row[5]) if row[5] is not None else None
                closing_balance: float = float(row[6]) if row[6] is not None else None
                category_id: int = int(row[7]) if row[7] is not None else None
                units: int = int(row[8]) if row[8] is not None else None
                price_per_unit: int = int(row[9]) if row[9] is not None else None


                if date is None:
                    raise Exception(f"invalid date {row[1]} received for request")
                transaction: Transaction = Transaction(_id=_id, date=date, user_account_id=user_account_id, title=title, debit_or_credit_amount=debit_or_credit_amount,
                             is_debit_or_credit=is_debit_or_credit, closing_balance=closing_balance, category_id=category_id, units=units,
                             price_per_unit=price_per_unit)
                transactions.append(transaction)
            user_transactions.extend(transactions)
        print(
            f"Fetched {len(user_transactions)} user transactions for user accounts {user_account_ids}, start date {start_date}, end date {end_date} from postgres")
        return user_transactions
