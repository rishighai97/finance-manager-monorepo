# JIRA_23: New Graphs page with graph-type dropdown + reusable filter component

**Status**: Done <!-- Draft -> In Refinement -> Ready for Dev -> In Progress -> Done -->
**Created**: 2026-09-19
**Last updated**: 2026-09-19

## One-liner
ux - new page for graphs. Have a dropdown for graph type and filter button at right (filter can be created as component and reused in transaction and graph page). Based on filter and graph type generate graph. Good UX for this please.

## Summary
A new "Graphs" page in `finance-manager-ui` that visualizes transactions: a graph-type dropdown on the left/top and a filter button on the right (mirroring `transaction-search`'s existing filter-button pattern), which together drive what's rendered. The filter itself (`finance-manager-ui/src/app/transaction-search/`, currently named/scoped for the transaction page) should be generalized into a shared, reusable component so both the existing Transactions page and this new Graphs page use the same account/date/category/debit-credit filter UI and modal, rather than duplicating it. Since this explicitly asks for "good UX," this ticket's actual page/graph design should go through the established `ux-explore` -> `ux-apply` workflow (`jira/JIRA_12.md`, `ux/UX_DIRECTION.md`) rather than being designed ad hoc here - this ticket captures the functional spec and scope, `ux-explore` produces the layout/visual options, and `ux-apply` implements the approved one.

## Scope

### In scope
- New "Graphs" page/route in `finance-manager-ui`, added as its own bottom tab in `ion-tab-bar` (alongside Accounts/Upload/Transactions/Categories/Logout).
- Graph-type dropdown offering all four of: **Spending by category**, **Income vs. expense over time**, **Balance trend over time**, and **Monthly spending trend** - every option always listed, user switches between them freely.
- The active filter selection (accounts, date range, categories, debit/credit) applies to whichever graph type is selected: for "Spending by category" the category filter narrows which categories are included in the breakdown (all categories included by default when none are explicitly selected, consistent with the filter's existing all-by-default behavior); for the other three graph types, the same filters narrow the underlying transaction set the same way they do on the Transactions page.
- Charting via **Chart.js** (new dependency for `finance-manager-ui`), themed to match `ux/UX_DIRECTION.md`'s tokens.
- Extracting the filter UI currently in `transaction-search` (account selector, date range, category selector, debit/credit indicator, Apply/Clear) into a standalone, reusable component with no transaction-page-specific naming/coupling, used by both the Transactions page and the new Graphs page.
- Client-side chart rendering, computed from transactions fetched via the existing `TransactionService`/`transaction-service` `/transaction/v1/fetch_all` endpoint (same data source `transaction-list` already uses) and the active filter selection - no new backend endpoints.
- Following the `ux-explore` (Round 2, within the existing `UX_DIRECTION.md` direction) -> `ux-apply` workflow for the actual page layout and chart visual design, per JIRA_12/JIRA_13's precedent.
- `docs/SKILLS.md`/architecture docs updates if the new page or shared filter component changes anything those docs track (new `finance-manager-ui` route/component - `diagram-maintain` should be checked).

### Out of scope
- Any backend/API changes (`account-service`, `api-gateway`, `transaction-service`, `statement-loader`) - purely a `finance-manager-ui` feature using existing endpoints.
- Server-side data aggregation/new query endpoints - all aggregation for charts happens client-side over the already-fetched transaction set.
- Redesigning the existing Transactions page's own layout beyond swapping in the newly-extracted shared filter component in place of `transaction-search`'s current inline implementation.

## Affected modules
- [x] finance-manager-ui
- [x] root / docs / CI

## Requirements
1. Extract `transaction-search`'s filter logic/UI (accounts, date range, categories, debit/credit, Apply/Clear, plus the nested account/category selector modals) into a new standalone, reusable component, decoupled from transaction-specific naming, that emits the same `TransactionFilters`-shaped output.
2. Wire the Transactions page to use the extracted shared component in place of its current inline one (no behavior change there).
3. Build a new Graphs page, added as its own tab (`tabs.routes.ts`/`tabs.page.html`), with a graph-type dropdown (all four types always listed: Spending by category, Income vs. expense over time, Balance trend over time, Monthly spending trend) and a filter button (opening the shared filter component's modal) positioned at the right, per the one-liner.
4. Selecting a graph type and/or applying filters (re)generates the graph from the currently-filtered transaction set; for "Spending by category" specifically, the category filter's selection determines which categories appear in the breakdown (all included by default when none are explicitly selected).
5. Integrate Chart.js as a new `finance-manager-ui` dependency, styled to match `ux/UX_DIRECTION.md`'s color/type tokens.
6. Go through `ux-explore` Round 2 (within the existing direction) to produce layout/visual options for this page - including how each of the four graph types looks and how the dropdown/filter/chart region is arranged - get explicit user sign-off, then `ux-apply` to implement.

## Open questions
<none - all resolved, see Changelog>

## Acceptance criteria
- [x] A reusable filter component exists and is used by both the Transactions page and the new Graphs page, with no duplicated filter UI/logic.
- [x] The Graphs page renders a graph reflecting the selected graph type and active filters, and updates when either changes.
- [x] `ux/UX_graphs.md` (or similar) exists, reaches Ready for Dev via explicit user sign-off, and `ux-apply` implements the approved option.
- [x] Existing Transactions page tests continue to pass after swapping in the shared filter component; new logic gets characterization/unit tests per `unit-test-generate`.

## Implementation notes
- **Filter extraction**: `transaction-search/` moved to `finance-manager-ui/src/app/shared/transaction-filter/` (`TransactionSearchComponent` -> `TransactionFilterComponent`, `app-transaction-search` -> `app-transaction-filter`), used by both `transaction-list`/`transactions-page` (via the same `@Output` forwarding it always used) and the new `graphs` page (via a template reference, simpler since both live in one component there - see `ux/UX_graphs.md`'s Implementation notes point 2).
- **New Graphs page**: `finance-manager-ui/src/app/graphs/`, added as its own bottom tab (`tabs.routes.ts`/`tabs.page.html`). Implements Option 1 - Spare from `ux/UX_graphs.md`: dropdown + filter button, chart fills the rest of the screen, all four graph types, mandatory hover tooltips on every mark, and all five states (happy/loading/error/empty/balance-trend-guidance).
- **Real deviation from Requirement 5: Chart.js was not added.** All four graph types (a donut, grouped bars, single-series bars, a 4-point line) are hand-drawn inline SVG, matching `ux/UX_graphs.md`'s Implementation detail point 3, which flagged this as a live decision for `ux-apply` to make rather than adding the dependency by default. None of the four forms needed a charting library's actual value-add (scales, axes, many-point performance); adding one would have been unused weight. Revisit if a future graph type needs it.
- Full details, including the multi-category double-counting rule, the `>5`-categories-fold-into-"Other" rule, the categorical-color-validation follow-up, and the `closing_balance` model-typing note, are in `ux/UX_graphs.md`'s own Implementation notes rather than duplicated here.
- **Verification**: `ng build --configuration development` clean; full test suite 138/138 passing (11 new for `GraphsComponent`, all pre-existing specs unaffected by the filter-component rename).
- **Live-testing follow-up**: user reported "filter icon is not visible" and "Graph is too huge" against the real running app. Root-caused and fixed both via `claude-in-chrome` (an `ion-content[fullscreen]` header-offset bug and a `height:100%`-on-a-flex-item sizing bug - full detail in `ux/UX_graphs.md`'s Implementation notes point 9), plus a third bug found in the same pass (stale tooltip surviving a graph-type switch). All three confirmed fixed live against real account data; full suite re-verified (138/138).

## Changelog
- 2026-09-19: created from one-liner (Draft)
- 2026-09-19: refinement round 1 - resolved all three open questions: dropdown always lists all four graph types (spending by category, income vs. expense over time, balance trend over time, monthly spending trend), active filters apply to whichever type is selected (category filter narrows the category breakdown specifically, all-by-default when none selected); new page lands as its own bottom tab; Chart.js approved as the new charting dependency (In Refinement)
- 2026-09-19: confirmed by user - marked Ready for Dev
- 2026-09-19: implemented via `ux-apply` (see `ux/UX_graphs.md` for the full design/implementation record) - filter component extracted and shared, new Graphs page/tab built with all four graph types as inline SVG (Chart.js deliberately not added - see Implementation notes), all five states, mandatory hover tooltips. Verified with a clean build and full test suite (138/138); no live browser check performed. Marked Done
- 2026-09-19: user reported two live bugs ("filter icon is not visible", "Graph is too huge") - reconnected `claude-in-chrome`, root-caused and fixed both plus a third bug found in the same pass (stale tooltip on graph-type switch); see `ux/UX_graphs.md`'s Implementation notes point 9. Confirmed fixed live against real account data, full suite re-verified (138/138). Remains Done
