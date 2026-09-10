---
name: statement-onboard
description: Onboards a new bank/broker account statement format into statement-loader, end-to-end - works for any file format (PDF, xls, csv, xlsx, or others), for a new format on an existing bank, an entirely new bank/broker account, or format drift on an already-onboarded bank. Given a sample dropped in statement-loader/resources/onboarding_samples/, it asks which bank the sample is for (from a live-queried list) and figures out the version itself from existing account_statement records, then generates the StatementReader implementation, any needed dbscripts SQL, unit tests, a synthetic fixture, test-automation BDD scenarios, README updates, and checks architecture-docs for staleness. Use whenever asked to onboard/add a new statement format, a new bank, or handle a bank changing its statement layout.
---

# statement-onboard

Automates the full workflow of teaching `statement-loader` to parse a new statement format, following the existing plugin pattern (`StatementReader` subclass, auto-discovered by `StatementReaderFactory`, keyed by `(account_id, version, extension)` and resolved at runtime via `account_statement` rows in Postgres - see root `CLAUDE.md`'s "statement-loader's plugin pattern" section). This is an explicitly-invoked, judgment-heavy skill (like `bdd-test-generate`/`unit-test-generate`), not a proactively-triggered one - onboarding a new bank/format is a deliberate, occasional action, not something to fire off unrelated code changes.

## Procedure

### 1. Find the sample
Look in `statement-loader/resources/onboarding_samples/` (gitignored - real personal data) for a dropped file. If empty or ambiguous (multiple files), ask the user which one to onboard. **The filename is not parsed for anything** - no naming convention. Only its actual extension (`.pdf`, `.xls`, `.csv`, `.xlsx`, ...) matters, read directly from the file.

### 2. Ask which bank/account
Query the live database for the banks/accounts that already exist, via the `db-run` skill:
```sql
SELECT a.id AS account_id, a.name, at.type_1, at.type_2, at.type_3
FROM account a JOIN account_type at ON a.type_id = at.id
ORDER BY a.id;
```
Present this list to the user (`AskUserQuestion`) plus an explicit **"new bank"** option.
- **Existing bank**: use its `account_id` directly.
- **New bank**: ask for what a lookup can't provide - bank name, account type category (savings/current/wallet/mutual fund/share - matches `account_type`'s `type_1/2/3` columns), and an icon (or a placeholder if none supplied). These become new `account_type`(if needed)/`account_icon`/`account` rows in step 6.

Never guess the bank from the filename or file content.

