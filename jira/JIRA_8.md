<!--
Template for jira/JIRA_<ID>.md. Maintained by the `jira-create` skill
(.claude/skills/jira-create/SKILL.md) - don't hand-edit ticket structure
without updating both this template and that skill.
-->

# JIRA_8: Synthetic statement fixtures per bank/broker format + e2e upload coverage

**Status**: Done <!-- Draft -> In Refinement -> Ready for Dev -> In Progress -> Done -->
**Created**: 2026-09-10
**Last updated**: 2026-09-10

## One-liner
Create dummy account statements for all statements in the scripts folder by putting random title and amounts (3-4 transactions), and write e2e tests based on those (statement upload, transaction filter, etc). Create a jira for it. Tests should specify the version of the statement, file extension, and bank. For each file, have all business scenarios covered post-uploading the file, e.g. upload -> categorize -> filter, etc.

## Summary
`statement-loader` supports 7 statement-reader implementations across 6 bank/broker accounts: HDFC (xls), ICICI (xls), Saraswat (xls), Canara (csv), Axis (xls and csv - two readers, same account), and Groww (xlsx, mutual fund). Today the only real fixture file used anywhere in testing is `scripts/statements/HDFC.xls` - a real personal bank statement. That directory (`scripts/statements/`) is explicitly gitignored ("Personal financial data"), so it isn't available on a fresh checkout or in CI, and only one of the 7 formats has any test coverage at all (`test-automation`'s existing `statement_upload`/`e2e_flow` scenarios from JIRA_6).

This ticket replaces that dependency on real personal data with small, synthetic, git-committed fixture files - one per (bank, version, extension) combination - each containing 3-4 transactions with randomized-but-plausible titles and amounts, correctly formatted to match that specific reader's exact parsing logic (header/footer markers, column positions, date formats - these are all real, already-shipped, sometimes idiosyncratic parsers, not something this ticket redesigns). It then extends `test-automation`'s BDD suite with, per (bank, version, extension) combination: an explicitly-named statement-upload scenario (naming the bank, version, and extension, not a generic "upload a statement" test), and a full downstream e2e flow chaining every business scenario that applies to freshly-uploaded transactions - upload -> transactions appear via fetch -> map a transaction to a category -> filter by that category -> filter by debit/credit indicator - not just one filter type on one or two formats.

## Scope

### In scope
- **Fixture generation**: a small, one-time-run Python script (not part of the runtime app) that emits 7 synthetic statement files - one per reader - each with 3-4 transactions, randomized titles (drawn from a small pool of plausible descriptions: "Grocery Store", "Salary Credit", "Electricity Bill", "ATM Withdrawal", etc.) and randomized-but-realistic amounts, correctly shaped for that reader's actual column positions/header markers/date format:
  - `HdfcSavingsAccountXlsStatementReader` (account_id=1, v1, xls)
  - `IciciXlsSavingsAccountStatementReader` (account_id=2, v1, xls)
  - `SaraswatXlsSavingsAccountStatementReader` (account_id=3, v1, xls)
  - `CanaraStatementReader` (account_id=4, v1, csv)
  - `AxisXlsSavingsAccountStatementReader` (account_id=5, v1, xls)
  - `AxisCsvSavingsAccountStatementReader` (account_id=5, v1, csv)
  - `GrowwStatementReader` (account_id=7, v1, xlsx, mutual fund - different transaction shape: units/price_per_unit instead of a plain amount)
