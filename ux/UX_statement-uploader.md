<!--
Template for ux/UX_<page>.md. Maintained by the `ux-explore` skill
(.claude/skills/ux-explore/SKILL.md) - don't hand-edit this structure
without updating both this template and that skill. Mirrors
jira/TEMPLATE.md's status-lifecycle pattern, adapted for UX decisions
instead of engineering requirements - see jira/JIRA_12.md for why this
exists as a parallel spec-driven flow rather than folding into jira/.
-->

# UX_statement-uploader: Statement uploader

**Status**: Ready for Dev <!-- Draft -> Options Presented -> Selected -> Ready for Dev -->
**Created**: 2026-09-11
**Last updated**: 2026-09-11 (round 2)
**Direction**: [ux/UX_DIRECTION.md](UX_DIRECTION.md) - "Calm Ledger", Ready for Dev

## Page
`statement-uploader` (`finance-manager-ui/src/app/statement-uploader/`) - the Upload statements tab.

## Options presented

This screen's real flow is genuinely two-phase and batch-oriented, not a simple fetched list - grounded against the real component before presenting options:
1. Tap the FAB -> a modal to pick an account (radio-group, grouped by type, each showing its supported file extensions) and a file, queued into `statementsToBeUploaded` (edit/delete each before submitting).
2. Tap "Upload Statements" -> all queued statements submit together; the queue is replaced by a separate "Statement Upload Summary" results list (per-item success with transaction count, or per-item failure message) plus a "Clear All & Start Over" button.

This ticket's `ux-proof-capture` skill actually exercised this exact real flow earlier in this session - the happy-path data below (`hdfc.xls` -> HDFC RISHI, `axis.csv` -> AXIS RISHI, both succeeding with real transaction counts) is that real run, not fabricated. `icici_statement.pdf` -> ICICI RISHI is added as a plausible failure example (not a real run) to demonstrate the error/mixed-result treatment.

Given the flow itself is fixed by real functionality, the real design question is **whether the "queue" and "results" stay two separate phases/sections (today's behavior) or become one continuous list whose rows update their own status in place** - not the queue-vs-results content itself.

Artifact: [Statement Uploader Layout Options](https://claude.ai/code/artifact/b121a291-75e6-4882-867c-7c5f2f5cea63)

### Option A - Two-phase (current behavior, restyled)
- **Layout**: queue list (filename + account, edit/delete text links) while unsubmitted; tapping "Upload Statements" replaces that list with a separate results section (filename + transaction count or failure message, status mark) and a "Clear All & Start Over" action - same phase structure as today.
- **States covered**: happy (3 queued, unsubmitted), empty (real "No Statements Uploaded" state, unchanged), loading (a separate uploading indicator block appears below the disabled queue), error (the results section, showing 2 successes + 1 real-shaped failure together - this screen's real error handling is already per-item, not full-screen, so this is the honest mapping of "error" here rather than inventing a full-screen error banner that doesn't match real behavior).

### Option B - Unified list (single continuous list)
- **Layout**: one list from the moment a statement is queued through its final result - each row's own status mark updates in place (queued -> uploading -> uploaded/failed) instead of the whole list being replaced by a separate results section. Same underlying actions (edit/delete before submit, "Upload Statements", "Clear All & Start Over" after), just no visual phase-jump.
- **States covered**: same four states as A, with loading/error rendered as in-place row status changes rather than a separate block/section.

## Selected option
**Option B - Unified list**, confirmed by the user. This is a bigger change than a template restyle - it changes how upload state is tracked, not just how it's rendered (still in-scope for `ux-apply`: it's component-internal state/template logic, not a `src/service/*.service.ts` change - the actual HTTP call to `transaction-service` via `TransactionApiDao` on the backend is untouched).

## Implementation detail

Grounded against the real `finance-manager-ui/src/app/statement-uploader/statement-uploader.component.{html,ts,scss}`:

1. **Unify the two arrays into one, tracked by status**: today, `statementsToBeUploaded` (pre-submit) and `uploadResults` (post-submit) are separate arrays, and the template swaps between rendering one or the other. For Option B, add a `status: 'queued' | 'uploading' | 'success' | 'failed'` field to each queued item (default `'queued'`) and **stop moving items into a separate `uploadResults` array** - `uploadAllStatements()` should update each item's own `status` (and `transactionCount`/`errorMessage`) in place as its upload resolves, and the template renders one `ion-list` over the single array throughout. `editStatement`/`deleteStatement` still only apply to `status === 'queued'` items.
2. **Row content switches on `status`**, not on which array/section it's in:
   - `queued`: name + account, trailing "Edit" / "Delete" text links (same handlers as today).
   - `uploading`: name + account, trailing muted `IBM Plex Mono` "Uploading&hellip;" text, no actions.
   - `success`: name + account, trailing `IBM Plex Mono` sage-colored "&#10003; N transactions" (from `result.response.transaction_count`).
   - `failed`: name + account (subtitle switches to muted-clay "Failed to upload statement"), trailing muted-clay underlined "Retry" text link - **new affordance**: today a failure only shows a static error message with no retry action; add one that re-submits just that item (re-runs the same upload call `uploadAllStatements()` already makes per-item, scoped to this one).
3. **Bottom actions**: keep both real actions, but they're no longer phase-gated by which array is non-empty - "Upload Statements" is enabled whenever at least one item has `status === 'queued'`; "Clear All & Start Over" (one label, used in both the pre- and post-submit cases - drop the separate "Clear All Statements" pre-submit wording, it's the same action) is always available whenever the list is non-empty and clears/resets everything.
4. **Loading state or per-row, not both**: with the unified model there's no separate "Uploading statements&hellip;" block below the list (Option A's approach) - the in-progress row(s) showing `uploading` status *is* the loading indicator. Since `uploadAllStatements()` likely submits items sequentially (matching the real per-item result structure), only one row should show `uploading` at a time, with the rest still `queued` until their turn - matches the mockup's Loading state (`hdfc.xls` uploading, `axis.csv`/`icici_statement.pdf` still queued).
5. **Upload modal, account-selector modal, FAB, and both empty-state copies are unaffected** by the A/B choice - restyle per `UX_DIRECTION.md`'s tokens only (flat backgrounds, hairline dividers, `Source Serif 4` titles, accent FAB) without structural change. The account-selector modal inside this screen's Upload modal (radio-group grouped by `level_1_title`) should get the same treatment as `account-list`'s rows (outlined-initial circle instead of the icon image) for visual consistency across the app, though it doesn't need `account-list`'s collapsible-section mechanism - this list is a one-time picker during upload, not a browsing surface, and isn't the scaling problem that decision was about.
6. **No new full-screen error state**: unlike every other page, this screen's real error handling is already per-item (point 2's `failed` status), which is the right level of granularity for a batch upload - don't add a separate full-screen "couldn't load" error state, there's nothing being fetched on page load that could fail that way.

## Changelog
- 2026-09-11: created, 2 options presented (Draft -> Options Presented)
- 2026-09-11: user confirmed Option B; filled in Selected option and Implementation detail (grounded against the real `statement-uploader.component.*` - the main change is unifying `statementsToBeUploaded`/`uploadResults` into one status-tracked array/list, plus a new per-item Retry action on failure); marked Ready for Dev (Options Presented -> Ready for Dev)