### 3. Determine the version
Query the live `account_statement` table for this `account_id` + the sample's extension, via `db-run`:
```sql
SELECT MAX(version) AS max_version FROM account_statement WHERE account_id = <id> AND extension = '<ext>';
```
- No existing row -> this is version **1** (first time this bank/extension combination is onboarded - including the common case where `account_statement` already has a metadata row for this exact `(account_id, extension)` at version 1 but **no reader was ever implemented for it** - check for this before assuming you need a new DB row at all; several accounts in this repo's sample data are in exactly that state, see Implementation notes on `jira/JIRA_11.md`).
- An existing row -> this is **format drift**: the new version is one past the current max. Don't overwrite the existing reader/row - see step 6 for how the transition is modeled.

### 4. Analyze the sample's actual content
This is the one place file content genuinely drives the output - read the real file to determine its structure. General approach by format:
- **xls/xlsx**: `pandas.read_excel`. Watch for a leading filler row - `pandas.read_excel` always consumes the sheet's physical first row as the header.
- **csv**: plain text parsing, watch for the real column order/date format.
- **pdf**: see the dedicated "PDF-specific lessons" section below - this format needs the most care and has real, non-obvious gotchas found while onboarding the first PDF reader (JIRA_11).

Identify: header/footer markers, column layout or text structure, date format, and how debit/credit and running balance are represented.

### 5. Generate the `StatementReader` subclass
Implement `read_statement`, `account_id`, `version`, `extension`, following the existing pattern in `service/statement_reader/{bank_savings,mutual_fund_statement}/`. **Iterate against the real dropped sample until it parses correctly** - assert the transaction count is sane, titles look right, amounts are positive, and (where a running balance exists) the balance chain is internally consistent from one transaction to the next. Don't ship a reader you haven't actually run against the real file - same bar `scripts/generate_dummy_statement_fixtures.py` (JIRA_8) set for fixtures.

### 6. Generate and apply the `dbscripts` SQL
Only add rows that don't already exist:
- **New bank**: `account_type` (if a matching type doesn't already exist), `account_icon`, `account` rows in the relevant `dbscripts/table/insert/*.sql` files.
- **New format, existing bank, no format-drift**: check whether an `account_statement` row for this `(account_id, extension)` already exists first (see step 3) - if it does, there's nothing to insert, just implement the reader.
- **Format drift**: this needs *two* changes, not just one insert - bound the *previous* version's `end_time` to the cutover timestamp (it was previously open-ended, `'9999-01-01'`), and insert the new version's row starting at that same cutover. Both go in `dbscripts/table/insert/account_statement.sql` as the new canonical baseline, with a comment explaining the transition.
- Apply the same SQL to the **live local database** via the `db-run` skill, so the onboarding is immediately usable, not just written to disk.
- `model/account_details_factory.py`'s `AccountDetailsFactory`/`AccountDetails` enum is **not** consulted anywhere in the actual reader-resolution flow (verified while building this skill - it's self-referenced only) - update it too for documentation consistency, but don't rely on it functionally.

**Important caveat about time-based resolution**: `StatementReaderFactory` resolves a reader using the *current wall-clock time at upload*, not any date embedded in the statement. This means only **one** version of a given `(account_id, extension)` can ever be "live" for an upload happening right now. If you bound a cutover in the future (format drift), the new version genuinely cannot be exercised by a real "upload now" test until that time actually arrives - see step 9.

### 7. Generate the unit test
Add a pytest test under `statement-loader/tests/service/statement_reader/...` mirroring the existing convention (see `test_hdfc_savings_account_statement_reader.py`), but use the **synthetic fixture from step 8**, not the real dropped sample - the real sample never leaves the gitignored intake folder. Assert the reader reports the right `account_id`/`version`/`extension`, parses the expected transaction count, and (if a running balance exists) that the balance chain matches.

### 8. Generate the synthetic fixture
Extend `scripts/generate_dummy_statement_fixtures.py` with a `build_<bank>_<format>` function that reconstructs the real format's structure with fake data (3-4 transactions, titles from the existing pool, randomized amounts) - same pattern as every other fixture there. For PDF fixtures, build the PDF with `reportlab` (already a fixture-generation-only dependency, like `xlwt`/`openpyxl` for xls/xlsx). Give the new fixture its own unique `FIXTURE_MONTHS` entry so its transactions don't collide with any other fixture sharing the same account. Run the script and confirm it verifies cleanly (re-parses the fixture through the real reader and checks the result).

### 9. Add `test-automation` BDD scenarios
Add a row to `upload_statement_backend.feature`'s `Examples` table. Add a row to `statement_upload_to_transaction_backend.feature`'s `Examples` table **only if this version is the one currently resolvable by an upload happening now** (per step 6's caveat) - a future-dated format-drift version can't be exercised this way; verify it instead with a direct, one-off `AccountStatementService.get_account_statement_mapping(..., timestamp=<explicit before/after the cutover>)` check (needs a live DB - not added to the committed pytest suite, which deliberately never needs one; see `tests/conftest.py`'s fake-`config_manager` pattern). Update `test-automation/README.md`'s catalog table and scenario count to match.

### 10. Update `statement-loader/README.md`
Add to (or create, if this is the first run) a **"Statement formats configured"** table: one row per `(bank, account_id, version, extension)` combination currently onboarded, with the account type. **Re-run this update on every onboarding**, including format-drift ones (list both the old and new version rows) - this table must never go stale.

### 11. Check `architecture-docs` for staleness
A new bank/account is a new `account_type`/`account` row, not a new table or service - usually a no-op for the HLD/sequence diagrams. Check the ER diagram's Notes section (`architecture-docs/er/README.md`) for anything that's now inaccurate (e.g., a new account type worth naming) and update it if so - same discipline as the `diagram-maintain` skill (JIRA_9).

### 12. Verify and stage
Run the full `statement-loader` pytest suite and the `test-automation` BDD suite (`./gradlew test`) against a live local stack, confirm everything passes, and leave the changes for the user to review/commit - this skill never runs `git commit`/`git push` itself, same as every other skill in this repo.

## PDF-specific lessons (from onboarding the first real PDF reader, JIRA_11)

PDF statements have no reliable grid structure the way xls/csv do, and real-world PDF exports have quirks worth checking for on any new PDF format:

- **Never assume a fixed page count, or that a section (table/summary/letterhead) lives at a specific page index or x/y coordinate.** A statement's page count varies by date range and transaction volume - the same bank's real export might be 1 page one month and 12 the next. Always iterate every page in the document (`for page in pdf.pages`) rather than indexing a specific one (`pdf.pages[-1]`, `pdf.pages[4]`, etc.), and locate every structural marker (table start, table end/summary, footer) by matching **text content**, never by page number or a bounding-box position - a marker can legitimately land on any page depending on how much content precedes it. Test this deliberately: verify the reader against both a short (single-page) and a long (multi-page) sample of the same format, not just one - a bug that only shows up with 2+ pages (e.g. per-page state not being reset) can otherwise hide behind a fixture that happens to fit on one page. (`HdfcSavingsAccountPdfV2StatementReader`'s first draft had exactly this bug - `in_table` was initialized once outside the page loop instead of reset at the top of each page's own iteration - caught only by comparing it against `HdfcSavingsAccountPdfStatementReader`'s v1 sibling, not by its own single-page test fixture.)
- **Don't trust `pdfplumber`'s `extract_table()`/`extract_tables()` for a PDF with no visible row-separator lines** (common for bank statement exports - only column rules, no row rules). It collapses each column into one big multi-line string per page, and if any column (e.g. "Withdrawal" vs "Deposit") is blank on some rows, that column's line-count no longer matches the others', silently misaligning every row after the first gap. **Use `extract_text()` and parse line-by-line with a regex** against the real, visually-inspected column layout instead.
- **Real statement text may drop spaces inconsistently between certain words** (a font/kerning artifact, not a data problem) - e.g. "Statement of account" extracting as `"Statementof account"`. When matching a fixed anchor phrase, **normalize by stripping all whitespace and lowercasing** before comparing, so both the real file's quirky spacing and a cleanly-spaced synthetic test fixture match the same check.
- **A repeating page header/column-header row often only appears once, on the first page** - don't gate "are we inside the transaction table" on seeing that header on every page. Find a marker that actually repeats (e.g. a "Statement of account" line was present on every page in the one real format seen so far) instead, and reset any per-page state at the top of each page's own processing loop, not once for the whole document.
- **A flattened PDF export often can't distinguish debit vs. credit by column position** the way a real spreadsheet can (both amount columns end up in the same text position once one is blank). **Derive the direction from the running-balance delta instead**: if the closing balance increased since the previous transaction, it's a credit; if it decreased, a debit. This needs an anchor for the very first transaction - look for a statement summary section (e.g. "Opening Balance") elsewhere in the document (often on the last page) to seed it, rather than guessing.
- **Verify the parser against the real file's own arithmetic**, not just "did it produce N transactions" - replay the running balance from the opening balance through every parsed transaction and confirm it lands on the statement's own final closing balance. This catches both mis-parsed amounts and wrong debit/credit direction in one check.

## Keeping this doc updated

See `docs/SKILLS.md` for the full skill catalog and `statement-loader/README.md`'s "Statement formats configured" table for what has actually been onboarded so far.