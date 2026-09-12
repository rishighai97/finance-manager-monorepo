<!--
Template for ux/UX_<page>.md. Maintained by the `ux-explore` skill
(.claude/skills/ux-explore/SKILL.md) - don't hand-edit this structure
without updating both this template and that skill. Mirrors
jira/TEMPLATE.md's status-lifecycle pattern, adapted for UX decisions
instead of engineering requirements - see jira/JIRA_12.md for why this
exists as a parallel spec-driven flow rather than folding into jira/.

This spec is cross-page (jira/JIRA_16.md) rather than one page - it
covers a single density/consistency decision applied identically across
transaction-list, category-list, and transaction-search, so it lives in
its own file rather than being duplicated into three page specs.
-->

# UX_density-pass: Search bar height, balance row, bulk-action buttons

**Status**: Implemented <!-- Draft -> Options Presented -> Selected -> Ready for Dev -> Implemented -->
**Created**: 2026-09-12
**Last updated**: 2026-09-12 (Implemented)
**Direction**: [ux/UX_DIRECTION.md](UX_DIRECTION.md) - "Calm Ledger", Ready for Dev

## Page
Cross-page (`jira/JIRA_16.md`) - not one page. Three areas, three components:
- Search bar height: every `ion-searchbar` in the app - `transaction-list.component.html` (main + add-category modal), `category-list.component.html` (main), `transaction-search.component.html` (category-selector modal).
- Balance summary row: `transaction-list.component.html`'s `.summary-container` (Opening/Debit/Credit/Closing) only - the only page with this row.
- Bulk-action buttons: `transaction-list.component.html`'s `.batch-categorize-row` (Categorize/Delete Category/Revert Categorize/Update Categories) only - the only page with this row.

## Options presented

Real data used for the balance row: account_id=1's non-test transactions (Jan-Aug 2026) - Opening ₹50,000.00, Debit ₹1,24,743.52, Credit ₹83,652.02, Closing ₹36,691.18 (derived from the account's own `closing_balance` values, same convention as every prior round on this app - real numbers, not fabricated ones).

Artifact: [Density Pass Options](https://claude.ai/code/artifact/90f5d1a0-f5ec-44ce-ba9c-948506097c88)

### 1 - Search bar height
One proposal, not multiple options (the fix is mechanical once agreed): shrink every `ion-searchbar` from its current ~48px default to 32px - matching the batch-row buttons' height exactly - and replace the default boxed cancel/clear button with plain weighted text ("Clear"), consistent with how every other text action in this app looks (e.g. `category-list`'s "Reset All"/"Save Changes").

### 2 - Balance summary row
- **Option A - Inline byline**: one line, no borders/columns - `Opening ₹50,000.00 · Debit ₹1,24,743.52 · Credit ₹83,652.02 · Closing ₹36,691.18`, middot-separated, wraps naturally on narrow widths. Reads like a caption under the header rather than a boxed stat block.
- **Option B - Accent-edge columns**: kept the 4-column structure but replaced the vertical hairline dividers with a colored left-edge accent per figure (neutral/danger/success/neutral), tying each number to its sign at a glance without a boxed feel.

### 3 - Batch-categorize row buttons
- **Option A - Flat text links**: same treatment as `category-list`'s "Reset All"/"Save Changes" - no button chrome at all, just weighted text, most compact.
- **Option B - Compact chip buttons**: kept real `ion-button`s (clickable affordance preserved) but shrunk to 26px pill height, tighter padding, shorter labels ("Delete"/"Revert" instead of "Delete Category"/"Revert Categorize" - full text moves to `aria-label`/tooltip since the label itself is now abbreviated).

## Selected option
- **Search bar**: the single proposal, confirmed as-is ("search bar ok").
- **Balance row**: **Option A - Inline byline**.
- **Bulk-action buttons**: **Option B - Compact chip buttons**.

All three confirmed by the user in one round - no further design iteration needed before implementation.

## Implementation detail

Grounded against the real `transaction-list.component.{html,ts,scss}`, `category-list.component.{html,scss}`, and `transaction-search.component.{html,scss}` (read before implementing).