- The generated files themselves are committed as static fixtures (generation is a one-time/on-demand tool, not run at test time) - deterministic reads for CI, no live randomization affecting assertions.
- Fixtures live in a new, git-tracked location (not `scripts/statements/`, which stays reserved/gitignored for real personal data) - proposed: `test-automation/src/test/resources/fixtures/statements/<bank>.<ext>`.
- **`test-automation` BDD scenarios**: one backend statement-upload scenario per (bank, version, extension) combination above (7 scenarios total), each explicitly named to include the bank, version, and extension (e.g. "Upload a v1 Axis xls bank statement succeeds", "Upload a v1 Axis csv bank statement succeeds" - not one shared "Axis" scenario). The existing HDFC-only `statement_upload`/`e2e_flow` features from JIRA_6 (which use the real, gitignored `scripts/statements/HDFC.xls`) are **replaced** - repointed at the new synthetic HDFC fixture - rather than kept running alongside the new scenario, so there's one canonical, reproducible HDFC test.
- **One full e2e flow per (bank, version, extension) combination** (7 total, not just a sample of 1-2), each chaining every business scenario that applies to a freshly-uploaded statement's transactions, reusing existing step definitions from JIRA_6's `category`/`transaction` scenarios rather than writing new ones:
  1. Upload the fixture -> succeeds with the expected transaction count.
  2. The uploaded transactions are fetchable via `/transaction/v1/fetch_all`, queried with a wide fixed date range (e.g. `2000-01-01` to `2099-12-31`) rather than "today" - fixtures carry a fixed baked-in transaction date (e.g. `2026-01-01`) set at generation time, not regenerated per test run, so a wide range is what makes this robust regardless of when the suite actually executes.
  3. Map one of the uploaded transactions to a category (reusing the `map_transaction_backend` pattern).
  4. Filtering by that category returns the mapped transaction (reusing `filter_by_category_backend`).
  5. Filtering by debit/credit indicator returns the expected subset (reusing `filter_by_debit_credit_backend`).
  - Groww's mutual-fund shape (units/price_per_unit, `PURCHASE`/`SALE` instead of a plain debit/credit amount) still fits this chain - `is_debit_or_credit` is still set (`CR` for `PURCHASE`), just derived differently by that one reader.
- `test-automation/README.md`'s catalog table gets one row per new scenario (14 total: 7 `statement_upload` + 7 `e2e_flow`, titles naming the bank/version/extension).

### Out of scope
- Adding PDF statement readers - `account_statement` sample data has `pdf` rows for several accounts, but no `StatementReader` subclass actually implements PDF parsing yet; that's a separate, much larger feature (this ticket only covers the 7 readers that already exist and work).
- Changing any statement-reader parsing logic itself - fixtures are built *to match* each reader's existing (sometimes quirky) format expectations, not the other way around.
- Deleting or otherwise touching the real files in `scripts/statements/` - they stay as-is, still gitignored, for anyone doing real manual testing locally.
- UI-level statement-upload tests - per JIRA_6's later pivot, `test-automation` is backend-only; this ticket follows that same policy.

## Affected modules
- [x] statement-loader (a real connection-pool-leak bug found and fixed - see Implementation notes; no reader parsing logic changed)
- [x] test-automation (new fixtures, new BDD scenarios)
- [ ] account-service
- [ ] api-gateway
- [x] transaction-service (a real null-`closing_balance` NPE found and fixed - see Implementation notes)
- [ ] finance-manager-ui
- [x] root / docs / CI (`scripts/generate_dummy_statement_fixtures.py`)

## Requirements
1. One synthetic fixture file per reader (7 total) at `test-automation/src/test/resources/fixtures/statements/<bank>.<ext>`, each with 3-4 transactions, titles drawn from a small fixed pool of plausible descriptions (Grocery Store, Salary Credit, Electricity Bill, ATM Withdrawal, Online Purchase, etc.) and amounts randomized in a realistic range (₹100-₹50,000), valid per that reader's actual parsing logic (verified by actually running it through the real reader, not just eyeballing the format).
2. Fixtures are committed to git - not `scripts/statements/`, which stays reserved/gitignored for real personal data.
3. A reusable generation script exists (for regenerating/extending fixtures later) but fixture *output* is what's committed and consumed by tests, not generated at test-run time.
4. Seven statement-upload BDD scenarios (one per bank/version/extension combination), each named to explicitly state the bank, version, and extension. The existing HDFC-only scenarios from JIRA_6 are repointed at the new fixture rather than left as a separate real-file-based duplicate.
5. A full e2e flow - upload -> fetch -> map a transaction to a category -> filter by that category -> filter by debit/credit indicator - for **every** (bank, version, extension) combination (7 total), not just a sample. Reuses existing `category`/`transaction` step definitions from JIRA_6 rather than duplicating them per bank.
6. `test-automation/README.md`'s catalog table updated with the new rows, statuses accurate (`Implemented` only once actually passing against a live local stack).

