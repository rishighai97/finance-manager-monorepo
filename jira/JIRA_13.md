# JIRA_13: Revamp transaction-list's search/filter section

**Status**: In Refinement <!-- Draft -> In Refinement -> Ready for Dev -> In Progress -> Done -->
**Created**: 2026-09-11
**Last updated**: 2026-09-11 (round 1)

## One-liner
Revamp the search/filter section above the transaction list (date range, account/category selectors, search bar, batch-categorize toolbar) for a better UX.

## Summary
`finance-manager-ui`'s transaction-list page (`src/app/transaction-list/`) has grown a dense stack of controls above the actual transaction rows: the date-range filter, account selector, category selector, a text/regex search bar, the summary (opening/debit/credit/closing) row, and the batch-categorize toolbar (select a category, Categorize/Delete Category/Revert Categorize/Update Categories). This region was carried through JIRA_12's Calm Ledger `ux-apply` run largely as a like-for-like recolor of the existing layout, not a rethink of its structure or information density. **The driving complaint is density/clutter** - too many controls crammed into one region - so `ux-explore` should optimize for reducing that, treating the filter controls (date/account/category/search) and the batch-categorize toolbar as two visually distinct sections rather than one merged block, since they serve different purposes (narrowing what's shown vs. bulk-acting on it). This ticket is specifically about that region - not the transaction rows themselves - going through the same `ux-explore` -> `ux-apply` workflow JIRA_12 established, rather than being redesigned ad hoc.

## Scope

### In scope
- The entire region above the transaction list in `finance-manager-ui/src/app/transaction-list/`: date-range filter, account selector (+ its modal), category selector (+ its modal), search bar + regex toggle, the summary row, and the batch-categorize toolbar (category-to-apply select, Categorize, Delete Category, Revert Categorize, Update Categories).
- `ux-explore` mockup options for this region specifically, built within the already-established "Calm Ledger" direction (`ux/UX_DIRECTION.md`) - not a new app-wide direction round.
- `ux-apply` implementing the chosen option once approved.

### Out of scope
- The transaction row rendering itself (avatar, title, category pills, amount) - already restyled under JIRA_12, not part of this revamp unless the search-section redesign has knock-on layout effects that require it.
- Any change to `TransactionService`/`CategoryService`/`UserAccountService` (`src/service/*.service.ts`) - UI/UX only, per the same constraint `ux-apply` already operates under.
- Splitting `transaction-list` into separate components (search vs. list) - tracked separately as **JIRA_14, which lands first**: this ticket's `ux-apply` run should target the already-separated, already-routed `transaction-search` component JIRA_14 produces, not the current merged `transaction-list.component.*`.

## Affected modules
- [x] finance-manager-ui

## Requirements
1. Follow `ux-explore` (Round 2 style - single page, real data via `db-run`) to produce 2-3 layout options for this region specifically, each optimizing for reduced density/clutter versus the current stacked-controls layout, covering its own empty/error/loading-relevant states (e.g. no accounts selected, no categories available yet).
2. Treat the filter controls (date range, account selector, category selector, search bar) and the batch-categorize toolbar as two visually distinct sections in every option presented - not merged into one block.
3. Get explicit user sign-off on one option before it reaches `Ready for Dev`, per the established `ux/UX_<page>.md` lifecycle.
4. `ux-apply` implements the approved option into the real `transaction-list.component.{html,ts,scss}`, reusing existing logic/handlers where behavior is unchanged, flagging any real deviation the same way prior `ux-apply` runs have.

## Open questions
None outstanding - resolved during refinement (see Changelog).

## Acceptance criteria
- [ ] `ux/UX_transaction-search.md` (or similar, named during `ux-explore`) exists, reaches `Ready for Dev` via explicit user confirmation, and covers all controls listed in Scope.
- [ ] `ux-apply` implements the approved option; `transaction-list.component.*` changes stay within UI/UX (no service-layer changes).
- [ ] Existing transaction-list tests continue to pass; new/changed logic gets characterization tests per `unit-test-generate`.

## Implementation notes
<filled in during/after implementation - design decisions, tradeoffs, follow-ups. Empty at Ready for Dev.>

## Changelog
- 2026-09-11: created from one-liner (Draft)
- 2026-09-11: refinement round 1 - resolved both open questions: driving complaint is density/clutter (not mobile-specific or open-ended), and the filter controls vs. batch-categorize toolbar should stay two visually distinct sections rather than merging into one block (In Refinement)
