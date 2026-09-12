# JIRA_16: Search bar sizing, balance summary row, and compact bulk-action buttons

**Status**: Done <!-- Draft -> In Refinement -> Ready for Dev -> In Progress -> Done -->
**Created**: 2026-09-12
**Last updated**: 2026-09-12 (Done)

## One-liner
Make the search bar in all pages a proper height to be inline with other components (too big currently). Also overhaul the opening/closing balance section to match the existing theme, and make the bulk-update and search buttons look more compact - suggest a new look and feel to match the theme.

## Summary
Three related density/consistency issues in `finance-manager-ui`'s Calm Ledger UI, found after JIRA_15's bulk-actions row work:

1. **`ion-searchbar` renders taller than everything around it.** `transaction-list.component.html`'s `.cl-searchbar` (JIRA_13/`ux/UX_transaction-search.md`'s "flat underline field" restyle) and `category-list.component.html`'s plain `ion-searchbar` both override cosmetic properties (`--border-radius`, `--background`, `--box-shadow`) but never touch Ionic's default internal vertical padding/height, so both search bars sit noticeably taller than the 32px buttons, chips, and text rows around them - Ionic's un-tuned default searchbar height was never actually addressed, just its color/border.
2. **`transaction-list`'s Opening/Debit/Credit/Closing summary row (`.summary-container`) looks dated next to the rest of the page.** It's a bordered four-column strip with vertical hairline dividers between columns - functional, but never revisited since JIRA_12's initial like-for-like recolor pass (see `ux/UX_transaction-list.md`'s Implementation notes, which flagged this row as an untouched carry-over at the time).
3. **The batch-categorize row's buttons (`Categorize`/`Delete Category`/`Revert Categorize`/`Update Categories`) read as heavy/boxy** next to the rest of the page's plain-text, hairline-divided vocabulary - full `ion-button` pills at 32px height with solid/outline fills, rather than the flatter, more compact controls used elsewhere (e.g. `transaction-search`'s filter chips, `category-list`'s plain-text `Reset All`/`Save Changes` links).

This is a look-and-feel decision, not a mechanical fix - it goes through the same `ux-explore` -> `ux-apply` workflow as JIRA_13, grounded in the existing "Calm Ledger" direction (`ux/UX_DIRECTION.md`), not a new direction round.

## Scope

### In scope
- Search bar sizing: reduce `ion-searchbar`'s effective height (via its `--padding-top`/`--padding-bottom`/`--min-height` custom properties, or an equivalent restyle) so it sits inline with surrounding controls, on **every `ion-searchbar` in the app** - both persistent list search bars (`transaction-list`, `category-list`) and modal ones (the category-selector modal's search bar in `transaction-search.component.html`, the add-category modal's search bar in `transaction-list.component.html`).
- The search bar's built-in cancel/clear button (`showCancelButton="focus"`, `cancelButtonText="Clear"`) - restyle to look more compact/flatter, consistent with the height fix above.
- `transaction-list`'s Opening/Debit/Credit/Closing summary row: a visual overhaul within the Calm Ledger direction - exact treatment to be decided via `ux-explore`.
- Batch-categorize row buttons (`Categorize`/`Delete Category`/`Revert Categorize`/`Update Categories`) on `transaction-list`: a more compact visual treatment - exact treatment (still `ion-button`s vs. a flatter custom control) to be decided via `ux-explore`.
- A quick `ux-explore` round proposing 2-3 concrete look-and-feel options for all of the above, grounded in `ux/UX_DIRECTION.md`'s existing tokens (no new app-wide direction).

### Out of scope
- Any change to `hasCategoryChanges`/`checkCategoryChanges()`/search-filtering logic - visual only.
- `ux/UX_DIRECTION.md` itself (already Ready for Dev) - this reuses its tokens, doesn't revise them.
- Any `src/service/*.service.ts` change.
- `transaction-search`'s filter chips (date/account/category/DR-CR) - already redesigned as compact chips in JIRA_14's addendum; not re-litigated here unless this round's exploration finds a real inconsistency against the new search bar/button treatment.

