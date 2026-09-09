<!--
Template for jira/JIRA_<ID>.md. Maintained by the `jira-create` skill
(.claude/skills/jira-create/SKILL.md) - don't hand-edit ticket structure
without updating both this template and that skill.
-->

# JIRA_5: dbscripts module + db-run skill (version-controlled SQL, psql-driven db-setup)

**Status**: Done <!-- Draft -> In Refinement -> Ready for Dev -> In Progress -> Done -->
**Created**: 2026-09-09
**Last updated**: 2026-09-09

## One-liner
Update db skill. Create a new skill to run db commands using postgres cli. For db, we maintain all create table and all scripts in separate dbscripts module which will have folders for table, index, function, etc. within each folder it will have folder for create, insert, etc. Move all sqls into this and also have a folder called script in the dbscripts module where we have setup file having order of commands to be run. Db setup skill should refer to this file. This way we version control all sql's.

## Summary
Today, all of this project's SQL is embedded as Python string literals inside `scripts/sql/finance_manager_db/finance_manager_db_config.py` (create/drop SQL, one dict per table) and `populate_accounts.py` (sample-data INSERT SQL, one function per table) - not real `.sql` files, so it can't be diffed/reviewed/version-controlled as SQL, and `db-setup` (JIRA_2) drives it all through psycopg2/Python. This ticket moves every piece of that SQL into a new top-level `dbscripts/` module as real `.sql` files organized by object type (`table/`, with `index/`/`function/` reserved for future use) and operation (`create/`, `drop/`, `insert/`), adds a `dbscripts/script/` folder with ordered manifests (`setup.list`, `teardown.list`) listing which files to run and in what order, and adds a new `db-run` skill that executes those manifests (or an arbitrary `.sql` file) directly via the `psql` CLI - no Python/psycopg2 involved. `db-setup` is rewritten to delegate to `db-run` + these manifests instead of the old `database_manager.py`/`populate_accounts.py`.

User explicitly asked for this to be spec'd and implemented without a refinement round - the design decisions below were made directly rather than asked back.

## Scope

