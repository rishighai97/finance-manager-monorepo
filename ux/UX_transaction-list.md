<!--
Template for ux/UX_<page>.md. Maintained by the `ux-explore` skill
(.claude/skills/ux-explore/SKILL.md) - don't hand-edit this structure
without updating both this template and that skill. Mirrors
jira/TEMPLATE.md's status-lifecycle pattern, adapted for UX decisions
instead of engineering requirements - see jira/JIRA_12.md for why this
exists as a parallel spec-driven flow rather than folding into jira/.
-->

# UX_transaction-list: Transaction list

**Status**: Ready for Dev <!-- Draft -> Options Presented -> Selected -> Ready for Dev -->
**Created**: 2026-09-11
**Last updated**: 2026-09-11 (round 2)
**Direction**: [ux/UX_DIRECTION.md](UX_DIRECTION.md) - "Calm Ledger", Ready for Dev

## Page
`transaction-list` (`finance-manager-ui/src/app/transaction-list/`) - the Transactions tab.

## Options presented

Real data pulled via `db-run` for HDFC RISHI (`user_account_id=1`), excluding the accumulated Sep 2026 BDD-test noise ("Test debit transaction" x263) by filtering `date < '2026-09-01'`: 8 real transactions spanning two real statement uploads (Jan and Aug 2026), with their real `closing_balance` values. Category data in the dev DB is currently polluted with auto-generated `E2E_STATEMENT_CAT_*` test category rows from BDD runs - mockups show "Uncategorized" as a placeholder for that field rather than the literal noisy names.

Only 2 variants this round (not 3) - the base layout (date-grouped, hairline rows, filter bar) is already what Round 1's Calm Ledger mock showed and is well-established; the real open question here is whether to surface the running balance, which the data actually supports (`transaction.closing_balance`).

