import os

from model.account_statement import AccountStatementExtension
from model.account_statement_upload_request import AccountStatementUploadRequest
from service.statement_reader.credit_card_statement.amex_platinum_travel_xlsx_statement_reader import (
    AmexPlatinumTravelXlsxStatementReader,
)

# Synthetic fixture (see scripts/generate_dummy_statement_fixtures.py's
# build_amex_xlsx) - the real Amex sample used to build this reader is
# personal data and never leaves statement-loader/resources/onboarding_samples/.
_AMEX_FIXTURE_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "..", "..",
    "..", "test-automation", "src", "test", "resources", "fixtures", "statements", "amex.xlsx",
)


def load_fixture_bytes():
    with open(_AMEX_FIXTURE_PATH, "rb") as f:
        return f.read()


class TestReadStatement:

    def test_parses_the_synthetic_amex_fixture(self):
        reader = AmexPlatinumTravelXlsxStatementReader()
        request = AccountStatementUploadRequest(
            account_id=8, user_id=1, user_account_id=1,
            file="", file_name="amex.xlsx", file_extension="xlsx", request_id="test-1",
        )

        transactions = reader.read_statement(request=request, file=load_fixture_bytes())

        assert len(transactions) == 4
        for t in transactions:
            assert t.user_account_id == 1
            assert t.is_debit_or_credit in ("DR", "CR")
            assert t.debit_or_credit_amount > 0
            assert t.category_id is None

    def test_derives_debit_or_credit_from_the_amount_sign(self):
        # Amex convention: a positive Amount is a charge (DR), a negative
        # Amount is a payment/credit received (CR) - see the reader.
        reader = AmexPlatinumTravelXlsxStatementReader()
        request = AccountStatementUploadRequest(
            account_id=8, user_id=1, user_account_id=1,
            file="", file_name="amex.xlsx", file_extension="xlsx", request_id="test-2",
        )

        transactions = reader.read_statement(request=request, file=load_fixture_bytes())

        payment = next(t for t in transactions if t.title == "Payment Received. Thank You")
        assert payment.is_debit_or_credit == "CR"
        charges = [t for t in transactions if t.title != "Payment Received. Thank You"]
        assert charges
        for t in charges:
            assert t.is_debit_or_credit == "DR"


class TestReaderIdentity:

    def test_reports_its_account_version_and_extension(self):
        reader = AmexPlatinumTravelXlsxStatementReader()

        assert reader.account_id() == 8
        assert reader.version() == 1
        assert reader.extension() == AccountStatementExtension.xlsx
