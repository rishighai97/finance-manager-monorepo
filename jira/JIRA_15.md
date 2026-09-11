# JIRA_15: Gate "Revert Categorize" on pending changes, label the bulk-actions row

**Status**: Done <!-- Draft -> In Refinement -> Ready for Dev -> In Progress -> Done -->
**Created**: 2026-09-11
**Last updated**: 2026-09-12 (Done)

## One-liner
Make Revert Categorize appear along with the Update Categories button when any update or delete happen. Also add a label to indicate the row is responsible for bulk updates.

## Summary
`finance-manager-ui/src/app/transaction-list/transaction-list.component.html`'s `.batch-categorize-row` (the category-to-apply select plus Categorize/Delete Category/Revert Categorize/Update Categories buttons, which act on every currently-visible/filtered transaction at once - see JIRA_14's Implementation notes for why this stayed on `transaction-list` rather than moving to `transaction-search`) currently shows "Revert Categorize" unconditionally, while "Update Categories" only appears via `*ngIf="hasCategoryChanges"` (`hasCategoryChanges` is already a real, existing flag: `catInsertMap.size > 0 || catDeleteMap.size > 0`, set by `checkCategoryChanges()` after any categorize/delete-category action). Showing "Revert Categorize" all the time, even when there's nothing pending to revert, is confusing clutter. Separately, the row's bulk-acting nature (these buttons apply to *all* visible transactions, not one) isn't labeled anywhere today, which is easy to miss.

## Scope

### In scope
- Gate the existing "Revert Categorize" button on the same `hasCategoryChanges` condition already used for "Update Categories", so the two appear/disappear together. This part is mechanical (no design decision needed) and doesn't need `ux-explore`.
- A quick, narrowly-scoped `ux-explore` -> `ux-apply` round for the bulk-actions label - **placement is already decided (an inline prefix directly before the category-to-apply select, on the same line as the buttons)**; the round is just to pick the exact wording/typography within that placement (e.g. "Bulk:" vs "Apply to all:" vs something else), not to re-litigate where it goes.

### Out of scope
- Any change to `hasCategoryChanges`'s own computation, or to `checkCategoryChanges()`/`resetCategoryChanges()`/`saveAllCategoryChanges()`'s logic.
- The "Categorize"/"Delete Category" buttons' own visibility (they stay always-visible primary actions, independent of pending-changes state) unless refinement finds otherwise.
- Any `src/service/*.service.ts` change.
- The broader search/filter section redesign already tracked in `ux/UX_transaction-search.md` (JIRA_13/JIRA_14) - this ticket is scoped narrowly to the batch-categorize row only.
- Re-exploring label placement (inline prefix vs. above-row line vs. icon+tooltip) - already decided, see above.

## Affected modules
- [x] finance-manager-ui

## Requirements
1. `transaction-list.component.html`'s "Revert Categorize" button gets `*ngIf="hasCategoryChanges"` (or equivalent), matching "Update Categories" - both appear together once a categorize/delete-category action is pending, and both disappear once changes are reverted or saved. Implemented directly (no `ux-explore` needed).
2. A short inline prefix label sits directly before the category-to-apply select on `.batch-categorize-row`, indicating these controls act in bulk on all currently visible/filtered transactions, not a single row. Run a quick `ux-explore` -> `ux-apply` round scoped to just this label (placement is fixed - inline prefix before the select - the round picks the exact wording/typography), rather than landing wording directly.

## Open questions
None outstanding - resolved during refinement (see Changelog).

## Acceptance criteria
- [x] "Revert Categorize" is hidden when `hasCategoryChanges` is `false` and visible when it's `true`, exactly matching "Update Categories"'s current visibility.
- [x] A `ux/UX_<page>.md` entry (new or appended) covers the bulk-actions label, reaches `Ready for Dev` via explicit user confirmation, and `ux-apply` implements the inline-prefix label accordingly.
- [x] Existing `transaction-list.component.spec.ts` tests continue to pass; no test currently asserts "Revert Categorize" is always rendered (verify during implementation).

## Implementation notes

Both requirements grounded against the real `finance-manager-ui/src/app/transaction-list/transaction-list.component.{html,ts,scss}` before touching anything.

