import os

from model.account_statement import AccountStatementExtension
from model.account_statement_upload_request import AccountStatementUploadRequest
from service.statement_reader.bank_savings.hdfc_savings_account_pdf_v2_statement_reader import (
    HdfcSavingsAccountPdfV2StatementReader,
)

# Synthetic fixture for a hypothetical v2 layout - a format-drift exercise
# for jira/JIRA_11.md's statement-onboard skill, not a real HDFC change.
_HDFC_PDF_V2_FIXTURE_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "..", "..",
    "..", "test-automation", "src", "test", "resources", "fixtures", "statements", "hdfc_v2.pdf",
)


def load_fixture_bytes():
    with open(_HDFC_PDF_V2_FIXTURE_PATH, "rb") as f:
        return f.read()


class TestReadStatement:

    def test_parses_the_v2_layout_synthetic_fixture(self):
        reader = HdfcSavingsAccountPdfV2StatementReader()
        request = AccountStatementUploadRequest(
            account_id=1, user_id=1, user_account_id=1,
            file="", file_name="hdfc_v2.pdf", file_extension="pdf", request_id="test-1",
        )

        transactions = reader.read_statement(request=request, file=load_fixture_bytes())

        assert len(transactions) == 3
        for t in transactions:
            assert t.user_account_id == 1
            assert t.closing_balance is not None
            assert t.is_debit_or_credit in ("DR", "CR")
            assert t.debit_or_credit_amount > 0

    def test_derives_debit_or_credit_from_the_balance_delta(self):
        reader = HdfcSavingsAccountPdfV2StatementReader()
        request = AccountStatementUploadRequest(
            account_id=1, user_id=1, user_account_id=1,
            file="", file_name="hdfc_v2.pdf", file_extension="pdf", request_id="test-2",
        )

        transactions = reader.read_statement(request=request, file=load_fixture_bytes())

        balance = 75000.0  # the v2 fixture's own opening balance (see build_hdfc_pdf_v2)
        for t in transactions:
            balance = balance + t.debit_or_credit_amount if t.is_debit_or_credit == "CR" else balance - t.debit_or_credit_amount
            assert abs(balance - t.closing_balance) < 0.01


class TestReaderIdentity:

    def test_reports_a_different_version_than_v1_for_the_same_account_and_extension(self):
        reader = HdfcSavingsAccountPdfV2StatementReader()

        assert reader.account_id() == 1
        assert reader.version() == 2
        assert reader.extension() == AccountStatementExtension.pdf