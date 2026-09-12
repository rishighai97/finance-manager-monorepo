#!/usr/bin/env python3
"""
Generates synthetic (non-personal) bank/broker statement fixture files, one
per statement-loader reader, for test-automation's BDD suite (see JIRA_8).

Each fixture has 3-4 transactions with titles drawn from a small fixed pool
and randomized-but-realistic amounts, using a per-file fixed random seed so
re-running this script produces byte-identical output (fixtures are static,
committed files - not regenerated per test run).

Every fixture is immediately re-read through the REAL statement-loader
reader class that will parse it in production, and the parsed result is
asserted against what was intended - this is the actual verification that
each fixture is valid, not just "looks right" by eye.

Run from the repo root:
    .venv/bin/python scripts/generate_dummy_statement_fixtures.py

Pass --out-dir to write the same verified fixtures somewhere other than
test-automation's resource tree (e.g. for the ux-proof-capture skill's
manual UI walkthroughs, which upload real files through the browser rather
than exercising a reader directly) without touching the committed JIRA_8
fixtures:
    .venv/bin/python scripts/generate_dummy_statement_fixtures.py --out-dir scripts/statements/synthetic

Requires xlwt/openpyxl (test-fixture-generation-only deps, see
statement-loader/requirements.txt) in addition to statement-loader's own
requirements.
"""
import argparse
import random
import sys
from datetime import date
from io import BytesIO
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
STATEMENT_LOADER_ROOT = REPO_ROOT / "statement-loader"
FIXTURES_DIR = REPO_ROOT / "test-automation" / "src" / "test" / "resources" / "fixtures" / "statements"

sys.path.insert(0, str(STATEMENT_LOADER_ROOT))

import xlwt
import openpyxl
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from model.account_statement_upload_request import AccountStatementUploadRequest
from service.statement_reader.bank_savings.hdfc_savings_account_statement_reader import (
    HdfcSavingsAccountXlsStatementReader,
)
from service.statement_reader.bank_savings.hdfc_savings_account_pdf_statement_reader import (
    HdfcSavingsAccountPdfStatementReader,
)
from service.statement_reader.bank_savings.hdfc_savings_account_pdf_v2_statement_reader import (
    HdfcSavingsAccountPdfV2StatementReader,
)
from service.statement_reader.bank_savings.icici_savings_account_statement_reader import (
    IciciXlsSavingsAccountStatementReader,
)
from service.statement_reader.bank_savings.saraswat_savings_account_statement_reader import (
    SaraswatXlsSavingsAccountStatementReader,
)
from service.statement_reader.bank_savings.canara_savings_account_statement_reader import (
    CanaraStatementReader,
)
from service.statement_reader.bank_savings.axis_savings_account_statement_reader import (
    AxisXlsSavingsAccountStatementReader,
    AxisCsvSavingsAccountStatementReader,
)
from service.statement_reader.mutual_fund_statement.groww_mutual_fund_statement_reader import (
    GrowwStatementReader,
)
from service.statement_reader.credit_card_statement.amex_platinum_travel_xlsx_statement_reader import (
    AmexPlatinumTravelXlsxStatementReader,
)

BANK_TITLE_POOL = [
    "Grocery Store", "Salary Credit", "Electricity Bill", "ATM Withdrawal",
    "Online Purchase", "Restaurant Payment", "Mobile Recharge", "Insurance Premium",
]
MF_TITLE_POOL = [
    "Axis Bluechip Fund", "SBI Small Cap Fund", "HDFC Index Fund",
    "Parag Parikh Flexi Cap Fund", "ICICI Prudential Value Discovery Fund",
]
CC_TITLE_POOL = [
    "Grocery Store", "Online Purchase", "Restaurant Payment", "Travel Booking",
    "Payment Received. Thank You", "Mobile Recharge",
]

FIXED_YEAR = 2026  # baked-in, not "today" - see JIRA_8's fixture-dates decision

# Each fixture gets its own month, entirely non-overlapping with every other
# fixture's - including the two Axis fixtures, which otherwise share the
# same account_id/user_account_id. This lets the e2e_flow BDD scenarios
# scope "the transactions this upload produced" by an exact date range
# instead of fragile title-matching, even when two fixtures land on the
# same account.
FIXTURE_MONTHS = {
    "hdfc": 1, "icici": 2, "saraswat": 3, "canara": 4,
    "axis_xls": 5, "axis_csv": 6, "groww": 7, "hdfc_pdf": 8, "hdfc_pdf_v2": 9,
    "amex": 10,
}