1. **Requirement 1 (visibility gate)**: added `*ngIf="hasCategoryChanges"` to the "Revert Categorize" `ion-button`, identical to the existing condition already on "Update Categories" - no logic change, template-only. Added two characterization tests (`transaction-list.component.spec.ts`) since this spec file hadn't done DOM-level queries before but the acceptance criterion is specifically about rendered visibility, not just a field value: querying for the `ion-button` by its text content, confirming both buttons are absent when `hasCategoryChanges` is `false` and both present when `true`.
2. **Requirement 2 (bulk-actions label)**: ran a quick, wording-only `ux-explore` round (`ux/UX_transaction-list.md`'s new Addendum section) - placement was pre-decided by this ticket's refinement, so the mockup only compared 4 wording candidates ("Bulk:", "Apply to all:", "Batch:", "All visible:") shown in the real row context, including the row's pending-changes state so the label reads correctly against the full button set. User picked **"Bulk:"**. Implemented as `<span class="bulk-label">Bulk:</span>` immediately before `.batch-category-input`, styled at the same muted micro-label weight as the existing `.regex-label` (12px, `var(--app-color-muted)`) rather than the heavier uppercase/letter-spaced summary-row treatment, since space is tight next to four buttons.
3. **Follow-up (same day, user feedback)**: "Revert Categorize" got an `arrow-undo-outline` icon (matching the icon+text pattern "Update Categories" already uses with `save-outline`) and switched from `color="medium"` (muted gray, inconsistent with the rest of the row) to `color="primary"` - the same accent color as "Categorize"/"Update Categories". Removed the `.batch-clear-btn` SCSS rule's `--border-color`/`--color` overrides, since they existed only to force the old gray and would otherwise fight the new `color="primary"`. Verified live by forcing `hasCategoryChanges = true` via Angular's debug API (`ng.getComponent`) against the running app, since this dev account currently has no transactions in range to trigger a real categorize action - confirmed the icon and primary-color outline render correctly. `ng test` full suite: 129/129 passing (no test changes needed - this is a template/SCSS-only visual change).
4. **Follow-up 2 (same day)**: "Update Categories" switched from `fill="solid"` to `fill="outline"`, so it now matches "Revert Categorize"'s border-only treatment instead of standing out as the row's one filled button. No SCSS change needed - `.save-cat-btn` never overrode fill-related properties. Verified the same way as follow-up 1 (forced `hasCategoryChanges = true` live); `ng test` for `transaction-list`: 11/11 passing.
3. **Verification**: `ng build --configuration development` clean. `ng test --browsers=ChromeHeadless --watch=false` for `transaction-list` - 11/11 passing (2 new tests from point 1 above; no test changes needed for point 2, a template/SCSS-only addition). Live-verified via `claude-in-chrome` using real in-app tab navigation (not a direct URL reload - see `ux/UX_transaction-search.md`'s Implementation notes for why that distinction matters on this app): the "Bulk:" label renders correctly before the select, and "Revert Categorize"/"Update Categories" both stay hidden in the default (no pending changes) state.

## Changelog
- 2026-09-11: created from one-liner (Draft)
- 2026-09-11: refinement round 1 - resolved both open questions: the bulk-actions label is an inline prefix directly before the category-to-apply select (not an above-row line or icon+tooltip), and it goes through a quick, narrowly-scoped `ux-explore`/`ux-apply` round (just to pick exact wording within that fixed placement) rather than landing as a direct text add. The "Revert Categorize" visibility gate stays a direct, no-`ux-explore` implementation since it's mechanical (In Refinement)
- 2026-09-11: user confirmed the spec - marked Ready for Dev (Ready for Dev)
- 2026-09-12: implemented both requirements - "Revert Categorize" now shares "Update Categories"' `hasCategoryChanges` visibility condition, and the bulk-actions label ("Bulk:", picked from 4 wording options via a quick `ux-explore` round) sits before the category select. Verified build/tests (11/11)/live app. Marked Done (Ready for Dev -> Done)
- 2026-09-12: follow-up polish - "Revert Categorize" gained an undo icon and switched to the app's primary accent color (was muted gray, inconsistent with the row's other buttons). Verified build/full test suite (129/129)/live (Done)
- 2026-09-12: follow-up polish 2 - "Update Categories" switched from solid to outline fill to match "Revert Categorize"'s border-only look. Verified tests (11/11)/live (Done)
