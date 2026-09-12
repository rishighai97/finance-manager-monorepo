---
name: feature-gif-capture
description: Records a short animated GIF walkthrough of one finance-manager-ui feature (login, account list, statement upload, transaction list, transaction search/filter, categories) via claude-in-chrome, saves it under docs/gifs/, and adds/updates its entry in docs/FEATURE_GIFS.md and the features table in the root README.md. General-purpose and incremental - re-run for a single new or changed feature without touching the others.
---

# feature-gif-capture

Keeps the root `README.md` (the project's landing page) visually up to date by recording a short GIF of each app feature and cataloging it in `docs/FEATURE_GIFS.md`. Unlike `ux-proof-capture` (scoped to `jira/JIRA_12.md`'s one-off before/after comparison), this skill is meant to be invoked again and again, once per feature, whenever a feature is added or changed - see `jira/JIRA_21.md` for the ticket this was built under.

## Prerequisites

1. The local stack must already be running and reachable at `http://localhost:8100` (see the `local-run` skill). This skill does not start it.
2. Demo data must be loaded (`db-setup`'s sample data includes user `Rishi Ghai` / password `admin`).
3. `claude-in-chrome`'s tools loaded (`ToolSearch` for `tabs_context_mcp`, `navigate`, `computer`, `gif_creator`, `tabs_create_mcp`, `tabs_close_mcp` if deferred).

## Step 1 - Pick which feature(s) to (re)capture

This skill is **incremental** - pass the specific feature name(s) to capture (e.g. "just the statement-uploader one" or "all of them" for a first run). Never regenerate every GIF just because one feature changed. The feature catalog (slug, caption, page, demo steps):

| Slug | Feature | Page(s) | What the GIF shows |
|---|---|---|---|
| `login` | Login | `auth` | Entering the demo credentials and landing on the account list. |
| `accounts` | Accounts | `tabs/accounts` (account-list) | The linked-accounts list, grouped by type, with net worth. |
| `upload-statement` | Upload a statement | `statement-uploader` | Selecting an account, uploading a **synthetic** sample statement file, and the success state. |
| `transactions` | Transactions | `tabs/transactions` (transaction-list) | The transaction list for an account, including categorizing one transaction. |
| `transaction-search` | Search & filter transactions | `tabs/transactions/search` (transaction-search) | Opening the filter modal, applying a filter (e.g. an account or category), seeing the list narrow. |
| `categories` | Categories | `category-list` | The category list/management screen. |

## Step 2 - Ensure a synthetic sample statement exists (only needed for `upload-statement`)

```bash
statement-loader/.venv/bin/python scripts/generate_dummy_statement_fixtures.py --out-dir scripts/statements/synthetic
```

This is the same generator `ux-proof-capture`/`test-automation` (JIRA_8) already use - one synthetic file per working `StatementReader`, each re-verified against the real reader before being written, gitignored under `scripts/statements/`. **Never use a real personal statement file for this GIF** - only a generated synthetic one (e.g. `scripts/statements/synthetic/hdfc.xls` on the HDFC RISHI demo account). It's safe to re-run - same fixed seeds, byte-identical output.

## Step 3 - Drive the UI walkthrough and record

For each feature being captured:

1. Navigate to `http://localhost:8100`, and if not already logged in, log in as `Rishi Ghai` / `admin`.
2. Start `gif_creator` recording, with a couple of extra frames before the first action and after the last for smooth playback.
3. Perform that feature's demo steps from the table above (a handful of real clicks/navigations against the real running app - not a mockup).
4. Stop the recording and export it.
5. Move the exported GIF from the browser's download location to `docs/gifs/<slug>.gif` (create the directory on first use), overwriting any existing GIF for that slug.

Don't trigger any JS `alert`/`confirm` dialogs during this (see the `claude-in-chrome` tool's own guidance) - skip any destructive control that would pop one; this is a demo walkthrough, not a data-cleanup pass.

## Step 4 - Update the catalog and the root README

1. In `docs/FEATURE_GIFS.md`, add (or replace) that feature's entry: its caption, an embedded `![caption](gifs/<slug>.gif)`, and one sentence describing what it shows. Keep entries in the same order as the feature table above.
2. In the root `README.md`'s features table (add the table on first use, right after the intro paragraphs - see that file for the exact spot), add (or update) a row for this feature: its name and a link to its entry in `docs/FEATURE_GIFS.md` (e.g. `[Upload a statement](docs/FEATURE_GIFS.md#upload-a-statement)`).
3. Don't touch rows for features that weren't just (re)captured.

## Step 5 - Hand off

Report which feature(s) were captured, the saved GIF path(s), and confirm both docs were updated. Leave everything staged for the user to review - this skill never commits/pushes itself, same as every other skill in this repo.

## Notes

- If the local stack or demo data aren't in the expected state, stop and say so rather than improvising different accounts/data.
- GIFs are committed to the repo under `docs/gifs/` (not published as Artifacts) - per `jira/JIRA_21.md`'s decision, simplicity and always-available-on-checkout won out over keeping the repo smaller.
- This skill does not modify the database beyond what the real UI flow does (e.g. uploading a statement through the UI writes real transactions via `transaction-service`, same as any real usage) - it never touches Postgres directly.
- Keep this file in sync with `docs/FEATURE_GIFS.md`'s feature list if a page is added, renamed, or removed in `finance-manager-ui/src/app/`.
