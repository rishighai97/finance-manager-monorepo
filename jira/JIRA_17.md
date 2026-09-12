# JIRA_17: Amazon-style search + filter button, filters in a modal

**Status**: Done <!-- Draft -> In Refinement -> Ready for Dev -> In Progress -> Done -->
**Created**: 2026-09-12
**Last updated**: 2026-09-12 (Done)

## One-liner
New UX for filter and search - a search bar with a filter button at the right of the regex button, like Amazon; clicking the filter button opens a modal with the filters that can be applied.

## Summary
`transaction-list`'s current filter UI (`ux/UX_transaction-search.md`'s Option 4, implemented under `jira/JIRA_14.md`'s addendum) shows the date range/account/category/DR-CR filter chips as an **always-visible inline row** above the search bar. This request proposes a different pattern: collapse those same filters into a **modal**, triggered by a filter icon button placed at the right end of the search row - specifically to the right of the existing "Regex" toggle - similar to how Amazon's product search combines a search field with an adjacent filter icon that opens a full filter sheet.

This is a real UX direction change from the currently-shipped Option 4 (inline, always-visible), not a tweak - it goes through `ux-explore` for a proper mockup and explicit sign-off before any implementation, the same as every other structural UI decision in this app's history (see `ux/UX_transaction-search.md`'s own back-and-forth on this exact tradeoff).

## Scope

### In scope
- A filter icon button added to `transaction-list.component.html`'s `.search-row`, positioned after the `.regex-toggle`.
- Tapping it opens a modal containing the same filter controls `transaction-search.component.ts` already owns (date range, account selector + its own modal, category selector + its own modal, DR/CR) - reusing the existing components/handlers/state, not rebuilding them.
- Some visual indication on the filter button itself when one or more filters are actively applied (e.g. a small dot/badge), so the always-visible chip row's "you can see what's filtered at a glance" property isn't silently lost once filters move behind a tap.
- A quick `ux-explore` round mocking up the button placement, the modal's layout, and the active-filter indicator, grounded in the existing Calm Ledger direction and current real controls.

### Out of scope
- Any change to the filter logic itself (`applyFilters()`, `emitFilters()`, the account/category modals' own internals, date-range logic) - this is about *where* the controls live and how they're opened, not what they do.
- The account-selector and category-selector modals' own internal design (grouping, search) - unchanged, just nested inside the new outer filter modal instead of opened directly from an inline chip.
- Re-opening JIRA_16's density-pass decisions (search bar height, balance row, bulk-button compactness) - unrelated, already Done.

## Affected modules
- [x] finance-manager-ui

## Requirements
1. Run a quick `ux-explore` round proposing the filter-button + modal design (button placement/icon, modal layout reusing the real filter controls, active-filter indicator), grounded in real data and the existing Calm Ledger direction.
2. Get explicit user sign-off on the design before `ux-apply` implements.
3. `ux-apply` implements the approved design: `transaction-search.component.ts`'s filter-bar markup moves into a modal; a new filter-button + active-indicator is added to `transaction-list`'s search row; `TransactionsPageComponent`'s wiring (`filtersApplied` -> `applyFilters()`) stays the same mechanism, just triggered from inside the new modal instead of always-visible chips.
4. No behavior change to filter application itself - only the container/trigger changes.

## Open questions
None outstanding - user confirmed the mockup (see Changelog).

## Acceptance criteria
- [x] `ux/UX_<page>.md` entry (new or appended) covers the filter-button/modal design, reaches `Ready for Dev` via explicit user confirmation.
- [x] Filter controls are reachable via a filter button in the search row, opening a modal - not an always-visible chip row.
- [x] The filter button visually indicates when one or more filters are active.
- [x] Existing tests continue to pass; `ux-apply` adds/updates characterization tests for the new modal-open/close behavior.

## Implementation notes

Full write-up lives in `ux/UX_transaction-search.md`'s Round 2 implementation notes. Summary:
- Filter button added to `transaction-list`'s search row (`@Output() openFilters`, forwarded by `TransactionsPageComponent` to a new `TransactionSearchComponent.openFilterModal()`).
- `TransactionSearchComponent`'s always-visible chip row replaced by one Filters modal: date range inline, account/category rows opening the existing nested modals unchanged, DR/CR as a 3-segment control, explicit "Apply filters" (`applyFiltersFromModal()`) replacing per-change emission, new "Clear all" (`clearAllFilters()`). The old date-range-specific modal and `getDateRangeText()` were removed as no longer needed.
- **Real bug found and fixed during live verification**: clearing all accounts and applying hid the entire search row (including the filter button), leaving no way back in - the search row was nested inside the same `noAccountsSelected` conditional the old chip row was, which made sense for that row but not for the filter button, which is now the only path to the account selector. Fixed by making the search row always visible; only the summary/batch rows stay conditional. Restored an actionable "Select accounts" link in the "no accounts selected" state, pointing at the same filter button handler.
- Verified: `ng build` clean, full suite 127/127 passing, live end-to-end via `claude-in-chrome` (real HTTP request confirmed via network inspection, active-filter dot confirmed, dead-end bug reproduced and then confirmed fixed).

## Changelog
- 2026-09-12: created from one-liner (Draft)
- 2026-09-12: `ux-explore` round presented - filter icon (next to Regex toggle) with an active-filter dot indicator, opening a modal with the real filter controls; real account/category data via `db-run`. See `ux/UX_transaction-search.md`'s Round 2 addendum. Awaiting confirmation (In Refinement)
- 2026-09-12: user confirmed the mockup ("perfect. Go ahead") - marked Ready for Dev (In Refinement -> Ready for Dev)
- 2026-09-12: implemented - filter button + Filters modal, found and fixed a real dead-end bug live (clearing all accounts hid the only way back to the filter modal). Verified build/tests (127/127)/live end-to-end. Marked Done (Ready for Dev -> Done)
