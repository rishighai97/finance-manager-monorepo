from datetime import datetime
from typing import List, override, Set

from config.config_manager import ConfigManager
from config.postgres import Postgres
from model.account_statement import AccountStatement

class AccountStatementDao:
    def get_account_statements(self, account_ids: Set[int], extensions: Set[str], timestamp: datetime) -> List[AccountStatement]:
        pass

class AccountStatementPostgresDao(AccountStatementDao):
    def __init__(self):
        pass

    @override
    def get_account_statements(self, account_ids: Set[int], extensions: Set[str], timestamp: datetime) -> List[AccountStatement]:
        print(f"Getting account statements for account_ids : {account_ids}, extensions : {extensions} and timestamp {timestamp} from postgres")
        extensions_string = ','.join("'{}'".format(_id) for _id in extensions)
        sql = f'''
        select extension, version, start_time, end_time, account_id 
        from account_statement 
        where account_id in ({','.join([str(_id) for _id in account_ids ])}) and extension in ({extensions_string}) and '{timestamp.strftime("%Y-%m-%d %H:%M:%S")}' between start_time and end_time
        '''
        result_sets = ConfigManager.postgres.execute_queries_in_transaction([lambda cur: Postgres.execute_select_statement(cur=cur, sql=sql)])

        account_statements = []
        for result_set in result_sets:
            account_statements.extend([AccountStatement(extension=row[0], version=row[1], start_time=row[2], end_time=row[3], account_id=row[4]) for row in result_set])
        return account_statements