def make_bank_transactions(rng, count, month):
    """Returns count dicts: title, amount, is_credit, date."""
    titles = rng.sample(BANK_TITLE_POOL, count)
    result = []
    for i, title in enumerate(titles):
        result.append({
            "title": title,
            "amount": round(rng.uniform(100, 50000), 2),
            "is_credit": title == "Salary Credit" or rng.random() < 0.3,
            "date": date(FIXED_YEAR, month, i + 1),
        })
    return result


def make_mf_transactions(rng, count, month):
    titles = rng.sample(MF_TITLE_POOL, count)
    result = []
    for i, title in enumerate(titles):
        units = rng.randint(1, 50)
        price = round(rng.uniform(20, 500), 2)
        result.append({
            "title": title,
            "units": units,
            "price_per_unit": price,
            "amount": round(units * price, 2),
            "is_purchase": rng.random() < 0.7,
            "date": date(FIXED_YEAR, month, i + 1),
        })
    return result


def make_cc_transactions(rng, count, month):
    """Amex-style: positive Amount = a charge (DR), negative Amount = a
    payment/credit received (CR) - see amex_platinum_travel_xlsx_statement_reader.py."""
    titles = rng.sample(CC_TITLE_POOL, count)
    result = []
    for i, title in enumerate(titles):
        result.append({
            "title": title,
            "amount": round(rng.uniform(100, 20000), 2),
            "is_credit": title == "Payment Received. Thank You" or rng.random() < 0.2,
            "date": date(FIXED_YEAR, month, i + 1),
        })
    return result


def running_balances(transactions, opening=50000.0):
    balance = opening
    balances = []
    for t in transactions:
        balance += t["amount"] if t["is_credit"] else -t["amount"]
        balances.append(round(balance, 2))
    return balances


# ---- HDFC xls ----

def build_hdfc_xls(transactions) -> bytes:
    wb = xlwt.Workbook()
    ws = wb.add_sheet("Statement")
    balances = running_balances(transactions)
    row = 0
    ws.write(row, 0, "Statement of Account (dummy fixture - see JIRA_8)"); row += 1
    ws.write(row, 0, "*"); row += 1
    ws.write(row, 0, "Date"); ws.write(row, 1, "Narration"); ws.write(row, 4, "Debit")
    ws.write(row, 5, "Credit"); ws.write(row, 6, "Balance"); row += 1
    ws.write(row, 0, "*"); row += 1
    for t, bal in zip(transactions, balances):
        d = t["date"]
        ws.write(row, 0, d.strftime("%d/%m/%y"))
        ws.write(row, 1, t["title"])
        if t["is_credit"]:
            ws.write(row, 5, t["amount"])
        else:
            ws.write(row, 4, t["amount"])
        ws.write(row, 6, bal)
        row += 1
    ws.write(row, 0, "*"); row += 1
    buf = BytesIO()
    wb.save(buf)
    return buf.getvalue()


# ---- HDFC pdf (JIRA_11 - closes the pre-existing "no PDF reader" gap) ----

def build_hdfc_pdf(transactions) -> bytes:
    """Mimics the real HDFC PDF export's text layout closely enough for
    HdfcSavingsAccountPdfStatementReader's line-based regex parser: a
    "Statement of account" anchor line, transaction lines shaped
    `date narration ref value_date amount balance`, and a trailing
    STATEMENTSUMMARY block carrying the opening balance. See that reader's
    module docstring/comments for exactly what it expects."""
    opening = 50000.0
    balances = running_balances(transactions, opening=opening)
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    y = 800

    def line(text):
        nonlocal y
        c.drawString(50, y, text)
        y -= 14

    line("HDFC BANK LIMITED (dummy fixture - see JIRA_8/JIRA_11)")
    line("Statement of account")
    line("Date Narration Chq./Ref.No. ValueDt WithdrawalAmt. DepositAmt. ClosingBalance")
    for i, (t, bal) in enumerate(zip(transactions, balances)):
        d = t["date"]
        date_str = d.strftime("%d/%m/%y")
        line(f"{date_str} {t['title']} REF{i + 1:06d} {date_str} {t['amount']:,.2f} {bal:,.2f}")
    dr_count = sum(1 for t in transactions if not t["is_credit"])
    cr_count = sum(1 for t in transactions if t["is_credit"])
    debits = sum(t["amount"] for t in transactions if not t["is_credit"])
    credits = sum(t["amount"] for t in transactions if t["is_credit"])
    line("STATEMENTSUMMARY :-")
    line("OpeningBalance DrCount CrCount Debits Credits ClosingBal")
    line(f"{opening:,.2f} {dr_count} {cr_count} {debits:,.2f} {credits:,.2f} {balances[-1]:,.2f}")
    c.save()
    return buf.getvalue()


