<!--
Template for ux/UX_<page>.md. Maintained by the `ux-explore` skill
(.claude/skills/ux-explore/SKILL.md) - don't hand-edit this structure
without updating both this template and that skill. Mirrors
jira/TEMPLATE.md's status-lifecycle pattern, adapted for UX decisions
instead of engineering requirements - see jira/JIRA_12.md for why this
exists as a parallel spec-driven flow rather than folding into jira/.
-->

# UX_account-list: Account list

**Status**: Ready for Dev <!-- Draft -> Options Presented -> Selected -> Ready for Dev -->
**Created**: 2026-09-11
**Last updated**: 2026-09-11 (round 4)
**Direction**: [ux/UX_DIRECTION.md](UX_DIRECTION.md) - "Calm Ledger", Ready for Dev

## Page
`account-list` (`finance-manager-ui/src/app/account-list/`) - the Accounts tab, the app's landing screen.

## Options presented

Real data pulled via `db-run` against the local dev DB (user_id 1, the 6 clean demo accounts - HDFC, ICICI, SARASWAT, CANARA, AXIS, GROWW; excludes the accumulated TJSB test-account rows). Snapshot at generation time: HDFC &#8377;5,000.00 (last txn 2026-09-10, 263 rows from repeated local test uploads), ICICI &minus;&#8377;54,146.36, SARASWAT &minus;&#8377;67,107.52, CANARA &#8377;29,566.50, AXIS &minus;&#8377;24,499.51 (all `cash`/`bank`), GROWW &#8377;0.00 (`investment`/`mutual_fund`, balance is `NULL` in the DB since `GrowwStatementReader` doesn't populate `closing_balance` - rendered as 0.00, matching the real app's current behavior). Cash total &minus;&#8377;111,186.89.

