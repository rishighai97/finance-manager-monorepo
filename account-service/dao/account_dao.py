from typing import List, override

from config.config_manager import ConfigManager
from config.postgres import Postgres
from model.user_account import UserAccount
from utils.datetime_utils import get_datetime_string_or_none


class AccountDao:
    def get_all_accounts(self, user_ids: List[int]) -> List[UserAccount]:
        pass


class AccountPostgresDao(AccountDao):

    @override
    def get_all_accounts(self, user_ids: List[int]) -> List[UserAccount]:
        print(
            f"Getting user accounts for user_ids : {user_ids} from postgres")
        user_ids_string = ','.join("{}".format(_id) for _id in user_ids)
        sql = f'''
                select  user_account_id,
                        account_id,
                        user_id,
                        account_type_id,
                        icon,
                        account_name,
                        account_type_1,
                        account_type_2,
                        account_type_3,
                        closing_balance,
                        closing_balance_date
                        from
                            (
                            select
                                ua.id as user_account_id,
                                ua.account_id as account_id,
                                ua.user_id as user_id,
                                type_id as account_type_id,
                                ai.icon as icon,
                                name as account_name,
                                type_1 as account_type_1,
                                type_2 as account_type_2,
                                type_3 as account_type_3,
                                t.closing_balance as closing_balance,
                                t.date as closing_balance_date,
                                row_number() over(partition by t.user_account_id order by date desc) as user_account_id_rank,
                                (case when t.user_account_id is not null then true else false end) as has_transactions
                            from
                                user_account ua
                            join account a on
                                ua.account_id = a.id
                            join account_type at2 on
                                at2.id = a.type_id
                            join account_icon ai on
                                a.icon_id = ai.id
                            left join transaction t on
                                ua.id = t.user_account_id
                            where
                                user_id in ({user_ids_string})
                        ) where has_transactions = false or user_account_id_rank = 1;
            '''
        result_sets = ConfigManager.postgres.execute_queries_in_transaction(
            [lambda cur: Postgres.execute_select_statement(cur=cur, sql=sql)])

        user_accounts = []


        for result_set in result_sets:
            accounts = []
            for row in result_set:
                balance = float(row[9]) if row[9] is not None else None
                balance_date = get_datetime_string_or_none(row[10], '%Y-%m-%d') if row[10] is not None else None
                accounts.append(
                    UserAccount(user_account_id=row[0], account_id=row[1], user_id=row[2],
                                account_type_id=row[3], icon=row[4], account_name=row[5], account_type_1=row[6],
                                account_type_2=row[7], account_type_3=row[8], balance=balance, balance_date=balance_date)
                )
            user_accounts.extend(accounts)
        print(
            f"Retrieved {len(user_accounts)} user accounts for user_ids : {user_ids} from postgres")
        return user_accounts