# ---- HDFC pdf v2 (JIRA_11 - synthetic format-drift demonstration only,
# not based on any real future HDFC change; see
# hdfc_savings_account_pdf_v2_statement_reader.py) ----

def build_hdfc_pdf_v2(transactions) -> bytes:
    opening = 75000.0
    balances = running_balances(transactions, opening=opening)
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    y = 800

    def line(text):
        nonlocal y
        c.drawString(50, y, text)
        y -= 14

    line("HDFC BANK LIMITED (dummy v2 fixture - see JIRA_11)")
    line(f"OpeningBal: {opening:,.2f}")
    line("TRANSACTION DETAILS")
    line("Date Narration Amount Balance")
    for t, bal in zip(transactions, balances):
        d = t["date"]
        line(f"{d.strftime('%d/%m/%y')} {t['title']} {t['amount']:,.2f} {bal:,.2f}")
    c.save()
    return buf.getvalue()


# ---- ICICI xls ----

def build_icici_xls(transactions) -> bytes:
    wb = xlwt.Workbook()
    ws = wb.add_sheet("Statement")
    balances = running_balances(transactions)
    row = 0
    # pandas.read_excel consumes the sheet's physical first row as the
    # DataFrame header, so the real "S No." trigger row must start at
    # physical row 1, not row 0 (same for every xls/xlsx builder below).
    ws.write(row, 0, "ICICI Bank Statement (dummy fixture - see JIRA_8)"); row += 1
    ws.write(row, 1, "S No."); ws.write(row, 3, "Value Date"); ws.write(row, 5, "Description")
    ws.write(row, 6, "Debit"); ws.write(row, 7, "Credit"); ws.write(row, 8, "Balance"); row += 1
    for i, (t, bal) in enumerate(zip(transactions, balances)):
        d = t["date"]
        ws.write(row, 1, str(i + 1))
        ws.write(row, 3, d.strftime("%d/%m/%Y"))
        ws.write(row, 5, t["title"])
        ws.write(row, 6, t["amount"] if not t["is_credit"] else 0)
        ws.write(row, 7, t["amount"] if t["is_credit"] else 0)
        ws.write(row, 8, bal)
        row += 1
    # terminator: col1 blank -> breaks the parser's loop
    ws.write(row, 1, "")
    buf = BytesIO()
    wb.save(buf)
    return buf.getvalue()


# ---- Saraswat xls ----

def build_saraswat_xls(transactions) -> bytes:
    wb = xlwt.Workbook()
    ws = wb.add_sheet("Statement")
    balances = running_balances(transactions)
    row = 0
    ws.write(row, 0, "Saraswat Bank Statement (dummy fixture - see JIRA_8)"); row += 1
    ws.write(row, 2, "Remarks"); row += 1
    for t, bal in zip(transactions, balances):
        d = t["date"]
        indicator = "CR" if t["is_credit"] else "DR"
        ws.write(row, 2, d.strftime("%d/%m/%Y"))
        # Comma-formatted (not a bare numeric string) so pandas' Excel dtype
        # sniffer keeps this column as text rather than silently coercing it
        # to float64 - the real reader expects a string here (.strip() then
        # .replace(",", "")), matching real Indian-currency-formatted statements.
        ws.write(row, 11, f"{indicator} {t['amount']:,.2f}")
        ws.write(row, 16, f"{bal:,.2f}")
        row += 1
        ws.write(row, 2, t["title"])  # title lives on the row AFTER the date row
        row += 1
    # terminator: col2 blank -> breaks
    ws.write(row, 2, "")
    buf = BytesIO()
    wb.save(buf)
    return buf.getvalue()


# ---- Canara csv ----

def build_canara_csv(transactions) -> bytes:
    balances = running_balances(transactions)
    lines = ["Sl No,Txn Date,Value Date,Description,Ref No,Debit,Credit,Balance"]
    for i, (t, bal) in enumerate(zip(transactions, balances)):
        d = t["date"]
        debit = "" if t["is_credit"] else str(t["amount"])
        credit = str(t["amount"]) if t["is_credit"] else ""
        lines.append(f"{i + 1},{d.strftime('%d %b %Y')},{d.strftime('%d %b %Y')},{t['title']},REF{i + 1:04d},{debit},{credit},{bal}")
    lines.append("")  # terminator (blank line)
    return "\n".join(lines).encode()


