# JIRA_20: Fix missing debit/credit color distinction on transaction rows

**Status**: Done <!-- Draft -> In Refinement -> Ready for Dev -> In Progress -> Done -->
**Created**: 2026-09-12
**Last updated**: 2026-09-12 (Done)

## One-liner
ux have color distinction for debit and credit amounts

## Summary
`transaction-list.component.html` already toggled `danger`/`success` classes on each transaction row's amount span via `[ngClass]="{ danger: isDebit(transaction), success: !isDebit(transaction) }"`, but `transaction-list.component.scss` only defined the `.danger`/`.success` color rules nested under `.summary-amount` (the top summary strip), not under `.transaction-amount` (each row's own amount) - so the classes were being applied correctly but had no visual effect. Fixed by adding the same `--ion-color-danger`/`--ion-color-success` token rules nested under `.transaction-amount`.

## Scope

### In scope
- `finance-manager-ui/src/app/transaction-list/transaction-list.component.scss` only - a missing CSS rule for markup/logic that already existed.

### Out of scope
- Any change to `isDebit()` or the template's `[ngClass]` binding - both were already correct.
- Any other page.

## Affected modules
- [x] finance-manager-ui

## Requirements
1. A transaction row's amount renders in the danger color for a debit and the success color for a credit, matching the same tokens already used by the summary row.

## Open questions
None - a one-line CSS fix, confirmed working via a live `claude-in-chrome` check against real uploaded data before/after.

## Acceptance criteria
- [x] `ng build --configuration development` succeeds.
- [x] Verified live: a real debit row's amount computed color differs from a real credit row's amount computed color (checked via `getComputedStyle` against real uploaded Amex transaction data, not just eyeballing a screenshot - the Calm Ledger palette's muted tones look similar under JPEG compression despite being genuinely different RGB values).

## Implementation notes
- Root cause was a missing nested rule, not a logic bug - `isDebit(transaction)` and the `ngClass` binding were already correct; `.summary-amount`'s existing `&.danger`/`&.success` rules never applied to `.transaction-amount` since SCSS nesting scopes selectors, and the two aren't related in the selector tree.
- Fix mirrors the exact same `var(--ion-color-danger)`/`var(--ion-color-success)` tokens `.summary-amount` already uses, so the summary row and each transaction row now agree visually.
- Verified via `getComputedStyle` on the live page (not just a screenshot) after uploading real Amex fixture data: debit rows computed to `rgb(161, 92, 70)`, the one credit row to `rgb(92, 122, 94)` - genuinely different colors, just visually subtle by design (Calm Ledger's muted palette).

## Changelog
- 2026-09-12: created and implemented directly - single-line CSS bug fix with no real ambiguity, verified live (Draft -> Done)
