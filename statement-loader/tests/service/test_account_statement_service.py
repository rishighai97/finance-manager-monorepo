from datetime import datetime, UTC
from unittest.mock import MagicMock

from model.account_statement import AccountStatement
from service.account_statement_service import AccountStatementService
from service.statement_reader.statement_reader import StatementReaderKey


def make_service_with_mock_dao(statements):
    service = AccountStatementService.__new__(AccountStatementService)
    service.dao = MagicMock()
    service.dao.get_account_statements.return_value = statements
    return service


def make_statement(account_id=1, version=1, extension="xls"):
    now = datetime.now(UTC)
    return AccountStatement(extension=extension, version=version, start_time=now, end_time=now, account_id=account_id)


class TestGetAccountStatementMapping:

    def test_maps_each_statement_by_its_reader_key(self):
        statement = make_statement(account_id=1, version=1, extension="xls")
        service = make_service_with_mock_dao([statement])

        result = service.get_account_statement_mapping(account_ids={1}, extensions={"xls"}, timestamp=datetime.now(UTC))

        key = StatementReaderKey(account_id=1, version=1, extension="xls")
        assert result == {key: statement}

    def test_keeps_the_first_statement_when_two_share_the_same_key(self):
        first = make_statement(account_id=1, version=1, extension="xls")
        second = make_statement(account_id=1, version=1, extension="xls")
        service = make_service_with_mock_dao([first, second])

        result = service.get_account_statement_mapping(account_ids={1}, extensions={"xls"}, timestamp=datetime.now(UTC))

        key = StatementReaderKey(account_id=1, version=1, extension="xls")
        assert result[key] is first

    def test_returns_an_empty_mapping_when_the_dao_finds_nothing(self):
        service = make_service_with_mock_dao([])

        result = service.get_account_statement_mapping(account_ids={1}, extensions={"xls"}, timestamp=datetime.now(UTC))

        assert result == {}
