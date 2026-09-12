# JIRA_21: `feature-gif-capture` skill + a GIFs README linked from the root README

**Status**: Done <!-- Draft -> In Refinement -> Ready for Dev -> In Progress -> Done -->
**Created**: 2026-09-12
**Last updated**: 2026-09-12 (Done)

## One-liner
create jira to capture gifs of each feature anbd attach them on homepage. There should be skill that does this so that in future if new features come up, they can be shown, Also show the statements (sample one) being uploaded in example. Separate readme should have these gifs. Main readme should have link to this readme

## Summary
The root `README.md` (the project's "homepage") currently only describes the app in text - no visual demonstration of what it actually looks like or does. This adds a new, reusable Claude Code skill that records a short animated GIF walkthrough of each app feature (account list, statement upload, transaction list/search, categorization, etc.) via `claude-in-chrome`, including one GIF specifically showing a sample statement file being uploaded end-to-end. The GIFs live in a new, separate README (not the root README itself), and the root README links to it. Unlike `ux-proof-capture` (which is scoped to a single ticket's before/after comparison), this skill is meant to be re-invoked whenever a new feature ships, so the gallery stays current over time.

## Scope

### In scope
- A new skill (working name `feature-gif-capture`) that drives `finance-manager-ui` through each feature via `claude-in-chrome`, records one GIF per feature, and saves each to a tracked location.
- First-run feature list (the full app tour): auth/login, account list, statement upload (including the sample-file demo), transaction list, transaction search/filter, category list.
- The statement-upload GIF uses a **synthetic** sample file only, generated the same way `ux-proof-capture`/`test-automation` already do via `scripts/generate_dummy_statement_fixtures.py` - never a real personal statement.
- GIF files are committed to the repo under a new `docs/gifs/` directory (not published externally) - simplest, always available on any checkout.
- A new, separate README (`docs/FEATURE_GIFS.md`) cataloging every feature GIF with a short caption per feature.
- The root `README.md` gets a **table of features**, one row per feature, each linking to that feature's GIF entry in `docs/FEATURE_GIFS.md` - not just a single generic link.
- Reuses `ux-proof-capture`'s established conventions where they fit (same demo accounts/local-stack assumptions, same fixture-generation call) - `ux-proof-capture` itself stays untouched and scoped to JIRA_12.
- Manual invocation only: re-run by explicit request when a feature ships (same model as `ux-proof-capture`/`statement-onboard`), not hook-triggered.

### Out of scope
- Re-recording `ux-proof-capture`'s existing before/after GIFs for JIRA_12 - that skill and its GIFs are untouched.
- Any change to the app itself - this is documentation/tooling only.
- Automatic/hook-triggered invocation - explicitly rejected in favor of manual re-invocation.
- Publishing GIFs as Artifacts/external links - explicitly rejected in favor of committing them to the repo.

## Affected modules
- [ ] account-service
- [ ] api-gateway
- [ ] transaction-service
- [ ] statement-loader
- [ ] finance-manager-ui
- [ ] scripts
- [x] root / docs / CI

## Requirements
1. A new skill exists under `.claude/skills/feature-gif-capture/SKILL.md`, documented in `docs/SKILLS.md` per the root `CLAUDE.md`'s rule that every skill change keeps that catalog in sync.
2. Running the skill produces one GIF per in-scope feature (auth, account list, statement upload, transaction list, transaction search/filter, category list), including a statement-upload walkthrough using a synthetic sample file, saved under `docs/gifs/`.
3. `docs/FEATURE_GIFS.md` catalogs each GIF with a caption naming the feature it demonstrates.
4. The root `README.md` has a table of features, each row linking to its GIF's entry in `docs/FEATURE_GIFS.md`.
5. The skill is written so it can be re-run for a single newly added/changed feature without redoing the others (incremental/composable, not all-or-nothing).
6. Invocation is manual only, by explicit request - no hook wiring.