Artifact: [Account List Layout Options](https://claude.ai/code/artifact/332900af-1304-4791-8510-309ecd42e6ac)

### Option A - Grouped (baseline)
- **Layout**: Cash section (header + running total) with 5 rows, Investment section (header + total) with 1 row - matches the structure already validated in Round 1's Calm Ledger mock.
- **States covered**: happy (the real data above), empty ("No accounts linked yet" + a thin-bordered "+ Add account" affordance, no illustration), error (muted-clay warning line + "Retry" text link, no alarming color), loading (flat skeleton bars in place of avatar/text/amount, no shimmer since this is static).

### Option B - Flat, sorted by exposure
- **Layout**: no section headers/totals - one flat list, each row tagged inline (`SAV`/`MF`) next to the account name, sorted by `|balance|` descending (Saraswat, ICICI, Axis, Canara, HDFC, Groww) so the largest positions surface first regardless of cash/investment split.
- **States covered**: same four-state treatment as Option A, adapted to the flat layout (no section-level empty/loading needed since there's only one list).

### Option C - Grouped + net worth summary
- **Layout**: same grouped structure as Option A, plus one compact "Net worth" line (label + `IBM Plex Mono` figure, no card/hero treatment) under the header, above the Cash section - the group subtotals alone don't give an at-a-glance single number.
- **States covered**: same four states as Option A; the net worth line itself also gets a loading-skeleton and error treatment (falls back to "—" with the same muted-clay error line if the underlying fetch fails, rather than blocking the rest of the list).

## Selected option
**Option C - Grouped + net worth summary** (switched from the initially-confirmed Option A after re-review). Keeps the existing two-level (`type_1`/`type_2`) grouping data structure the real component already has (`AccountGrouper` -> `level1Group`/`groupedAccount` in `account-list.component.ts`) - same as A, plus one compact net-worth line under the header. Everything below that was written for A carries over unchanged (this option only adds the net-worth line on top of A's restyling) except where marked.

## Implementation detail

Grounded against the real `finance-manager-ui/src/app/account-list/account-list.component.{html,ts,scss}` (read before implementing - this section flags three places where the approved mockup differs from, or omits, real current behavior; these are deliberate decisions for `ux-apply` to carry out, not oversights to silently "fix" back to the mockup's literal pixels):

1. **Avatar**: the mockup's 26px thin-outlined-circle-with-initial replaces the real `<ion-avatar><img [src]="account.icon"></ion-avatar>` (colorful per-bank icon image) - per `UX_DIRECTION.md`'s "one identity mark, no colored filled badges" rule. Implement as a plain styled `div` (not `ion-avatar`), 26px circle, 1px `border: 1px solid` a `--app-divider`-family color, uppercase first letter of `account.user_account_name`, `IBM Plex Sans` 11px/600, ink-muted color. Drop the `account.icon` `<img>` entirely from this view.
2. **Settings entry point**: the mockup doesn't show the existing `fill="outline" color="primary"` "Settings" pill button (`showAccountOptions(account, $event)`). Don't drop the functionality - replace the bordered pill with a plain inline text link ("Settings", 12px, `--ion-color-medium`, no border/background) positioned next to the last-statement date, keeping the same `(click)="showAccountOptions(account, $event)"` handler and its event-propagation stop (row tap still calls `onAccountClick(account)` separately).
3. **Add-account FAB**: the mockup's empty-state drew an inline "+ Add account" bordered button - that's redundant with the real screen's existing `<ion-fab vertical="bottom" horizontal="end" slot="fixed"><ion-fab-button (click)="openAccountModal()">` floating button. Drop the mockup's inline button; instead restyle the existing FAB's background to the accent (`--ion-color-primary`, i.e. `#B0603F`) and keep it visible across all four states (it already is) as the one add-account entry point - don't add a second one.
4. **Error state is new**: `ngOnInit`'s `groupedUserAccounts$.subscribe((accounts) => {...})` (line ~178) currently has no error callback at all. Add one (a second `subscribe` argument or `catchError`) that sets a new `hasError: boolean` flag on the component and renders the error template instead of the list - this is component-internal logic, not a `src/service/*.service.ts` change, so it's in scope for `ux-apply`. On retry (tap the "Retry" text link), re-invoke whatever refresh path `refreshWithAnimation($event)` already uses.

Layout, by template region:
- **Header** (`ion-header`/`ion-toolbar`/`ion-title`): set `--ion-toolbar-background: var(--ion-background-color)` (flat, matches page - no distinct toolbar color). Override `ion-title`'s font to `'Source Serif 4', Georgia, serif`, 24px, weight 600, letter-spacing -0.01em (Ionic's default title styling doesn't support this via attribute - use a component SCSS override). Keep the existing refresh `ion-button`/`ion-icon` in the toolbar end slot, recolored to `--ion-color-medium` (muted, not accent) so it doesn't compete with the title. Add a small `IBM Plex Mono` 11px muted meta count ("N linked") in the toolbar, right-aligned before the refresh button.
- **Net worth line (new, Option C)**: a single row directly below the header, above the first `level1-item` - "Net worth" label (12px, `--ion-color-medium`) left, sum of every `groupedAccount`'s balance in `IBM Plex Mono` 17px/600 right, colored via the same danger/success/ink-by-sign rule as everywhere else. No card, no icon. Bottom border `1px solid var(--app-divider)`. Compute the total client-side from the same `groupedUserAccounts$` stream the list already renders from - don't add a new API call for it. **Loading**: a skeleton bar pair (label-width + figure-width) in place of the row, same skeleton treatment as the list below. **Error**: falls back to `&mdash;` in place of the figure, independently of whether the list itself loaded - i.e. if the net-worth-relevant stream errors, show `&mdash;` here without necessarily blocking the account list (in practice both come from the same stream today, so this degrades to "both show their error state together" until/unless that stream is ever split - don't over-engineer independent error handling that the current data flow doesn't support).
- **List** (`ion-list`): remove `[inset]="true"` and its card/shadow styling entirely - flat background, no radius, no elevation. Keep `lines="none"` (dividers are hand-drawn hairlines via SCSS, not Ionic's item lines) as `border-bottom: 1px solid var(--app-divider-subtle)` on account rows and `var(--app-divider)` on section-header rows.
- **Level 1 group header** (`level1-item`): plain row, `IBM Plex Sans` 11px/600 uppercase small-caps label (`text-transform: uppercase` handles the DB's lowercase `type_1` values automatically) + `IBM Plex Mono` 12px total, colored via the existing `danger`/`success` `ngClass` logic but mapped to `--ion-color-danger` (`#A15C46`) / `--ion-color-success` (`#5C7A5E`) as plain text color - remove the `ion-chip` pill entirely (no filled backgrounds, per direction contract).
- **Level 2 group header** (`level2-item`, the real `type_2` sub-grouping, e.g. "bank"/"mutual_fund"): **collapse it when a level-1 group has exactly one level-2 subgroup** (true for both `cash`->`bank` and `investment`->`mutual_fund` in current data) - don't render a redundant second header whose total duplicates the level-1 total. If a level-1 group ever has 2+ level-2 subgroups, render each as a secondary muted sub-label (smaller/lighter than the level-1 header) above its accounts, same "no chip" text-only total treatment.
- **Collapsible sections (scaling decision)**: make each level-1 group header tappable - a small muted chevron (rotates 90&deg; collapsed/expanded) toggles that group's rows, collapsing to just the header + its total (see the "Scaling past 5-6 accounts" mockup in the same artifact). Default: all groups expanded on first load, per-group state held in component state (not persisted). This directly answers how the screen scales past ~10 accounts, and the same mechanism should be reused for `transaction-list`'s "Select Accounts" modal (see `ux/UX_transaction-list.md`) rather than introducing a different pattern there.
- **Account row** (`account-item`): 12px vertical padding, avatar (see point 1) + name (`IBM Plex Sans` 14px/500, ink) + last-statement date (`IBM Plex Sans` 10.5px, `--app-color-muted`) + Settings link (see point 2) stacked/inline as space allows, trailing balance (`IBM Plex Mono` 13px/500, right-aligned, danger/success/ink by sign) behind a 1px `border-left` divider with 10px left padding for the tabular-alignment feel.
- **Loading state**: replace the current `<ion-item><ion-label>Loading accounts...</ion-label><ion-spinner></ion-spinner></ion-item>` text-and-spinner row with the mockup's flat skeleton bars (`background: var(--app-divider-subtle)`, `border-radius: 3px`, no shimmer animation needed) matching the row anatomy (avatar circle, two text-line placeholders, amount placeholder) - repeat for a representative count (5-6 rows), not just one.
- **Empty state**: keep the existing `wallet-outline` icon + heading + paragraph structure, restyle the icon to a thin thin-stroke 30px outline in `--app-divider`-family gray (not Ionic's default filled/accent icon), heading in `IBM Plex Sans` 15px/500 ink, paragraph 12.5px muted - and drop the inline CTA button per point 3 above (the FAB already covers it).
- **Error state (new)**: centered icon (thin-stroke warning circle, `--ion-color-danger`) + "Couldn't load accounts" (15px/500 ink) + one-line explanation (12.5px muted) + "Retry" as an underlined text link in `--ion-color-primary`, not a button.
- **Tab bar**: apply `UX_DIRECTION.md`'s navigation-pattern tokens (`--ion-tab-bar-background`, `--ion-tab-bar-color`, `--ion-tab-bar-color-selected`) - the existing Ionicons stay, this is a recolor only, not an icon-set swap.

## Changelog
- 2026-09-11: created, 3 options presented (Draft -> Options Presented)
- 2026-09-11: user confirmed Option A; filled in Selected option and Implementation detail (grounded against the real `account-list.component.*` - flagged 3 deliberate deviations from the mockup's literal pixels: avatar, Settings entry point, add-account FAB; added a genuinely new error state/flag); marked Ready for Dev (Options Presented -> Ready for Dev)
- 2026-09-11: user switched the selection to Option C (Grouped + net worth) after re-review; added the net-worth line's implementation detail (computed client-side from the existing account stream, own loading/error treatment) on top of A's unchanged detail. Still Ready for Dev - the >5-6-account scaling mechanism (collapsible sections vs. search, explored in the same artifact) remains a separate open decision, not yet folded in
- 2026-09-11: user picked collapsible sections (not search) as the scaling mechanism; added it to Implementation detail and cross-referenced it from `ux/UX_transaction-list.md`'s account-selector-modal decision, for consistency across the app
