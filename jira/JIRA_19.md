# JIRA_19: Fix Axis CSV reader's date format + make every reader tolerate date-format drift

**Status**: Done <!-- Draft -> In Refinement -> Ready for Dev -> In Progress -> Done -->
**Created**: 2026-09-12
**Last updated**: 2026-09-12 (Done)

## One-liner
check why axis file on /Users/rishighai/Desktop/Rishi/Statements is failing
(scope expanded mid-implementation: "for all readers, code should be able to figure out date format at runtime")

## Summary
A real Axis Bank CSV export fails to upload. Root cause: `AxisCsvSavingsAccountStatementReader` (`statement-loader/service/statement_reader/bank_savings/axis_savings_account_statement_reader.py`) parsed each transaction's date as `%d/%m/%y` (slash-separated, 2-digit year), but the real export uses `%d-%m-%Y` (dash-separated, 4-digit year, e.g. `17-08-2026`), raising `ValueError: time data '17-08-2026' does not match format '%d/%m/%y'`. This reader was apparently only ever validated against `scripts/generate_dummy_statement_fixtures.py`'s synthetic fixture, which was itself built to match the reader's (wrong) date-format assumption rather than derived from a real export - so the bug was invisible to the existing test suite.

While fixing this, the user asked for a systemic fix: every reader should tolerate small date-format drift at runtime (2- vs 4-digit year, "/" vs "-" separators) instead of hard-crashing the moment a bank tweaks its export slightly, the same way this exact bug had gone unnoticed. This added a shared `parse_flexible_date` utility and applied it to every one of the 9 statement readers in the codebase, not just Axis csv.

## Scope

### In scope
- Fix the date format bug in `AxisCsvSavingsAccountStatementReader`.
- Add a shared, reusable date-parsing utility that tries a per-reader list of candidate formats in order, instead of a single hardcoded format string.
- Apply it to every existing `StatementReader` subclass (HDFC xls/pdf v1/pdf v2, ICICI, Saraswat, Canara, Axis xls/csv, Groww, Amex), each with its own candidate-format list.
- Widen any reader-specific regex/pre-filter that gated on the *old* single date shape (HDFC pdf v1/v2's transaction-line regex, Saraswat's date-looking-cell check) so a broadened format list can actually reach the parser.
- Verify against every real sample file available locally (Axis csv, HDFC xls, HDFC pdf).
- Update `scripts/generate_dummy_statement_fixtures.py`'s `build_axis_csv` to the real date format and regenerate the fixture.
- Unit tests for the new utility; full `statement-loader` + `test-automation` suites passing.

### Out of scope
- Any reader's non-date parsing logic (columns, amount/balance handling, DR/CR direction).
- Mixing day-first and month-first formats in one reader's candidate list - see Implementation notes for why that's a correctness hazard, not just a missed convenience.
- Committing any real sample file.

## Affected modules
- [x] statement-loader
- [ ] account-service
- [ ] api-gateway
- [ ] transaction-service
- [ ] finance-manager-ui
- [x] scripts (fixture generator)
- [ ] root / docs / CI

## Requirements
1. `AxisCsvSavingsAccountStatementReader` correctly parses a real Axis CSV export.
2. A shared `parse_flexible_date(date_string, formats)` utility exists (`statement-loader/utils/datetime_utils.py`), trying each format in order and raising a clear error listing every attempted format if none match.
3. Every existing reader uses it with its own candidate-format list, kept within that bank's own day/month convention (day-first for every Indian bank reader, month-first only for Amex) - never mixed across conventions in one list.
4. The synthetic Axis csv fixture matches the corrected real format.
5. Full `statement-loader` unit test suite and `test-automation` BDD suite pass.

## Open questions
None - both the original bug fix and the scope expansion were explicitly confirmed by the user ("yes, fix it", then "for all readers, code should be able to figure out date format at runtime").

## Acceptance criteria
- [x] The real Axis CSV sample parses successfully via `AxisCsvSavingsAccountStatementReader` (correct transaction count, amounts, DR/CR direction, running balance).
- [x] `parse_flexible_date` exists, is unit-tested, and every reader (all 9 call sites) uses it instead of a single bare `datetime.strptime`.
- [x] `build_axis_csv` in `scripts/generate_dummy_statement_fixtures.py` uses the corrected date format; the regenerated fixture re-verifies cleanly through the real reader.
- [x] Full `statement-loader` pytest suite passes.
- [x] Full `test-automation` BDD suite passes against a live local stack.

