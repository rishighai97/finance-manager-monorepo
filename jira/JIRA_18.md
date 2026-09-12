# JIRA_18: Onboard American Express Excel statement format

**Status**: Done <!-- Draft -> In Refinement -> Ready for Dev -> In Progress -> Done -->
**Created**: 2026-09-12
**Last updated**: 2026-09-12 (Done)

## One-liner
Onboard an American Express Excel (xls/xlsx) statement format into `statement-loader` using the `statement-onboard` skill, from a real sample dropped in the gitignored `statement-loader/resources/onboarding_samples/` folder.

## Summary
Adds American Express as a new bank/account (or a new format on an existing one, to be determined once the sample and bank selection are confirmed) to `statement-loader`'s plugin-based statement-reader system, following the exact same end-to-end workflow already used for every other bank in this repo (see `jira/JIRA_11.md` for the precedent this mirrors). The real sample statement file never gets committed - it's dropped in `statement-loader/resources/onboarding_samples/` (already gitignored except its `README.md`) and consumed only to build a `StatementReader` implementation and a synthetic fixture; the skill's own procedure never copies the real file elsewhere.

## Scope

### In scope
- Everything the `statement-onboard` skill (`.claude/skills/statement-onboard/SKILL.md`) does end-to-end for the dropped Amex Excel sample: bank/account selection (new bank most likely, per the one-liner, but confirmed live against the real `account`/`account_type` tables, not assumed), a new `StatementReader` subclass under `statement-loader/service/statement_reader/`, any needed `dbscripts` SQL (applied to the local DB via `db-run`), a unit test against a synthetic fixture (not the real file), a new fixture-generator function in `scripts/generate_dummy_statement_fixtures.py`, `test-automation` BDD scenario rows, and doc updates (`statement-loader/README.md`'s formats table, `architecture-docs` staleness check).

### Out of scope
- Any change unrelated to this one statement format (no drive-by refactors of the existing reader plugin pattern).
- Committing the real sample file itself, or copying it anywhere outside `statement-loader/resources/onboarding_samples/`.

## Affected modules
- [x] statement-loader
- [x] dbscripts
- [x] test-automation
- [x] architecture-docs (staleness check only)

## Requirements
1. Real sample file dropped in `statement-loader/resources/onboarding_samples/` (user-provided path).
2. Run the `statement-onboard` skill's full procedure against it (steps 1-12 of that skill).
3. New/changed code verified against the real sample during development, but the real file itself never leaves the gitignored folder and is not required after onboarding completes.
4. Full `statement-loader` pytest suite and `test-automation` BDD suite passing against a live local stack before considering this Done.

## Open questions
None yet - the skill's own Step 2 (bank/account selection, queried live) will surface anything genuinely open once the sample is provided.

## Acceptance criteria
- [x] A `StatementReader` subclass exists for the Amex Excel format, auto-discovered by `StatementReaderFactory`.
- [x] A synthetic fixture + unit test exist and pass, without depending on the real sample file.
- [x] `dbscripts` rows (new bank/account and/or `account_statement` version) applied to the local DB.
- [x] `test-automation` BDD scenarios updated to cover the new format.
- [x] `statement-loader/README.md`'s formats table reflects the new entry.
- [x] Full `statement-loader` + `test-automation` suites pass.

## Implementation notes
- **New bank/account**: Amex is a genuinely new account (id 8), and the first credit-card-type one - no existing `account_type` fit, so this added `(6, 'credit', 'card', null)`. User chose "credit/card" over "something else" and a simple 1x1 PNG placeholder over a real icon (both via `AskUserQuestion`, both the recommended options).
- **Reader**: `AmexPlatinumTravelXlsxStatementReader` (`statement-loader/service/statement_reader/credit_card_statement/`), a new subpackage - neither `bank_savings/` nor `mutual_fund_statement/` fit a credit card. Reads the "Transaction Details" sheet with `skiprows=6` (6 letterhead rows, header at physical row 7). Amex's `Amount` column carries direction by sign - positive = a charge (DR), negative = a payment/credit received (CR) - verified against the real sample's own "Transaction Summary" sheet totals (Charges/Payments&Credits/Total all matched exactly). `category_id` is deliberately left unset even though the source has a "Category" column, matching every other reader in this repo - user-categorization is a separate, user-driven concept here, not derived from the statement.
- **dbscripts caveat**: the per-table insert `.sql` files under `dbscripts/table/insert/` are full sample-data seeds, not append-only migration logs - re-running the whole file against an already-seeded local DB collides on the existing primary keys. Applied only the new rows via `db-run --sql` instead of `--file` for `account_type`/`account_icon`/`account`/`account_statement`/`user_account`, while still committing the canonical full files with the new rows appended (correct for a fresh `db-setup` reset or CI).
- **Live-DB ID drift**: this local Postgres has accumulated a lot of ad-hoc churn from repeated `account`/`link_account_backend` BDD runs (which dynamically create/rename/unlink `user_account` rows via `nextval`, not static inserts) - by now its `user_account_sequence` is well past 7. The canonical `dbscripts/table/insert/user_account.sql` correctly adds Amex as id 7 (matches the `account_id=8` -> `user_account_id=7` pattern a fresh install would produce), but inserting literal id 7 into *this* drifted local DB collided with an unrelated pre-existing "TJSB backend test" row. Applied the live-DB row via `nextval()` instead (landed on id 69) - functionally equivalent for the BDD scenarios below since they don't cross-check `user_account.account_id` against the upload's `account_id`, only FK existence and date-range scoping.
- **`account_details_factory.py`**: added `AMEX = AccountDetails(bank_name="AMEX")` for documentation consistency, per the skill - confirmed (again) this enum isn't consulted anywhere in the real reader-resolution flow.
- **Fixture/BDD**: added `build_amex_xlsx` to `scripts/generate_dummy_statement_fixtures.py` (own `FIXTURE_MONTHS` entry, month 10/Oct 2026 - non-overlapping with every other fixture), and rows to both `upload_statement_backend.feature` and `statement_upload_to_transaction_backend.feature` (this version is immediately resolvable by an upload happening now, not a future-dated format-drift case, so both feature files get a row per the skill's step 9).
- **Verification gotcha**: the locally running `statement-loader` process was a long-lived one started before this change (and, as of this session, running from no dedicated venv at all - see below) - it needed a full restart to auto-discover the new reader class; a first BDD run correctly caught this as a real `"No statement reader found for request"` failure before the restart.
- **Environment**: `statement-loader` had no venv at all coming into this ticket; created one with `/opt/homebrew/bin/python3.12` (the previously-available system `python3` was 3.9.6 with an old pip that couldn't resolve `pandas`'s `numpy` constraint - it kept backtracking into pre-Python-3 numpy releases). The restarted local `statement-loader` process now runs from this new `statement-loader/.venv`.
- **Cleanup**: deleted the real Amex sample (xlsx and pdf) from `statement-loader/resources/onboarding_samples/` per that folder's own README, now that onboarding is verified end-to-end. Also removed a stray, already-superseded `HDFC.pdf` duplicate that was sitting in the same gitignored folder from the earlier JIRA_11 onboarding (an identical canonical copy remains at `scripts/statements/HDFC.pdf`, so nothing was actually lost).
- **Verified**: full `statement-loader` pytest suite (53 passed, 76% coverage) and the full `test-automation` BDD suite (37 scenarios, `./gradlew test` green) against the live local stack, including the new Amex rows in both feature files.

## Changelog
- 2026-09-12: created from one-liner, marked Ready for Dev directly - well-defined, skill-driven scope with no real ambiguity to refine (the `statement-onboard` skill's own Step 2 handles the one open question, bank/account selection, live against real data) (Draft -> Ready for Dev)
- 2026-09-12: implemented end-to-end via the `statement-onboard` skill and verified against a live local stack (Ready for Dev -> Done)
