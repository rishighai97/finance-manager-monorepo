from datetime import datetime
from typing import List, Mapping, Set

from dao.account_statement_dao import AccountStatementDao, AccountStatementPostgresDao
from model.account_statement import AccountStatement
from service.statement_reader.statement_reader import StatementReaderKey


class AccountStatementService:
    def __init__(self):
        self.dao: AccountStatementDao = AccountStatementPostgresDao()

    def get_account_statement_mapping(self, account_ids: Set[int], extensions: Set[str] , timestamp: datetime) -> Mapping[StatementReaderKey, AccountStatement]:
        account_statements : List[AccountStatement] = self.dao.get_account_statements(account_ids=account_ids, extensions=extensions, timestamp=timestamp)
        print(f"Received {len(account_statements)} account statement for account_ids : {account_ids} , extensions: {extensions} and timestamp {timestamp}")
        _map = {}
        for statement in account_statements:
            key = StatementReaderKey(account_id=statement.account_id, version=statement.version, extension=statement.extension)
            if key in _map:
                print(f"Duplicate statement key {key} found in statement {statement}")
            else:
                _map[key] = statement
        return _map