Artifact: [Transaction List Layout Options](https://claude.ai/code/artifact/863adb19-d589-4e53-a8df-72f6e964da65)

### Option A - Baseline (amount only)
- **Layout**: date-grouped headers, hairline-divided rows, filter bar (date range / account / category as plain underline-active text controls, matching `UX_DIRECTION.md`), `IBM Plex Mono` amount only, right-aligned, colored by sign.
- **States covered**: happy (the 8 real transactions), empty ("No transactions yet" + points at Upload statements, no illustration), error (muted-clay warning + "Retry" text link), loading (flat skeleton bars per row, no shimmer).

### Option B - With running balance
- **Layout**: same as A, plus a small muted `IBM Plex Mono` running-balance figure under the main amount on each row (real `closing_balance` data) - lets a user see the account's balance trend without leaving the list.
- **States covered**: same four states as A; loading skeleton gets a second, shorter placeholder bar under the amount placeholder for the balance figure.

## Selected option
**Option A - Baseline (amount only)**, confirmed by the user.

## Implementation detail

Grounded against the real `finance-manager-ui/src/app/transaction-list/transaction-list.component.{html,ts,scss}` (read before implementing). This screen has more moving parts than `account-list` - flagging every place the approved mockup differs from, omits, or needs to extend real current behavior:

1. **Avatar**: same as `account-list` - the mockup's outlined-initial-circle replaces the real `<ion-avatar><img [src]="accountMap.get(...)?.icon"></ion-avatar>` per-transaction icon. Same implementation as `account-list`'s point 1.
2. **Account name per row (multi-account view)**: the real template always prefixes the title with the account name - `({{ accountMap.get(transaction.user_account_id)?.user_account_name }}) {{ transaction.title }}`. The mockup only showed a single-account-filtered view (HDFC) so this didn't appear. Keep the information but restyle it: drop the parenthetical prefix from the title line and show the account name as a small muted tag under the title, alongside the category text (e.g. "AXIS &middot; Uncategorized") - same treatment whether 1 or many accounts are selected, so the row doesn't visually change shape when the filter changes.
3. **Category pills are interactive, not static text**: the real row supports up to 5 categories per transaction as removable pills (`category-pill` with a `close-circle-outline` remove button each) plus an "add category" button. The mockup's "Uncategorized" placeholder text was a stand-in for the empty case only. Keep the real interactivity - restyle each pill as plain small muted text separated by a middle dot (no filled chip background, per direction contract), with the remove action as a small thin "&times;" glyph in `--ion-color-medium` appearing next to each on tap/hover rather than a colored icon button, and "add category" as a small "+" text link in the accent color when fewer than 5 are present.
4. **Summary row (Opening/Debit/Credit/Closing) is missing from the mockup**: the real screen has a 4-stat row above the list (`summary-container`) using colored `summary-amount` classes. Don't drop it - restyle as four plain text columns (label 10px muted caps above, `IBM Plex Mono` 13px figure below, danger/success/ink by sign, no colored backgrounds), separated by hairlines, sitting between the filter row and the date-grouped list.
5. **Filter row is 3 native Ionic controls, not plain text chips**: `ion-input type="date"` x2 (From/To) and two tap-to-open-modal fields (Accounts, Category) via `ion-item`/`ion-input[readonly]`. Restyle each as the mockup's plain underline-active text control (no boxed `ion-item` styling, no floating labels) while keeping the same click targets (`openAccountSelector()`, `openCategorySelector()`) and native date pickers.
6. **"Select Accounts" modal has no search or collapse today** (`ion-modal` bottom sheet, breakpoints `[0, 0.25, 0.5, 0.75]`, grouped by `level_1_title` with plain checkboxes) - this is the direct answer to "how do multiple accounts scale here": apply the **same collapsible-section mechanism just chosen for `account-list`** to this modal's groups, rather than introducing a different (search-based) pattern in one place and collapse in another. Restyle rows to match `account-list`'s account row (outlined-initial circle, no icon image, hairline dividers), keep the existing `ion-checkbox` interaction but restyle the check mark to the accent color instead of Ionic's default.
7. **"Select Categories" modal already has a searchbar** (`ion-searchbar` inside that modal) - no scaling gap there, just restyle the searchbar and checkbox rows to match the direction's flat/hairline vocabulary (no card, no default Ionic search styling).
8. **Two distinct "nothing to show" conditions, not one**: `noAccountsSelected` (zero accounts picked in the filter - shows a dedicated warning block with a "Select Accounts" button) is separate from "accounts selected but zero transactions match" (`getTransactions().length === 0`, the `empty-state` block pointing at Statement Uploader). Keep both as distinct states with distinct copy/CTA - don't collapse them into one generic empty state:
   - *No accounts selected*: icon + "Select at least one account" + a text-link-style "Select accounts" CTA (opens the same modal as point 6).
   - *No transactions match*: icon + "No transactions yet" + "Upload a bank or broker statement to see transactions here" + "Go to Upload statements" text link (matches the mockup's empty state already).
9. **Error state is new**: same gap as `account-list` - the transactions fetch's error callback (`(error) => { console.error(...); this.isLoading = false; }`) only logs and falls through to the empty state today, which would misleadingly claim "no transactions" on a real fetch failure. Add a `hasError` flag and render the mockup's dedicated error template instead, same pattern as `account-list`'s point 4.

Layout, by template region (beyond what's covered above):
- **Header**: same treatment as `account-list` - flat toolbar background, `Source Serif 4` title override, muted refresh icon, `IBM Plex Mono` meta count ("N rows").
- **List** (`ion-list`): remove `[inset]="true"`, flat background, hairline dividers per row and per date-group header, same as `account-list`.
- **Date-group headers**: plain small-caps `IBM Plex Sans` label, no total (unlike `account-list`'s section headers, which do carry a total) - transactions don't aggregate meaningfully by date the way accounts aggregate by type.
- **Transaction row**: avatar (point 1) + title (`IBM Plex Sans` 14px/500) + account tag + category tags (point 2/3) stacked, trailing amount (`IBM Plex Mono` 13px/500, right-aligned, danger/success by sign) - no running-balance line (that's Option B, not selected).
- **Loading**: replace `<ion-item><ion-label>Loading transactions...</ion-label><ion-spinner></ion-spinner></ion-item>` with the mockup's flat skeleton bars, same pattern as `account-list`.
- **Tab bar**: same `UX_DIRECTION.md` tokens as every other page - recolor only.

## Changelog
- 2026-09-11: created, 2 options presented (Draft -> Options Presented)
- 2026-09-11: user confirmed Option A; filled in Selected option and Implementation detail (grounded against the real `transaction-list.component.*` - flagged 9 deliberate deviations/extensions: avatar, per-row account tag, interactive category pills, the missing summary row, native filter controls, the account-selector modal's scaling (now matching account-list's collapsible-section mechanism), the category modal's existing search, two distinct empty conditions, and a new error state); marked Ready for Dev (Options Presented -> Ready for Dev)
