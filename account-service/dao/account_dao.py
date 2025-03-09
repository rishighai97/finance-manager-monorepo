from typing import List, override

from config.config_manager import ConfigManager
from config.postgres import Postgres
from dto.user_account import UserAccount


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
                select
                    ua.id as user_account_id,
                    ua.account_id,
                    ua.user_id,
                    type_id as account_type_id,
                    ai.icon as icon,
                    name as account_name,
                    type_1 as account_type_1,
                    type_2 as account_type_2,
                    type_3 as account_type_3
                from
                    user_account ua
                join account a on
                    ua.account_id = a.id
                join account_type at2 on
                    at2.id = a.type_id
                join account_icon ai on
                    a.icon_id = ai.id
                where
                    user_id in ({user_ids_string})
            '''
        result_sets = ConfigManager.postgres.execute_queries_in_transaction(
            [lambda cur: Postgres.execute_select_statement(cur=cur, sql=sql)])

        user_accounts = []
        for result_set in result_sets:
            user_accounts.extend([UserAccount(user_account_id=row[0], account_id=row[1], user_id=row[2],
                                              account_type_id=row[3], icon=row[4], account_name=row[5], account_type_1=row[6],
                                              account_type_2=row[7], account_type_3=row[8]) for row in result_set])
        print(
            f"Retrieved {len(user_accounts)} user accounts for user_ids : {user_ids} from postgres")
        return user_accounts
