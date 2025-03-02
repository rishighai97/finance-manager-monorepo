from datetime import datetime, UTC
from typing import Mapping, Type, List, Set

from model.account import Account
from model.account_statement import AccountStatement, AccountExtensionData
from service.account_statement_service import AccountStatementService
from utils.env_utils import import_subclasses_from_package, get_all_subclasses
from service.statement_reader.statement_reader import StatementReader, StatementReaderKey


def get_statement_readers() -> Mapping[StatementReaderKey, StatementReader]:
    map = {}
    import_subclasses_from_package(package_name="service.statement_reader")
    for _class in get_all_subclasses(cls=StatementReader):
        instance: StatementReader = _class()  # Create an instance of the subclass
        key: StatementReaderKey = StatementReaderKey(account_id=instance.account_id(), version=instance.version(),
                                                     extension=instance.extension())
        if key in map:
            raise Exception(f"Multiple statement reader objects found for key - {key}")
        map[key] = instance
    return map


class StatementReaderFactory:
    statement_reader_cache: Mapping[StatementReaderKey, StatementReader] = get_statement_readers()

    def __init__(self):
        self.account_statement_service = AccountStatementService()

    def get_extension_to_statement_reader_mapping(self, account_ids: Set[int], extensions: Set[str]) -> Mapping[
        AccountExtensionData, StatementReader]:
        extension_to_statement_mapping: Mapping[
            StatementReaderKey, AccountStatement] = self.account_statement_service.get_account_statement_mapping(
            account_ids=account_ids, extensions=extensions, timestamp=datetime.now(UTC))

        result = {}
        for key, statement in extension_to_statement_mapping.items():
            reader = StatementReaderFactory.statement_reader_cache.get(key)
            if reader is None:
                print(f"No statement reader found for statement - {statement}")
            else:
                result[AccountExtensionData(account_id=key.account_id, extension=key.extension)] = reader

        return result