### In scope
- New `dbscripts/` module at the repo root:
  - `dbscripts/table/create/<table>.sql` - one file per table, `CREATE SEQUENCE IF NOT EXISTS ...` + `CREATE TABLE ...`, extracted verbatim from `finance_manager_db_config.py`'s `createSeqSql`/`createTableSql`.
  - `dbscripts/table/drop/<table>.sql` - one file per table, `DROP TABLE ... CASCADE` + `DROP SEQUENCE ...`, extracted from `dropTableSql`/`dropSeqSql` (CASCADE always applied - matches `db-setup`'s existing behavior, so the separate `--cascade` flag concept goes away).
  - `dbscripts/table/insert/<table>.sql` - one file per table that has sample data (7 of 9: everything except `transaction`/`transaction_user_category`, which stay populated only by the real upload flow), extracted from `populate_accounts.py`'s `setup_<table>()` functions, **including** each function's `SELECT setval(...)` sequence-reset call after its INSERT (this was almost missed - without it, the sequence stays at its default start value after explicit-ID inserts, and the next `nextval()` call from the running app would collide with an existing sample-data row's ID).
  - `dbscripts/index/`, `dbscripts/function/` - empty (with a placeholder `README.md` so git tracks the directory) for future index/function definitions; no indexes or functions exist in the current schema.
  - `dbscripts/script/setup.list` - ordered list of relative paths to run for a full setup: all 9 `table/create/*.sql` in dependency order, then the 7 `table/insert/*.sql` in the same order.
  - `dbscripts/script/teardown.list` - ordered list to drop everything: all 9 `table/drop/*.sql` in reverse dependency order.
  - `dbscripts/README.md` following this repo's module README template.
- New `.claude/skills/db-run/SKILL.md` + backing script (`run-sql.sh`) that executes SQL against the local `finance_manager` Postgres via the `psql` CLI (native if on `PATH`, else via `docker exec` into the `finance-manager-postgres` container - same fallback pattern already used by `local-setup`/`local-run`), in one of three modes: a manifest file (runs every listed script in order, stopping on first error), a single arbitrary `.sql` file, or an inline SQL string.
- Rewrite `db-setup`'s `reset-db.sh` to call `db-run`'s script with `dbscripts/script/teardown.list` then `dbscripts/script/setup.list`, replacing every call to `database_manager.py`/`populate_accounts.py`.
- Remove `scripts/sql/finance_manager_db/` entirely (`database_manager.py`, `populate_accounts.py`, `finance_manager_db_config.py`, `requirements.txt`, `README.md`) now that its content and function are fully superseded - keeping both would create two sources of truth for the same schema, which is exactly what this ticket exists to avoid.
- Update `local-setup` (`check-and-setup.sh` + `SKILL.md`) to stop installing `scripts/sql/finance_manager_db/requirements.txt` (psycopg2-binary) into the venv - `db-setup` no longer needs Python/psycopg2 at all, so the venv is only for `statement-loader` now.
- Update docs to reflect the new module: `docs/SKILLS.md` (add `db-run`, update `db-setup`'s description), root `CLAUDE.md` (module table + "Running the whole stack locally" section), root `README.md` (module table), `docs/README_TEMPLATE.md` (module list), `scripts/README.md` (remove the now-gone `sql/finance_manager_db` bullet).
- Verify end-to-end against the live local stack: `db-setup` (new implementation) resets and reloads sample data correctly, and the app (signup, categories, accounts) still works afterward.

### Out of scope
- Actually defining any indexes or functions - `dbscripts/index/`/`dbscripts/function/` are structure only, for future tickets.
- Changing the sample data itself (accounts, categories, demo user) - this is a mechanical migration of existing SQL, not a data change.
- `account-service`/`api-gateway`/`transaction-service`'s own JPA-less DAOs or any application-level schema access - those already hand-write their own SQL independently and aren't touched.
- A generic "run arbitrary migrations" system (up/down migrations, version tracking table, etc.) - `dbscripts/script/*.list` are simple ordered manifests for this repo's existing create/drop/insert flow, not a migration framework.

## Affected modules
- [x] root / docs (new `dbscripts/` module, `.claude/skills/db-run/`, updates to `db-setup`/`local-setup`, doc updates)
- [x] scripts (removal of `scripts/sql/finance_manager_db/`)

No application service code changes.

## Requirements
1. Every table's create/drop/insert SQL exists as a real, byte-for-byte-equivalent `.sql` file under `dbscripts/table/{create,drop,insert}/`, extracted from the current Python sources (including the `setval()` sequence resets after sample-data inserts).
2. `dbscripts/script/setup.list` and `teardown.list` define the run order; `db-run` reads and executes them via `psql`, stopping on first error.
3. `db-run` also supports running a single `.sql` file or an inline SQL string directly, not just a manifest - it's a general-purpose "run db commands via psql" skill, not solely `db-setup`'s implementation detail.
4. `db-setup` no longer uses Python/psycopg2 (`database_manager.py`/`populate_accounts.py`) - it delegates entirely to `db-run` + the two manifests.
5. `local-setup`'s venv step no longer references the now-deleted `scripts/sql/finance_manager_db/requirements.txt`.
6. `scripts/sql/finance_manager_db/` is removed; nothing else in the repo references it afterward.
7. All cross-referencing docs (`docs/SKILLS.md`, root `CLAUDE.md`, root `README.md`, `docs/README_TEMPLATE.md`, `scripts/README.md`) are updated to describe the new module/skill instead of the old one.
8. Verified end-to-end: running the new `db-setup` against the live local Postgres drops/recreates/reloads correctly, and the running app's signup/category/account endpoints still work afterward with the reloaded sample data.

## Acceptance criteria
- [x] `dbscripts/table/{create,drop,insert}/*.sql` exist for the right tables, content matches the old Python sources exactly (spot-checked), and sample-data inserts include their `setval()` reset.
- [x] `dbscripts/script/setup.list` and `teardown.list` exist with the correct dependency order.
- [x] `.claude/skills/db-run/SKILL.md` + `run-sql.sh` exist, work against the live local Postgres (native `psql` or `docker exec` fallback), and support manifest / single-file / inline-SQL modes. Verified live via `docker exec` fallback (no native `psql` on this machine).
- [x] `db-setup`'s `reset-db.sh` no longer imports/calls anything from `scripts/sql/finance_manager_db/` and instead calls `db-run`.
- [x] Running `db-setup` end-to-end against the live stack succeeds and the app's sample data (accounts, categories, demo user) is present and usable afterward (verified via the running services, not just the DB) - full teardown/setup run, then all 5 services + UI restarted and re-verified live: accounts list returns all 7 sample accounts, signup succeeds, categories endpoint returns all 5 sample categories.
- [x] `scripts/sql/finance_manager_db/` no longer exists, and nothing else in the repo (skills, scripts, docs) references it (only historical `jira/JIRA_2.md` and the intentional "this moved" pointers in `scripts/README.md`/`dbscripts/README.md` mention the old path).
- [x] `local-setup` no longer installs psycopg2/db-tooling requirements into the venv.
- [x] `docs/SKILLS.md`, root `CLAUDE.md`, root `README.md`, `docs/README_TEMPLATE.md`, and `scripts/README.md` all reflect the new module/skill.

## Implementation notes
- **Extraction method**: rather than hand-transcribing SQL out of `finance_manager_db_config.py`/`populate_accounts.py` (which contain multi-KB base64 icon blobs - transcribing by hand risks corruption and would blow up context), wrote a one-off Python script that imported both modules directly and wrote each table's `createSeqSql`/`createTableSql`/`dropTableSql`/`dropSeqSql` (from the config module) and each `setup_<table>()` function's `insert_<table>` string (from `populate_accounts.py`, via `inspect.getsource()` + regex, since those are function-local variables not importable directly) straight to `.sql` files. Never read the giant blob into the conversation.
- **Two source files disagreed for sample data** - `finance_manager_db_config.py`'s own `insertSql` field only had real data for 4/9 tables (`account_icon`/`account_type`/`account`/`account_statement`); `populate_accounts.py` had real data for 7/9 (also `user_detail`/`user_account`/`user_category`). Used `populate_accounts.py` as the sole canonical INSERT source (more complete) and `finance_manager_db_config.py` as the sole canonical CREATE/DROP source, rather than mixing both and risking drift.
- **Almost missed the `setval()` resets**: `populate_accounts.py` calls `SELECT setval('<table>_sequence', (SELECT MAX(id) FROM <table>))` after every insert that uses explicit IDs (all except `account_icon`, which has no such call in the original either - preserved that as-is, not "fixed", since it's out of scope and no evidence it's ever hit in practice). My first extraction pass only grabbed the `insert_*` string via regex and missed these `cursor.execute("SELECT setval(...)")` lines entirely - caught this before wiring anything up, by rereading `populate_accounts.py`'s structure, and appended the matching `setval` statement to each of the 6 affected `table/insert/*.sql` files. Without this, the app's own `nextval()` calls (e.g. on next signup) would collide with a sample-data row's ID.
- Drop scripts always apply `CASCADE` (the old `--cascade` CLI flag concept goes away - `db-setup` was the only caller and always passed it anyway).
- `db-run`'s `--manifest`/`--file` paths are relative to `dbscripts/`, not the repo root (e.g. `script/setup.list`, not `dbscripts/script/setup.list`) - tripped over this once myself during testing (double-prefixed path), fixed by testing the correct convention before wiring `reset-db.sh` up to it.
- `local-setup`'s venv is now `statement-loader`-only; `db-setup`/`db-run` need no Python at all.
- **Verified end-to-end for real**, twice: once directly via `db-run` (`--manifest script/teardown.list` then `script/setup.list`, checking row counts/`setval` output and querying `account`/`user_category` afterward), then again via the actual `db-setup reset-db.sh` end state, then a full `local-run` restart of all 5 services + UI, confirming signup, the account list, and the categories endpoint all work against the migrated data.

## Changelog
- 2026-09-09: created from one-liner and immediately marked Ready for Dev - user explicitly asked for this ticket to be spec'd and implemented without a refinement round.
- 2026-09-09: implemented in full - dbscripts/ module (table create/drop/insert SQL + script manifests + placeholders for index/function), db-run skill, db-setup rewritten to use it, local-setup simplified (no more psycopg2), scripts/sql/finance_manager_db/ removed, all cross-referencing docs updated. Verified end-to-end against the live local stack (db reset + full app restart + signup/accounts/categories all working). Marking **Done**.