1. **Search bar height (all three files)**: override Ionic's default vertical padding via `--padding-top`/`--padding-bottom`/`--min-height` (exact custom-property names to confirm against the installed Ionic version's `ion-searchbar` - fall back to a wrapping-div height constraint plus `--padding-top: 0; --padding-bottom: 0;` if those don't fully collapse the control) so the rendered height is 32px, matching `.batch-categorize-btn`'s existing `height: 32px`. Icon/font-size scale down slightly to stay proportional (matches the mockup's 14px icon / 13px text vs. today's larger icon/14px text).
2. **Cancel/clear button (all three files)**: restyle via `--clear-button-color`/searchbar's own cancel-button part, or (if that proves unreliable across Ionic's shadow DOM the way `ion-toggle`'s track sizing was in `ux/UX_transaction-search.md`'s Implementation notes point 9) fall back to `showCancelButton="never"` plus a hand-built plain-text "Clear" trigger bound to the existing `searchTerm`/`onSearchChange`-equivalent clearing logic on each page - whichever actually renders correctly, verified live, not assumed from the mockup.
3. **Balance row (`transaction-list` only)**: replace `.summary-container`'s 4-column/`.summary-item` markup with a single flex-wrap row of label/value pairs separated by a muted middot span, keeping the existing `danger`/`success` color classes on each figure. No data/binding change - `openingBalance`/`totalDebit`/`totalCredit`/`closingBalance` are already the exact values used, just re-templated.
4. **Bulk-action buttons (`transaction-list` only)**: shrink `.batch-categorize-btn`/`.batch-clear-btn`/`.save-cat-btn` to 26px height with tighter padding/font-size per the mockup; shorten "Delete Category" -> "Delete" and "Revert Categorize" -> "Revert" in the template text, adding `aria-label="Delete Category"`/`aria-label="Revert Categorize"` (or `title="..."`) so the full action name is still discoverable (screen readers, tooltip on hover) even though the visible label is abbreviated. "Categorize" and "Update Categories" stay as-is (already short) unless applying the same tightened sizing makes "Update Categories" visually cramped, in which case shorten it the same way ("Update") with an equivalent `aria-label`.
5. **No logic/behavior change anywhere** - `resetCategoryChanges()`, `saveAllCategoryChanges()`, `categorizeAllSearched()`, `deleteCategoryAllSearched()`, `onSearchChange()`, `hasCategoryChanges` all stay exactly as they are; this is a visual pass only, per `jira/JIRA_16.md`'s scope.

## Implementation notes

Grounded against the real `transaction-list.component.{html,ts,scss}`, `category-list.component.{html,ts,scss}`, and `transaction-search.component.{html,scss}` before touching anything.

