import os

from model.account_statement import AccountStatementExtension
from model.account_statement_upload_request import AccountStatementUploadRequest
from service.statement_reader.bank_savings.hdfc_savings_account_statement_reader import (
    HdfcSavingsAccountXlsStatementReader,
)

# The repo's own real sample HDFC statement (also used by test-automation's
# statement_upload scenarios) - using it here means read_statement() is
# exercised against an actual file, not a hand-fabricated fixture that might
# not match the bank's real export format.
_HDFC_FIXTURE_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "..", "..", "..", "scripts", "statements", "HDFC.xls"
)


def load_fixture_bytes():
    with open(_HDFC_FIXTURE_PATH, "rb") as f:
        return f.read()


class TestReadStatement:

    def test_parses_the_real_sample_hdfc_statement_into_transactions(self):
        reader = HdfcSavingsAccountXlsStatementReader()
        request = AccountStatementUploadRequest(
            account_id=1, user_id=1, user_account_id=1,
            file="", file_name="HDFC.xls", file_extension="xls", request_id="test-1",
        )

        transactions = reader.read_statement(request=request, file=load_fixture_bytes())

        assert len(transactions) > 0
        first = transactions[0]
        assert first.user_account_id == 1
        assert first.closing_balance is not None
        assert first.is_debit_or_credit in ("DR", "CR")
        assert first.debit_or_credit_amount > 0


class TestReaderIdentity:

    def test_reports_its_account_version_and_extension(self):
        reader = HdfcSavingsAccountXlsStatementReader()

        assert reader.account_id() == 1
        assert reader.version() == 1
        assert reader.extension() == AccountStatementExtension.xls