## Open questions
None - all four rounds of questions (feature scope, GIF storage location, relation to `ux-proof-capture`, trigger model) were answered by the user; the exact README path/filename (`docs/FEATURE_GIFS.md`, GIFs under `docs/gifs/`) was picked as a reasonable default rather than a separate question, and can be corrected if the user prefers different naming.

## Acceptance criteria
- [x] `.claude/skills/feature-gif-capture/SKILL.md` exists and is cataloged in `docs/SKILLS.md`.
- [x] A GIF exists under `docs/gifs/` for each in-scope feature, including one showing a synthetic sample statement upload.
- [x] `docs/FEATURE_GIFS.md` exists, one entry per GIF with a caption.
- [x] Root `README.md` has a features table, each row linking to the matching entry in `docs/FEATURE_GIFS.md`.
- [x] Re-running the skill for a single new/changed feature doesn't require regenerating every other GIF.

## Implementation notes
- **Skill**: `.claude/skills/feature-gif-capture/SKILL.md` created and cataloged in `docs/SKILLS.md`, right after `ux-proof-capture`'s entry. Its feature table (slug/caption/page/demo-steps) is the single source of truth for what gets captured - keep it in sync with `finance-manager-ui/src/app/` if a page is added/renamed/removed.
- **First run captured all 6 features** via `claude-in-chrome`, logged in as the real demo user (`Rishi Ghai`/`admin`): `login.gif`, `accounts.gif`, `upload-statement.gif` (HDFC RISHI + `scripts/statements/synthetic/hdfc.xls`, generated via `scripts/generate_dummy_statement_fixtures.py --out-dir scripts/statements/synthetic` - never a real personal file), `transactions.gif` (includes categorizing a transaction), `transaction-search.gif` (opens the filter modal, applies an account + debit filter), `categories.gif` (adds a new category, finds it via search). All saved under `docs/gifs/` (~5.5 MB total).
- **Direct route navigation doesn't always work for this app** - `http://localhost:8100/tabs/transactions/search` loaded blank and redirected to `/`; had to reach the filter modal by navigating to `/tabs/transactions` and clicking the actual filter icon in the UI instead, consistent with this session's standing rule to verify via real in-app navigation rather than a direct URL reload.
- **The local DB's demo data is visually noisy** (heavy accumulated test churn from repeated BDD/e2e suite runs over this session - many `TJSB ...`/`E2E_STATEMENT_CAT_...`/`Test debit transaction` rows mixed in with the real seeded accounts). The GIFs are still functionally accurate demonstrations of each feature, just not as visually clean as a freshly-seeded database would look; a `db-setup` reset before a future re-capture would produce tidier GIFs, at the cost of losing the current test churn (not done here - out of scope, and destructive).
- **Docs**: `docs/FEATURE_GIFS.md` created with one section per feature (H2 heading = caption, so GitHub's anchor slugs match what the root README links to), each embedding its GIF. Root `README.md` got a features table right after the intro bullet list, one row per feature linking to its `docs/FEATURE_GIFS.md#<anchor>` entry - not just a single link to the file, per the user's explicit ask.
- **Not done**: no change to `finance-manager-ui`, `ux-proof-capture`, or any hook/CI wiring - purely additive documentation/tooling, as scoped.

## Changelog
- 2026-09-12: created from one-liner (Draft)
- 2026-09-12: refined via AskUserQuestion - confirmed full app tour (all main pages) for the first run, GIFs committed to the repo under docs/gifs/ (not published externally), synthetic-only sample statements, manual-only invocation, and a per-feature table in the root README (not a bare link) linking into docs/FEATURE_GIFS.md (Draft -> In Refinement)
- 2026-09-12: user confirmed "implement" - marked Ready for Dev and started implementation in the same turn (In Refinement -> Ready for Dev -> In Progress)
- 2026-09-12: skill written, first run captured all 6 feature GIFs, docs/FEATURE_GIFS.md and the root README's features table created (In Progress -> Done)
