# JIRA_14: Split transaction-list into separate search and list components

**Status**: In Refinement <!-- Draft -> In Refinement -> Ready for Dev -> In Progress -> Done -->
**Created**: 2026-09-11
**Last updated**: 2026-09-11 (round 1)

## One-liner
Separate components to have transaction search and transaction list as separate components in transaction component.

## Summary
`finance-manager-ui/src/app/transaction-list/transaction-list.component.ts` (1100+ lines) currently owns everything: the date/account/category/search filter controls, the batch-categorize toolbar, and the transaction rows themselves, all in one component with one large template. This is a pure code-structure-and-navigation refactor - split the filter/search/toolbar region into its own routed component (`transaction-search`) and keep the transaction rows in `transaction-list`, communicating via a parent container using `@Input`/`@Output`. **`transaction-search` gets its own route**, not an inline block on the same screen - the transaction list's own screen gets a trigger (exact UI TBD, likely a filter/search icon in the header) that navigates to it; applying filters there navigates back to (or updates) `transaction-list` with the new filter state. No visual/design change is in scope here beyond what's needed to add that navigation trigger; that's what JIRA_13 is for. **This ticket lands first** - JIRA_13's eventual `ux-apply` run then targets the already-separated, already-routed `transaction-search` component, landing a smaller, cleaner diff for the visual redesign.

## Scope

### In scope
- Extract the filter/search controls (date range, account selector + modal, category selector + modal, search bar + regex toggle) and the batch-categorize toolbar (category-to-apply select, Categorize/Delete Category/Revert Categorize/Update Categories) out of `transaction-list.component.*` into a new standalone component.
- Keep the transaction rows, summary row, empty/error/loading states, and their rendering logic in `transaction-list.component.*`.
- Define how the two components communicate (e.g. `@Input`/`@Output`, a shared service, or a parent container component) - this is the main design decision for this ticket.
- Update/add unit tests for both resulting components (via `unit-test-generate`, existing-feature mode - behavior is unchanged, so this is a characterization/seam-change situation, not TDD).

### Out of scope
- Any visual/UX change to the search section - that's JIRA_13, which should build on top of whatever component structure this ticket produces (or vice versa, depending on which lands first).
- Any change to `src/service/*.service.ts` files.
- Splitting any other page's component (this is scoped to transaction-list only).

## Affected modules
- [x] finance-manager-ui

## Requirements
1. New standalone, routed component `transaction-search` owns the filter controls and batch-categorize toolbar's template, state, and handlers currently in `TransactionListComponent`. Add its route under `tabs.routes.ts` (exact path TBD, e.g. `/tabs/transactions/search`).
2. `TransactionListComponent` keeps the transaction rows and their rendering, plus a new trigger (button/icon) that navigates to `transaction-search`'s route.
3. Applying filters in `transaction-search` returns to `transaction-list` with the new filter state applied - via `@Output`/route params/query params to a coordinating parent (resolve exact mechanism during implementation; `@Input`/`@Output` through a parent container is the default approach, per refinement).
4. Whatever cross-component data these controls currently share directly (e.g. `selectedAccountIds`, `startDate`/`endDate`, `selectedCategoryIds`, `searchTerm`, `regexSearch`, `batchCategoryInput`) gets an explicit, typed communication path between the two components - no implicit shared mutable state.
5. No behavior change beyond the navigation split itself: every existing handler (`loadTransactions`, `refreshTransactions`, `categorizeAllSearched`, `deleteCategoryAllSearched`, `resetCategoryChanges`, account/category selector modals, etc.) continues to work exactly as before.
6. Existing `transaction-list.component.spec.ts` tests are updated/split to match the new component boundaries rather than left broken.

## Open questions
- [ ] Exact navigation trigger on `transaction-list` to reach `transaction-search` (icon in the header vs. a dedicated button) - a minimal placeholder is fine here since JIRA_13 owns the actual visual design; just needs *something* clickable for this ticket's acceptance criteria to verify end-to-end.
- [ ] Exact route path/segment for `transaction-search` under `tabs.routes.ts`.
- [ ] How results flow back: does confirming filters in `transaction-search` navigate back automatically, or does the user navigate back manually (e.g. a back button) with the filter state already applied reactively?

## Acceptance criteria
- [ ] `transaction-search` exists as its own standalone, routed Angular component with its own `.ts`/`.html`/`.scss`/`.spec.ts`.
- [ ] `transaction-list.component.*` no longer contains the filter/search/toolbar template or its dedicated state - only transaction-row rendering plus the navigation trigger remains.
- [ ] Navigating to `transaction-search`, changing filters, and returning to `transaction-list` produces the same filtered result the current inline controls would have - verified live via `claude-in-chrome` against the running local stack, not just unit tests.
- [ ] All existing and updated unit tests pass; no `src/service/*.service.ts` files are touched.

## Implementation notes
<filled in during/after implementation - design decisions, tradeoffs, follow-ups. Empty at Ready for Dev.>

## Changelog
- 2026-09-11: created from one-liner (Draft)
- 2026-09-11: refinement round 1 - resolved communication mechanism (parent container + @Input/@Output), confirmed `transaction-search` gets its own route rather than staying inline (a bigger navigation change than initially scoped - Summary/Requirements updated accordingly), and confirmed this ticket lands before JIRA_13 so that ticket's `ux-apply` targets an already-separated component (In Refinement)