## Implementation notes
- **The actual bug**: one wrong format string (`%d/%m/%y` instead of `%d-%m-%Y`) in `AxisCsvSavingsAccountStatementReader`, invisible to the test suite because the synthetic fixture was built to match the reader's assumption rather than a real export.
- **Shared utility**: `utils/datetime_utils.py`'s new `parse_flexible_date(date_string, formats)` tries each format in `formats`, in order, returning the first successful parse; raises `ValueError` naming every format it tried if none match. Deliberately dumb (an ordered list of exact formats), not a fuzzy/auto-detecting parser (e.g. `dateutil.parser.parse`) - a fuzzy parser can silently misinterpret an ambiguous date like `01/02/2026` (Jan 2 vs Feb 1) depending on convention, which is a much worse failure mode than a loud crash. Each reader supplies only formats that share its own bank's day/month convention; day-first (Indian) and month-first (Amex/US) lists are never combined.
- **Per-reader candidate lists** (first entry = the reader's original/primary format, unchanged - see each reader's own `_DATE_FORMATS` comment): HDFC xls/pdf v1/pdf v2 (`%d/%m/%y` first, + `%d/%m/%Y`, `%d-%m-%Y`, `%d-%m-%y`), ICICI/Saraswat (`%d/%m/%Y` first, + the same three variants), Canara/Groww (`%d %b %Y` first, + `%d-%b-%Y`, `%d %B %Y`, and 2-digit-year variants), Axis xls/csv (`%d-%m-%Y` first now - the corrected real format - with the old wrong `%d/%m/%y` kept as a low-priority fallback rather than deleted, in case some older real export genuinely used it), Amex (`%m/%d/%Y` first, + `%m-%d-%Y`, `%m/%d/%y` - its own separate, month-first list).
- **Regex/pre-filter gotcha**: for two readers, the date format was also baked into a *pre-filter*, not just the final `strptime` call, so broadening the format list alone would have been silently ineffective:
  - `HdfcSavingsAccountPdfStatementReader`/`...PdfV2StatementReader`'s transaction-line regex hardcoded `\d{2}/\d{2}/\d{2}` (exactly 2-digit year, slash-only) as the *date capture group itself* - widened to `\d{2}[/-]\d{2}[/-]\d{2,4}` so a real line with a different date shape can even reach the regex match at all, let alone the parser.
  - `SaraswatXlsSavingsAccountStatementReader` gated "is this row a transaction row" on `len(row[2].split("/")) == 3 and len(row[2].strip()) == 10` - an exact-shape check that would have silently *skipped* (not crashed on) a dash-separated or 4-digit-year real row. Replaced with a regex (`^\d{2}[/-]\d{2}[/-]\d{2,4}$`) matching the same broadened date shape.
  - Every other reader's "is this a transaction row" gate was already date-format-agnostic (type/blank checks only), so no pre-filter change was needed there.
- **Cleanup**: removed the now-unused `from datetime import datetime` import from every reader file that no longer calls `datetime.strptime` directly.
- **Verified**: the real Axis CSV sample (53 transactions, balance chain internally consistent end to end) and the real HDFC xls/pdf samples (119 and 114 transactions respectively, both used to validate the broadened HDFC regexes didn't regress). Full `statement-loader` pytest suite (57 passed, including 4 new tests for `parse_flexible_date`) and the full `test-automation` BDD suite (37 scenarios, `./gradlew test` green) against the live local stack, after restarting the locally running `statement-loader` process so it picked up the change.
- **Fixture regen side effect**: regenerating fixtures to verify `build_axis_csv`'s fix also touched `amex.xlsx`/`groww.xlsx`/`hdfc.pdf`/`hdfc_v2.pdf` with embedded-timestamp-only diffs (openpyxl/reportlab stamp a creation time on every save) - reverted those four, kept only `axis.csv`'s genuine content change.

## Changelog
- 2026-09-12: created from a live-bug diagnosis (real Axis CSV upload failure), marked Ready for Dev directly on the user's explicit "yes, fix it" confirmation of the diagnosis and proposed fix (Draft -> Ready for Dev)
- 2026-09-12: scope expanded mid-implementation on the user's request ("for all readers, code should be able to figure out date format at runtime") - added a shared `parse_flexible_date` utility applied to every reader, not just Axis csv; implemented and verified end to end (Ready for Dev -> Done)
