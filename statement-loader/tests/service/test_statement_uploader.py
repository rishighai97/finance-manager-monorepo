import base64
from datetime import datetime
from unittest.mock import MagicMock

import pytest

from model.account_statement import AccountExtensionData
from model.account_statement_upload_request import AccountStatementUploadRequest
from model.transaction import Transaction
from service.statement_uploader import StatementUploader


def make_request(account_id=1, extension="xls", request_id="req-1"):
    return AccountStatementUploadRequest(
        account_id=account_id,
        user_id=1,
        user_account_id=1,
        file=base64.b64encode(b"fake file contents").decode(),
        file_name="statement.xls",
        file_extension=extension,
        request_id=request_id,
    )


def make_transaction(transaction_id, user_account_id=1):
    return Transaction(
        date=datetime(2026, 9, 1),
        user_account_id=user_account_id,
        title="Test txn",
        debit_or_credit_amount=100.0,
        is_credit_amount=True,
        transaction_id=transaction_id,
        closing_balance=1000.0,
    )


@pytest.fixture
def uploader():
    # Bypass __init__ entirely so real TransactionService()/StatementReaderFactory()
    # (and their real HTTP/DB-adjacent construction paths) are never touched -
    # both collaborators are injected as mocks instead.
    instance = StatementUploader.__new__(StatementUploader)
    instance.transaction_service = MagicMock()
    instance.account_statement_reader_factory = MagicMock()
    return instance


class TestFilterOutDuplicateTransactions:

    def test_keeps_one_transaction_per_unique_id(self):
        txn1 = make_transaction("t1")
        txn2 = make_transaction("t2")

        result = StatementUploader.filter_out_duplicate_transactions([[txn1, txn2]])

        assert {t.transaction_id for t in result} == {"t1", "t2"}

    def test_deduplicates_transactions_sharing_an_id_across_requests(self):
        original = make_transaction("t1")
        duplicate = make_transaction("t1")

        result = StatementUploader.filter_out_duplicate_transactions([[original], [duplicate]])

        assert len(result) == 1

    def test_returns_empty_list_for_no_transactions(self):
        assert StatementUploader.filter_out_duplicate_transactions([]) == []


class TestConvertFileToBytes(object):

    def test_decodes_valid_base64(self, uploader):
        request = make_request()

        file_bytes, success = uploader.convert_file_to_bytes(request)

        assert success is True
        assert file_bytes == b"fake file contents"

    def test_returns_failure_tuple_for_invalid_base64_without_raising(self, uploader):
        request = make_request()
        request.file = "not-valid-base64!!!"

        file_bytes, success = uploader.convert_file_to_bytes(request)

        assert success is False
        assert file_bytes is None


class TestGetExtensionToStatementReaderMapping:

    def test_builds_lowercased_extension_and_account_id_sets(self, uploader):
        requests = [make_request(account_id=1, extension="XLS"), make_request(account_id=2, extension="csv")]

        uploader.get_extension_to_statement_reader_mapping(requests)

        call_kwargs = uploader.account_statement_reader_factory.get_extension_to_statement_reader_mapping.call_args.kwargs
        assert call_kwargs["extensions"] == {"xls", "csv"}
        assert call_kwargs["account_ids"] == {1, 2}


class TestGetAllTransactions:

    def test_records_success_when_a_reader_is_found_and_parses_cleanly(self, uploader):
        request = make_request(account_id=1, extension="xls")
        reader = MagicMock()
        reader.read_statement.return_value = [make_transaction("t1")]
        mapping = {AccountExtensionData(account_id=1, extension="xls"): reader}

        result = uploader.get_all_transactions([request], mapping)

        response = list(result.keys())[0]
        assert response.status is True
        assert response.transaction_count == 1
        assert response.error_messages == []

    def test_records_failure_when_no_reader_matches(self, uploader):
        request = make_request(account_id=99, extension="pdf")

        result = uploader.get_all_transactions([request], {})

        response = list(result.keys())[0]
        assert response.status is False
        assert "No statement reader found" in response.error_messages[0]

    def test_records_failure_when_the_reader_raises(self, uploader):
        request = make_request(account_id=1, extension="xls")
        reader = MagicMock()
        reader.read_statement.side_effect = ValueError("corrupt file")
        mapping = {AccountExtensionData(account_id=1, extension="xls"): reader}

        result = uploader.get_all_transactions([request], mapping)

        response = list(result.keys())[0]
        assert response.status is False
        assert "corrupt file" in response.error_messages[0]

    def test_records_failure_when_the_file_cannot_be_base64_decoded(self, uploader):
        request = make_request(account_id=1, extension="xls")
        request.file = "not-valid-base64!!!"
        reader = MagicMock()
        mapping = {AccountExtensionData(account_id=1, extension="xls"): reader}

        result = uploader.get_all_transactions([request], mapping)

        response = list(result.keys())[0]
        assert response.status is False
        assert "Unable to read file" in response.error_messages[0]
        reader.read_statement.assert_not_called()


class TestUploadStatement:

    def test_saves_deduplicated_transactions_and_returns_one_response_per_request(self, uploader):
        request = make_request(account_id=1, extension="xls", request_id="req-1")
        reader = MagicMock()
        reader.read_statement.return_value = [make_transaction("t1")]
        uploader.account_statement_reader_factory.get_extension_to_statement_reader_mapping.return_value = {
            AccountExtensionData(account_id=1, extension="xls"): reader
        }

        responses = uploader.upload_statement([request])

        assert len(responses) == 1
        assert responses[0].status is True
        uploader.transaction_service.save.assert_called_once()
        saved_transactions = uploader.transaction_service.save.call_args.args[0]
        assert [t.transaction_id for t in saved_transactions] == ["t1"]