## Affected modules
- [x] finance-manager-ui

## Requirements
1. Run a quick `ux-explore` round (real data, per this repo's established convention) covering: (a) a shorter `ion-searchbar` + cancel-button treatment applied consistently across every `ion-searchbar` in the app (persistent and modal), (b) 2-3 options for the summary/balance row, (c) 2-3 options for the batch-categorize row's buttons.
2. Get explicit user sign-off on the chosen option(s) before `ux-apply` implements.
3. `ux-apply` implements the approved look across all affected pages/modals, reusing existing logic/handlers unchanged (visual-only), flagging any real deviation the same way prior `ux-apply` runs have.

## Open questions
None outstanding - resolved during refinement (see Changelog).

## Acceptance criteria
- [x] `ux/UX_<page>.md` entry (new or appended) covers all three areas, reaches `Ready for Dev` via explicit user confirmation.
- [x] Every `ion-searchbar` in the app (persistent and modal) renders at a height visually consistent with surrounding 32px-class controls, with a matching compact cancel/clear button.
- [x] The summary/balance row and batch-categorize buttons are restyled per the approved option, with no behavior change.
- [x] Existing tests continue to pass; `ux-apply` adds characterization tests for any new logic (2 added: `clearSearch()` on `transaction-list` and `category-list` - this turned out not to be purely visual, since the cancel button had to be replaced with a real custom control).

## Implementation notes

Full write-up lives in `ux/UX_density-pass.md`'s Implementation notes (grounded against the real components, all findings, verification). Summary:
- Every `ion-searchbar` (4 instances across `transaction-list`, `category-list`, `transaction-search`) now renders at 32px via `!important`-forced `padding-top`/`padding-bottom`/`min-height` overrides - Ionic sets these as plain CSS on `:host`, not custom properties, so there's nothing else to hook.
- The cancel button had no CSS access point at all (not even a shrinkable one - no exposed Shadow Part, no sizing custom property), so it was replaced outright with a new `clearSearch()` method + plain-text "Clear" trigger on `transaction-list` and `category-list`, rather than restyled.
- Balance row and bulk buttons were template/CSS-only changes; bulk button labels were shortened with `aria-label`/`title` preserving the full name.
- One pre-existing test (JIRA_15's visibility check) was updated to match buttons by `aria-label` instead of visible text, since the visible labels changed here.
- Verified: `ng build` clean, full suite 131/131 passing, live end-to-end via `claude-in-chrome` across all three components.
- **Follow-up (same day)**: the inline byline balance row wrapped incorrectly on narrow/mobile widths - a label could land alone on one line with its amount pushed to the next, since each was a separate flex item in the wrapping row. Fixed by grouping each label+amount pair into one flex item (`.summary-stat`), so a pair now always wraps as a unit. Verified live at a real 400px mobile viewport with forced large balance figures.

## Changelog
- 2026-09-12: created from one-liner (Draft)
- 2026-09-12: refinement round 1 - resolved both open questions: the height fix covers every `ion-searchbar` in the app, not just the two persistent list ones (also the category-selector and add-category modal search bars), and "search buttons" means the search bar's own built-in cancel/clear button, not `transaction-search`'s already-redesigned filter chips (In Refinement)
- 2026-09-12: `ux-explore` round presented (search bar proposal + 2 options each for balance row and bulk buttons, real data via `db-run`) - user confirmed all three in one round: search bar proposal as-is, balance row Option A (inline byline), bulk buttons Option B (compact chips). See `ux/UX_density-pass.md`. Marked Ready for Dev (In Refinement -> Ready for Dev)
- 2026-09-12: implemented across `transaction-list`, `category-list`, `transaction-search` - found the cancel button had no CSS hook at all (replaced with a custom "Clear" trigger instead of restyled), everything else per plan. Verified build/tests (131/131)/live. Marked Done (Ready for Dev -> Done)
- 2026-09-12: follow-up - fixed the balance row's mobile-width wrapping bug (label/amount could split across lines). Verified live at a real 400px viewport (Done)