1. **Search bar height fix used plain CSS properties with `!important`, not custom properties.** Ionic's `ion-searchbar` sets `padding-top`/`padding-bottom`/`min-height` directly on its own `:host` (up to 60px depending on iOS/MD mode) - there's no `--padding-top`-style custom property exposed for this the way there is for `--border-radius`/`--background`/etc. Since `:host` rules and an external light-DOM class selector targeting the same element have equal specificity, `!important` is the standard, reliable way to win that tie from outside. Applied to every `ion-searchbar` in the app: `transaction-list`'s main search bar (`.cl-searchbar`) and add-category modal (`.modal-searchbar`), `category-list`'s main search bar (`.cl-searchbar`), and `transaction-search`'s category-selector modal (`.modal-searchbar`). All now render at 32px, matching the batch-row buttons.
2. **The cancel button had no CSS hook at all, not even a shrinkable one** - unlike the height fix, `.searchbar-cancel-button` is a true shadow-internal element with no exposed CSS Shadow Part and no sizing custom property (only `--cancel-button-color`, color only). Went straight to the plan's documented fallback: dropped `showCancelButton`/`cancelButtonText` entirely and added a plain-text `Clear` trigger (`*ngIf="searchTerm"`) next to the search bar on both `transaction-list` and `category-list`, wired to a new `clearSearch()` method (`searchTerm = ''; applyFilter();`) on each component. The modal search bars use `showClearButton="always"` (a different, small in-field "×" icon, not the external cancel button) and were left as-is beyond the height fix - that icon wasn't the thing flagged as oversized, and it has no exposed hook either.
3. **Balance row and bulk buttons were template/CSS-only** - no binding changes. The summary row's `openingBalance`/`totalDebit`/`totalCredit`/`closingBalance` bindings and their `danger`/`success` classes moved from `<div>` columns to inline `<span>`s unchanged. The bulk buttons' `(click)` handlers are untouched; only visible text shortened ("Delete Category" → "Delete", "Revert Categorize" → "Revert", "Update Categories" → "Update"), with the full name preserved via `aria-label`/`title` on each button so it's still discoverable (screen readers, hover tooltip) despite the shorter on-screen label. "Categorize" itself was already short enough to leave as-is, per the spec.
4. **Existing test now searches by `aria-label` instead of visible text.** JIRA_15's "both buttons appear together" test (`transaction-list.component.spec.ts`) previously matched `ion-button` text content against the full label ("Revert Categorize"/"Update Categories"); since that text is now abbreviated, updated the test helper to match on `aria-label` instead - more robust anyway, since it now asserts against the thing that's guaranteed to carry the full, stable action name regardless of future visible-label changes.
5. **Real, deliberately-left redundancy**: the in-field "×" clear icon (from `showClearButton`'s default behavior, present whenever the field has a value) and the new plain-text "Clear" link now both appear side by side once there's a search term - two ways to clear the same field. Not addressed here since `showClearButton` and its icon weren't in this ticket's scope (only the cancel button was); noting it in case a future pass wants to reconcile the two into one.
6. **Verification**: `ng build --configuration development` clean. Full suite `ng test --browsers=ChromeHeadless --watch=false` - 131/131 passing (2 new tests: `transaction-list`'s and `category-list`'s `clearSearch()`; 1 existing test updated to match on `aria-label`). Live-verified via `claude-in-chrome` using real in-app tab navigation: confirmed the compact search bar + "Clear" link on `transaction-list` (typed "grocery", clicked "Clear", field emptied correctly), the inline byline balance row, the five compact chip buttons (forced `hasCategoryChanges = true` via Angular's debug API, same technique as JIRA_15's live checks, since this dev account has no in-range transactions to categorize for real), `category-list`'s compact search bar, and `transaction-search`'s category-selector modal search bar.
7. **Follow-up (same day, user feedback): the inline byline wrapped incorrectly on narrow/mobile widths.** Each label and its amount were separate flex items directly in `.summary-container`'s `flex-wrap: wrap` row, so the flex algorithm could wrap them independently of each other - a real screen showed "Credit" alone on one line with its amount pushed to the next. Fixed by wrapping each label+amount pair in one `.summary-stat` (`display: inline-flex`) span, so each pair is a single flex item to the outer row - wrapping now only ever happens *between* stats (at a `·` separator), never inside one. Verified live at a genuine 400px-wide mobile viewport with forced large balance figures (to actually force a wrap): "Credit ₹836,520,250" now wraps as one unit onto its own line. `ng test` for `transaction-list`: 12/12 passing (template/SCSS-only change, no new tests needed).

## Changelog
- 2026-09-12: created, 1 proposal (search bar) + 2 options each for balance row and bulk buttons presented (Draft -> Options Presented)
- 2026-09-12: user confirmed all three in one round - search bar proposal as-is, balance row Option A (inline byline), bulk buttons Option B (compact chips) - filled in Selected option/Implementation detail; marked Ready for Dev (Options Presented -> Ready for Dev)
- 2026-09-12: implemented across `transaction-list`, `category-list`, and `transaction-search` - search bar height fix (all 4 `ion-searchbar` instances), plain-text "Clear" replacing the cancel button (found it had no CSS hook at all, not just an unshrinkable one), inline byline balance row, and compact chip bulk buttons with abbreviated labels + `aria-label`/`title`. Verified build/tests (131/131)/live. Marked Implemented (Ready for Dev -> Implemented)
- 2026-09-12: follow-up - the inline byline balance row wrapped incorrectly on narrow screens (a label could land on its own line, separated from its amount). Fixed by grouping each label+amount into one flex item (`.summary-stat`) so a pair always wraps together. Verified live at a real 400px mobile viewport with forced large figures; tests still 12/12 for `transaction-list` (Implemented)