## Resolved (was Open questions)
- **Fixture location**: `test-automation/src/test/resources/fixtures/statements/<bank>.<ext>` (e.g. `hdfc.xls`, `axis.csv`, `axis_csv.csv` if a filename collision needs disambiguating from the Axis xls fixture).
- **Existing HDFC scenarios**: replaced, not kept alongside. The real `scripts/statements/HDFC.xls` dependency is retired entirely from `test-automation` in favor of the new synthetic fixture - one canonical, reproducible HDFC scenario.
- **e2e scope (superseded, see below)**: originally scoped as debit/credit-indicator filtering only, for just 2 of the 7 formats. **Expanded**: every format gets a full chain - upload -> fetch -> categorize -> filter by category -> filter by debit/credit indicator - confirmed sufficient (no account/category CRUD beyond that needed) - see Scope above.
- **Fixture dates**: a fixed, baked-in date at fixture-generation time (e.g. `2026-01-01`), not "today" - the e2e flow's fetch step queries a wide fixed date range (`2000-01-01` to `2099-12-31`) so it works regardless of when the suite actually runs, without needing periodic fixture regeneration.
- **Randomization pool**: a small fixed pool of plausible descriptions (Grocery Store, Salary Credit, Electricity Bill, ATM Withdrawal, Online Purchase, etc.) with amounts randomized in a realistic range (₹100-₹50,000) is sufficient.

## Acceptance criteria
- [x] 7 fixture files exist, committed, each verified (by an actual passing test) to parse correctly through its real reader with the expected transaction count.
- [x] 7 named statement-upload BDD scenarios pass against a live local stack, each identifiable by bank/version/extension in its title.
- [x] 7 full e2e flow scenarios pass (one per bank/version/extension), each covering upload -> fetch -> categorize -> filter by category -> filter by debit/credit indicator.
- [x] `test-automation/README.md` catalog and skill docs (if `bdd-test-generate`/`scenario-discovery` need updating for the new fixture convention) reflect the final state accurately.

## Implementation notes

### Fixture generation (`scripts/generate_dummy_statement_fixtures.py`)
- Builds each of the 7 fixtures byte-for-byte to match its real reader's exact parsing logic: header/footer trigger markers, column positions, date formats, and (for xls/xlsx) an extra leading filler row to account for `pandas.read_excel` always consuming the sheet's physical first row as the DataFrame header - easy to miss (it broke the first attempt at the ICICI/Saraswat/Axis-xls builders, all fixed by adding that leading row).
- Two format-specific quirks worth knowing if a new reader/fixture is ever added: ICICI's `row.iloc[6] != None` (not `pd.isna`) means a "not applicable" debit/credit cell must be written as literal `0`, not left blank, or the amount silently becomes NaN; Saraswat's `.strip()` on its amount/balance columns means those cells must be strings, and a bare numeric-looking string gets auto-coerced back to `float64` by pandas' column-dtype sniffer unless it's comma-formatted (`"48,765.50"`, not `"48765.50"`) - matches real Indian-currency-formatted statements anyway.
- Each fixture is immediately re-parsed through the real reader class and asserted against the intended transaction count/titles/positive-amounts before being written - this is what "verified by actually running it through the real reader" (Requirement 1) means in practice, not just visual inspection.
- **Design refinement beyond the original Resolved decision**: rather than a single wide fixed date range (`2000-01-01`..`2099-12-31`) for every fixture, each fixture was given its own non-overlapping calendar month (`FIXTURE_MONTHS`: hdfc=Jan, icici=Feb, saraswat=Mar, canara=Apr, axis xls=May, axis csv=Jun, groww=Jul 2026) and the e2e scenarios query that fixture's exact month as the date range instead. This was necessary, not just nicer: the two Axis fixtures share `account_id=5`/`user_account_id=5`, so a global wide range (or title-based matching against the shared random title pool) couldn't reliably distinguish "this upload's 3 transactions" from "the other Axis fixture's 4 transactions" both sitting in the same account. A fixed month per fixture sidesteps the whole problem - simpler than tracking exact titles per fixture in the Gherkin data, and works identically whether or not two fixtures ever end up sharing an account.
- Requires `xlwt` (legacy `.xls` writer) and `openpyxl` (`.xlsx` writer) - added to `statement-loader/requirements.txt` as fixture-generation-only dependencies (not imported by the running app; `xlrd`, already a runtime dependency, only *reads* `.xls`).