# ---- Axis xls ----

def build_axis_xls(transactions) -> bytes:
    wb = xlwt.Workbook()
    ws = wb.add_sheet("Statement")
    balances = running_balances(transactions)
    row = 0
    ws.write(row, 0, "Axis Bank Statement (dummy fixture - see JIRA_8)"); row += 1
    ws.write(row, 0, "SRL NO."); ws.write(row, 1, "Tran Date"); ws.write(row, 3, "Particulars")
    ws.write(row, 4, "Debit"); ws.write(row, 5, "Credit"); ws.write(row, 6, "Balance"); row += 1
    for t, bal in zip(transactions, balances):
        d = t["date"]
        ws.write(row, 1, d.strftime("%d-%m-%Y"))
        ws.write(row, 3, t["title"])
        if t["is_credit"]:
            ws.write(row, 5, t["amount"])
        else:
            ws.write(row, 4, t["amount"])
        ws.write(row, 6, bal)  # must always be numeric - no None-safety in this reader
        row += 1
    # terminator: col1 blank -> breaks (pd.isna check)
    buf = BytesIO()
    wb.save(buf)
    return buf.getvalue()


# ---- Axis csv ----

def build_axis_csv(transactions) -> bytes:
    # Real Axis csv exports use "%d-%m-%Y" (dash, 4-digit year), not the
    # "%d/%m/%y" this fixture used to assume - see jira/JIRA_19.md, found
    # when a real export failed to parse under the old assumption.
    balances = running_balances(transactions)
    lines = ["Tran Date,Value Date,Particulars,Debit,Credit,Balance"]
    for t, bal in zip(transactions, balances):
        d = t["date"]
        debit = "" if t["is_credit"] else str(t["amount"])
        credit = str(t["amount"]) if t["is_credit"] else ""
        lines.append(f"{d.strftime('%d-%m-%Y')},{d.strftime('%d-%m-%Y')},{t['title']},{debit},{credit},{bal}")
    lines.append("")  # terminator (blank line)
    return "\n".join(lines).encode()


# ---- Groww xlsx ----

def build_groww_xlsx(transactions) -> bytes:
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Statement"
    ws.append(["Scheme Name", "Order Type", "Units", "NAV", "Amount", "Order Date"])
    ws.append(["Scheme Name", "Order Type", "Units", "NAV", "Amount", "Order Date"])
    for t in transactions:
        d = t["date"]
        ws.append([
            t["title"],
            "PURCHASE" if t["is_purchase"] else "SALE",
            t["units"],
            t["price_per_unit"],
            str(t["amount"]),
            d.strftime("%d %b %Y"),
        ])
    buf = BytesIO()
    wb.save(buf)
    return buf.getvalue()


# ---- Amex xlsx (JIRA_18) ----

def build_amex_xlsx(transactions) -> bytes:
    """Mimics the real Amex "Transaction Details" sheet export: 6 letterhead
    rows (title, "Prepared for", "Account Number", then blanks) before the
    real header row at physical row 7 - pandas.read_excel(..., skiprows=6)
    consumes exactly those 6 rows. Amount sign carries the DR/CR direction
    (see amex_platinum_travel_xlsx_statement_reader.py)."""
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Transaction Details"
    ws.append(["Card Member Statement (dummy fixture - see JIRA_18)"])
    ws.append(["Prepared for", "JOHN DOE"])
    ws.append(["Account Number", "XXXX-XXXXXX-X1234"])
    ws.append([])
    ws.append([])
    ws.append([])
    ws.append([
        "Date", "Description", "Amount", "Extended Details",
        "Appears On Your Statement As", "Address", "City/State", "Zip Code",
        "Country", "Reference", "Category",
    ])
    for i, t in enumerate(transactions):
        d = t["date"]
        signed_amount = -t["amount"] if t["is_credit"] else t["amount"]
        ws.append([
            d.strftime("%m/%d/%Y"),
            t["title"],
            signed_amount,
            None,
            t["title"],
            "123 MAIN ST",
            "SOME CITY",
            "000000",
            "IN",
            f"REF{i + 1:06d}",
            None if t["is_credit"] else "Miscellaneous-Other",
        ])
    buf = BytesIO()
    wb.save(buf)
    return buf.getvalue()


