# dbscripts

Version-controlled SQL for the shared `finance_manager` Postgres database. Not a runnable service.

## Overview
Every `CREATE`/`DROP`/sample-data `INSERT` statement for the four backend services' shared database lives here as real `.sql` files, organized by object type and operation, instead of being embedded as Python string literals. The `db-run` Claude Code skill (`.claude/skills/db-run/SKILL.md`) executes these files via the `psql` CLI; the `db-setup` skill (`.claude/skills/db-setup/SKILL.md`) uses it to reset local data to a known-good sample state. No service reads from this module directly - `account-service`/`transaction-service`/`api-gateway` each hand-write their own SQL in their DAOs against whatever schema this module has put in place.

## Key modules
- `table/create/<table>.sql` - one file per table: `CREATE SEQUENCE IF NOT EXISTS ...` + `CREATE TABLE ...`.
- `table/drop/<table>.sql` - one file per table: `DROP TABLE ... CASCADE` + `DROP SEQUENCE ...`.
- `table/insert/<table>.sql` - one file per table that has fixture/sample data (7 of 9 - `transaction` and `transaction_user_category` are populated by the real statement-upload flow, not fixtures). Each file that inserts explicit-ID rows also resets that table's sequence afterward (`SELECT setval(...)`) so the running app's own `nextval()` calls don't collide with a sample-data ID.
- `index/`, `function/` - reserved for future index/function definitions, same `create`/`drop` convention as `table/` once something lives here. Empty today; no indexes or functions exist in the current schema.
- `script/setup.list` - ordered list of files (relative to this directory) to run for a full local setup: every `table/create/*.sql` in dependency order, then every `table/insert/*.sql`.
- `script/teardown.list` - ordered list to drop everything: every `table/drop/*.sql` in reverse dependency order.

## Local setup & run
Nothing here runs on its own - see `.claude/skills/db-run/SKILL.md` (the general-purpose runner) and `.claude/skills/db-setup/SKILL.md` (the "reset to sample data" workflow built on top of it). Typical use: `bash .claude/skills/db-setup/reset-db.sh` to drop/recreate/reload everything, or `bash .claude/skills/db-run/run-sql.sh --file table/create/<table>.sql` to run one file directly.

## Testing
No automated tests - this is static SQL, not application code. Correctness is verified by actually running `db-setup` against a live local Postgres (see that skill) and confirming the app works against the result.

## Gotchas
- Table/sequence/insert SQL was migrated verbatim from this repo's earlier `scripts/sql/finance_manager_db/` (Python-embedded SQL strings, driven by `psycopg2`) - see JIRA_5 for the migration. That directory no longer exists; this module is the only source of truth for schema/sample-data SQL now.
- `setup.list`/`teardown.list` are simple ordered manifests for this repo's existing create/drop/insert flow, not a real migration-versioning system (no up/down tracking table) - see JIRA_5's Out of scope.
