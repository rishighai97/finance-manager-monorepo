---
name: ux-proof-capture
description: Scoped to jira/JIRA_12.md only - not a general-purpose skill. Ensures a sample statement file exists for every statement-loader reader (via scripts/generate_dummy_statement_fixtures.py --out-dir), then drives finance-manager-ui through a full walkthrough on the HDFC RISHI and AXIS RISHI demo accounts (login, account list, statement upload, transaction list, categorization) using claude-in-chrome, capturing the walkthrough as an animated GIF. Run once before ux-apply changes land (the "before" baseline) and again after (the "after" comparison) to produce matched before/after UX proof pairs for JIRA_12.
---

# ux-proof-capture

Produces a repeatable "before" and "after" UI walkthrough recording so JIRA_12's UX overhaul has visual proof of what changed, not just a diff of Angular templates. This skill exists **only** for JIRA_12 - it is not a general regression-recording tool, and isn't meant to be invoked for unrelated work.

## Prerequisites

1. The local stack must already be running and reachable at `http://localhost:8100` (see `local-run`). This skill does not start it.
2. Demo data must be loaded (`db-setup`'s sample data includes user `Rishi Ghai` / password `admin`, and `user_account` rows `HDFC RISHI` (id 1, account_id 1) and `AXIS RISHI` (id 5, account_id 5) under that user). Verify with `db-run` if unsure rather than assuming.
3. Sample statement files must exist - see Step 1.

## Step 1 - Generate sample statements for every available format

Run, from the repo root:

```bash
.venv/bin/python scripts/generate_dummy_statement_fixtures.py --out-dir scripts/statements/synthetic
```

This reuses the same generator JIRA_8 built for `test-automation`'s BDD fixtures (one synthetic file per working `StatementReader`, each re-verified against the real reader before being written) - don't duplicate its builder logic. It writes 9 files to `scripts/statements/synthetic/`: `hdfc.xls`, `hdfc.pdf`, `hdfc_v2.pdf`, `icici.xls`, `saraswat.xls`, `canara.csv`, `axis.xls`, `axis.csv`, `groww.xlsx`. It's safe to re-run - same fixed seeds, byte-identical output.

Only the files matching an account's **currently active** `account_statement` mapping are actually uploadable right now:
- **HDFC RISHI**: `hdfc.xls` and `hdfc.pdf` (the `pdf` format is version-gated in `dbscripts/table/insert/account_statement.sql` - `hdfc_v2.pdf` only becomes the active version after 2027-01-01, so uploading it today resolves to the v1 reader and will fail to parse; don't use it in the walkthrough).
- **AXIS RISHI**: `axis.xls` and `axis.csv` (no Axis PDF reader exists despite the `account_statement` row for it - don't attempt it).

The other formats (ICICI, Saraswat, Canara, Groww) are generated for completeness but aren't part of the HDFC/AXIS walkthrough below - they exist so the file set is comprehensive if the walkthrough scope ever changes, per JIRA_12's "all available ones" requirement.

## Step 2 - Drive the UI walkthrough and record

Use `claude-in-chrome` (load its tools via `ToolSearch` first if deferred). Start `gif_creator` recording before the first action and stop it after the last, with a couple of extra frames at each end for smooth playback. Name the GIF `ux-proof-<before|after>-<YYYYMMDD>.gif`.

Walkthrough sequence (same steps for both the "before" and "after" run, so the two GIFs are directly comparable):

1. Navigate to `http://localhost:8100`, log in as `Rishi Ghai` / `admin` (`auth.component`).
2. View the account list (accounts tab) - show HDFC RISHI and AXIS RISHI among the accounts.
3. Go to the statement uploader, select **HDFC RISHI**, upload `scripts/statements/synthetic/hdfc.xls`, confirm the success state.
4. View the transaction list for HDFC RISHI - show the newly-uploaded transactions.
5. Categorize at least one of those transactions (category-list / transaction categorization action).
6. Go to the statement uploader again, select **AXIS RISHI**, upload `scripts/statements/synthetic/axis.csv`, confirm the success state.
7. View the transaction list for AXIS RISHI - show its newly-uploaded transactions.
8. Stop the recording.

Don't trigger any JS `alert`/`confirm` dialogs during this (see the claude-in-chrome tool's own guidance) - if a delete/destructive control would pop one, skip it; this is a read/upload walkthrough, not a data-cleanup pass.

## Step 3 - Hand off the result

`gif_creator`'s `export` downloads the GIF to the browser's default download location, not the repo - move it into `ux/proof/ux-proof-<before|after>-<YYYYMMDD>.gif` (create the directory if needed) so it's tracked alongside the ticket it's evidence for. Report the saved path back to the user and note which run it was (before/after). Don't publish it as an Artifact unless asked - these are working proof files for JIRA_12's own review, not a deliverable for a wider audience. Record the before/after pair's location in `jira/JIRA_12.md`'s Implementation notes once both exist.

## Notes

- If HDFC/AXIS demo data or the local stack aren't in the expected state, stop and say so rather than improvising different accounts/data - the before/after comparison only holds if both runs used the same starting state and the same uploaded files.
- This skill does not modify the database beyond what the real statement-upload flow does (uploading a statement through the UI writes transactions via `transaction-service`, same as any real usage) - it never touches Postgres directly.