FIXTURES = [
    {
        "filename": "hdfc.xls", "seed": "hdfc", "count": 4,
        "build": build_hdfc_xls, "reader": HdfcSavingsAccountXlsStatementReader(),
        "generator": make_bank_transactions,
    },
    {
        "filename": "hdfc.pdf", "seed": "hdfc_pdf", "count": 4,
        "build": build_hdfc_pdf, "reader": HdfcSavingsAccountPdfStatementReader(),
        "generator": make_bank_transactions,
    },
    {
        "filename": "hdfc_v2.pdf", "seed": "hdfc_pdf_v2", "count": 3,
        "build": build_hdfc_pdf_v2, "reader": HdfcSavingsAccountPdfV2StatementReader(),
        "generator": make_bank_transactions,
    },
    {
        "filename": "icici.xls", "seed": "icici", "count": 4,
        "build": build_icici_xls, "reader": IciciXlsSavingsAccountStatementReader(),
        "generator": make_bank_transactions,
    },
    {
        "filename": "saraswat.xls", "seed": "saraswat", "count": 3,
        "build": build_saraswat_xls, "reader": SaraswatXlsSavingsAccountStatementReader(),
        "generator": make_bank_transactions,
    },
    {
        "filename": "canara.csv", "seed": "canara", "count": 4,
        "build": build_canara_csv, "reader": CanaraStatementReader(),
        "generator": make_bank_transactions,
    },
    {
        "filename": "axis.xls", "seed": "axis_xls", "count": 3,
        "build": build_axis_xls, "reader": AxisXlsSavingsAccountStatementReader(),
        "generator": make_bank_transactions,
    },
    {
        "filename": "axis.csv", "seed": "axis_csv", "count": 4,
        "build": build_axis_csv, "reader": AxisCsvSavingsAccountStatementReader(),
        "generator": make_bank_transactions,
    },
    {
        "filename": "groww.xlsx", "seed": "groww", "count": 3,
        "build": build_groww_xlsx, "reader": GrowwStatementReader(),
        "generator": make_mf_transactions,
    },
    {
        "filename": "amex.xlsx", "seed": "amex", "count": 4,
        "build": build_amex_xlsx, "reader": AmexPlatinumTravelXlsxStatementReader(),
        "generator": make_cc_transactions,
    },
]


def verify(spec, file_bytes, intended_transactions):
    request = AccountStatementUploadRequest(
        account_id=spec["reader"].account_id(),
        user_id=1,
        user_account_id=1,
        file="",  # reader.read_statement takes raw bytes directly, not this field
        file_name=spec["filename"],
        file_extension=spec["reader"].extension(),
        request_id="fixture-verify",
    )
    parsed = spec["reader"].read_statement(request=request, file=file_bytes)
    expected_count = len(intended_transactions)
    if len(parsed) != expected_count:
        raise AssertionError(
            f"{spec['filename']}: expected {expected_count} transactions, reader parsed {len(parsed)}"
        )
    parsed_titles = {t.title for t in parsed}
    intended_titles = {t["title"] for t in intended_transactions}
    if parsed_titles != intended_titles:
        raise AssertionError(
            f"{spec['filename']}: title mismatch - intended {intended_titles}, parsed {parsed_titles}"
        )
    for t in parsed:
        if t.debit_or_credit_amount is None or t.debit_or_credit_amount <= 0:
            raise AssertionError(f"{spec['filename']}: transaction {t.title!r} has a non-positive amount")
    return parsed


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--out-dir", type=Path, default=FIXTURES_DIR,
        help="Directory to write the verified fixtures to (default: test-automation's fixture tree)",
    )
    args = parser.parse_args()
    out_dir = args.out_dir
    if not out_dir.is_absolute():
        out_dir = REPO_ROOT / out_dir

    out_dir.mkdir(parents=True, exist_ok=True)
    for spec in FIXTURES:
        rng = random.Random(spec["seed"])
        month = FIXTURE_MONTHS[spec["seed"]]
        transactions = spec["generator"](rng, spec["count"], month)
        file_bytes = spec["build"](transactions)
        parsed = verify(spec, file_bytes, transactions)
        out_path = out_dir / spec["filename"]
        out_path.write_bytes(file_bytes)
        dates = sorted(t["date"] for t in transactions)
        print(f"OK  {spec['filename']:14s} {len(file_bytes):6d} bytes  "
              f"{len(parsed)} transactions verified via {spec['reader'].__class__.__name__}  "
              f"date range {dates[0]} .. {dates[-1]}")
    print(f"\nAll {len(FIXTURES)} fixtures written to {out_dir}")


if __name__ == "__main__":
    main()