### `test-automation` BDD scenarios
- Both `upload_statement_backend.feature` and `statement_upload_to_transaction_backend.feature` are now `Scenario Outline`s with one `Examples` row per (bank, version, extension) - Cucumber substitutes `<bank>`/`<version>`/`<extension>` into the scenario title itself, so the generated report literally shows e.g. "Uploading a v1 axis csv statement succeeds" as its own named result, not a generic shared title (the explicit ask: "tests should specify the version of the statement and file extension and bank").
- `StatementUploadBackendSteps` was rewritten to load any named fixture from the classpath (`ClassPathResource("fixtures/statements/" + filename)`) instead of a hardcoded HDFC-only, repo-root-relative file path - both simpler and no longer dependent on `scripts/statements/` being present at all.
- `E2eFlowBackendSteps` gained the categorize/filter-by-category/filter-by-indicator steps, generalized to take `user_account_id` and the fixture's date range as scenario parameters rather than hardcoding HDFC's. The old HDFC-only "transactions appear when fetching" step was removed (replaced, not kept - per the resolved decision) along with the now-unused `StatementUploadBackendSteps` constructor dependency in that class.
- Cucumber-expression gotcha hit while wiring this up: a literal `/` in step text (`"...debit/credit indicator"`) must be escaped (`debit\\/credit` in the Java string) - Cucumber expressions treat an unescaped `/` as alternative-text syntax, so the step silently fails to match at all (`UndefinedStepException`) rather than erroring at compile time.

### Two real, previously-undiscovered bugs found and fixed
Both were hard blockers for this ticket's own acceptance criteria (not just found in passing), matching the precedent set in JIRA_6 (fix a blocking bug found while building the suite) rather than JIRA_7's stricter "document, don't fix" unit-test-only policy:
1. **`statement-loader` connection pool leak** (`config/postgres.py`): `execute_queries_in_transaction` returned pooled connections via `conn.close()` instead of `self.pool.putconn(conn)`, permanently shrinking the pool by one per account-statement lookup. Running the new 14-scenario suite repeatedly (routine during development/debugging) exhausted the pool (`maxconn=20`) within a couple of full runs, after which *every* upload 500'd until the process was restarted - a genuine reliability blocker for a test suite meant to be re-run often. Fixed by returning the connection to the pool instead of closing it.
2. **`transaction-service` null-`closing_balance` NPE** (`TransactionServiceImpl.calculateOpeningBalance`/`calculateClosingBalance`): NPE'd (`BigDecimal.subtract`/`.add` on `null`) whenever a fetched transaction had no `closing_balance` - which `GrowwStatementReader`'s parsed mutual-fund transactions never set, since there's no running bank-account-balance concept for a fund holding. This made `/transaction/v1/fetch_all` completely non-functional for the Groww account (a real, already-supported broker type) the moment any Groww transaction existed - not an edge case, a core path. Fixed by treating a null closing balance as zero when aggregating; added a unit test (`TransactionServiceImplTest.treatsNullClosingBalanceAsZero`) alongside the existing null-*indicator* "known bug" test, which is a distinct, still-open gap this fix didn't touch (different field, different call site).

### Verification
Full `test-automation` suite (`./gradlew test`, all tags) passes: 33 scenarios, including the 14 new ones, run twice in direct succession with identical results (confirms the deterministic-transaction-ID/per-fixture-month design doesn't accumulate or collide on reruns). `transaction-service`'s unit test suite (`./gradlew test jacocoTestCoverageVerification`) and `statement-loader`'s pytest suite both still pass after their respective fixes, coverage gates unaffected.

## Changelog
- 2026-09-10: created from one-liner (Draft)
- 2026-09-10: resolved fixture location, HDFC-scenario replacement policy, e2e filter scope, and title/amount randomization pool via AskUserQuestion; folded into Scope/Requirements (In Refinement)
- 2026-09-10: expanded e2e scope per explicit follow-up instruction - every one of the 7 formats now gets a full business-scenario chain (upload -> fetch -> categorize -> filter by category -> filter by debit/credit indicator), not just DR/CR filtering on a sample of 2; resolved fixture-date handling (fixed baked-in date + wide query range) via AskUserQuestion; folded into Scope/Requirements/Acceptance criteria
- 2026-09-10: user confirmed the spec - moving to implementation (Ready for Dev -> In Progress)
- 2026-09-10: implemented in full - 7 synthetic fixtures generated and verified against their real readers, 14 new BDD scenarios (7 statement_upload + 7 e2e_flow) passing and re-runnable, `test-automation/README.md` catalog updated. Refined fixture-date handling to per-fixture unique months (not the originally-resolved wide range) to correctly scope the two Axis fixtures sharing an account. Found and fixed two real, ticket-blocking bugs (statement-loader connection pool leak, transaction-service null-closing-balance NPE), each with a regression test/documented Gotcha. Marking **Done**.
