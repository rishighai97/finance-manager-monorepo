from datetime import datetime, UTC
from unittest.mock import MagicMock

from model.account_statement import AccountExtensionData, AccountStatement
from service.statement_reader.statement_reader import StatementReader, StatementReaderKey
from service.statement_reader.statement_reader_factory import StatementReaderFactory, get_statement_readers


class TestGetStatementReaders:

    def test_the_real_reader_set_has_no_key_collisions(self):
        # get_statement_readers() raises on any (account_id, version, extension)
        # collision - calling it against the real, already-imported reader
        # classes doubles as a regression check that no two readers were
        # accidentally registered for the same key.
        readers = get_statement_readers()

        assert len(readers) > 0
        for key, reader in readers.items():
            assert isinstance(reader, StatementReader)

    def test_raises_when_two_readers_share_the_same_key(self, monkeypatch):
        # Deliberately NOT subclassing the real StatementReader ABC here: doing
        # so would permanently register these under StatementReader.__subclasses__(),
        # which would leak into any later real (unmocked) get_all_subclasses()
        # call in this process and could make an unrelated test see a false
        # collision. get_statement_readers() never checks isinstance - it just
        # instantiates whatever get_all_subclasses() hands back - so a bare
        # class with the three lookup methods is enough.
        class FakeReaderA:
            def account_id(self):
                return 999

            def version(self):
                return 1

            def extension(self):
                return "fake"

        class FakeReaderB:
            def account_id(self):
                return 999

            def version(self):
                return 1

            def extension(self):
                return "fake"

        monkeypatch.setattr(
            "service.statement_reader.statement_reader_factory.import_subclasses_from_package",
            lambda package_name: None,
        )
        monkeypatch.setattr(
            "service.statement_reader.statement_reader_factory.get_all_subclasses",
            lambda cls: {FakeReaderA, FakeReaderB},
        )

        try:
            get_statement_readers()
            assert False, "expected a collision Exception to be raised"
        except Exception as e:
            assert "Multiple statement reader objects found" in str(e)


class TestGetExtensionToStatementReaderMapping:

    def test_maps_matched_statements_to_their_cached_reader(self, monkeypatch):
        factory = StatementReaderFactory.__new__(StatementReaderFactory)
        factory.account_statement_service = MagicMock()

        key = StatementReaderKey(account_id=1, version=1, extension="xls")
        statement = AccountStatement(extension="xls", version=1, start_time=datetime.now(UTC), end_time=datetime.now(UTC), account_id=1)
        factory.account_statement_service.get_account_statement_mapping.return_value = {key: statement}

        fake_reader = MagicMock(spec=StatementReader)
        monkeypatch.setattr(StatementReaderFactory, "statement_reader_cache", {key: fake_reader})

        result = factory.get_extension_to_statement_reader_mapping(account_ids={1}, extensions={"xls"})

        assert result == {AccountExtensionData(account_id=1, extension="xls"): fake_reader}

    def test_skips_a_matched_statement_when_no_reader_is_registered_for_its_key(self, monkeypatch):
        factory = StatementReaderFactory.__new__(StatementReaderFactory)
        factory.account_statement_service = MagicMock()

        key = StatementReaderKey(account_id=1, version=1, extension="xls")
        statement = AccountStatement(extension="xls", version=1, start_time=datetime.now(UTC), end_time=datetime.now(UTC), account_id=1)
        factory.account_statement_service.get_account_statement_mapping.return_value = {key: statement}

        monkeypatch.setattr(StatementReaderFactory, "statement_reader_cache", {})

        result = factory.get_extension_to_statement_reader_mapping(account_ids={1}, extensions={"xls"})

        assert result == {}


class TestStatementReaderKey:

    def test_equal_when_all_three_fields_match(self):
        assert StatementReaderKey(account_id=1, version=1, extension="xls") == StatementReaderKey(account_id=1, version=1, extension="xls")

    def test_not_equal_when_any_field_differs(self):
        assert StatementReaderKey(account_id=1, version=1, extension="xls") != StatementReaderKey(account_id=2, version=1, extension="xls")

    def test_not_equal_to_a_different_type(self):
        assert StatementReaderKey(account_id=1, version=1, extension="xls") != "not-a-key"

    def test_usable_as_a_dict_key(self):
        d = {StatementReaderKey(account_id=1, version=1, extension="xls"): "reader"}

        assert d[StatementReaderKey(account_id=1, version=1, extension="xls")] == "reader"
