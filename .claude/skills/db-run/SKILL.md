---
name: db-run
description: Run SQL against the local finance_manager Postgres via the psql CLI (native if present, else via docker exec into the finance-manager-postgres container) - a manifest of ordered .sql files, a single .sql file, or an inline SQL string. General-purpose SQL runner for this repo's dbscripts/ module; db-setup delegates to it for the drop/create/insert flow. Use whenever the user wants to run one of dbscripts/'s versioned SQL files, or an ad-hoc query/command against the local database, without writing Python.
---

# db-run

Runs SQL against the local `finance_manager` Postgres via the real `psql` CLI - no Python/psycopg2. Backs `db-setup`'s reset flow, but is also a general-purpose way to run any `.sql` file or ad-hoc statement here.

## Running it

```bash
bash .claude/skills/db-run/run-sql.sh --manifest <path>   # every .sql listed, in order, stop on first error
bash .claude/skills/db-run/run-sql.sh --file <path>       # a single .sql file
bash .claude/skills/db-run/run-sql.sh --sql "<SQL>"       # an inline statement
```

`--manifest`/`--file` paths are relative to `dbscripts/` (e.g. `script/setup.list`, `table/create/account.sql`), not the repo root - an absolute path also works.

Connects to `localhost:5432` / db `finance_manager` / user `postgres` / password `admin` - the same local defaults as every service's `application-local.properties` and every other skill in this repo. Uses native `psql` if it's on `PATH`, otherwise falls back to `docker exec -i finance-manager-postgres psql ...` (same fallback pattern as `local-setup`/`local-run`) - so it works whether or not the host machine has a `psql` client installed.

Every statement runs with `-v ON_ERROR_STOP=1`: a manifest run stops at the first failing file rather than plowing through the rest with a half-applied schema.

## The `dbscripts/` module this reads from

See `dbscripts/README.md` for the full layout. In short:
- `dbscripts/table/{create,drop,insert}/<table>.sql` - one file per table per operation.
- `dbscripts/index/`, `dbscripts/function/` - reserved for future index/function definitions (empty today - no indexes or functions exist in the current schema).
- `dbscripts/script/setup.list` - the create-everything-then-load-sample-data order.
- `dbscripts/script/teardown.list` - the drop-everything order (reverse of setup's creates).

Both manifests are plain text: one relative path per line, blank lines and `#`-comments ignored.

## Relationship to `db-setup`

`db-setup` (`.claude/skills/db-setup/SKILL.md`) is the "reset local data" workflow - it calls this skill's script with `script/teardown.list` then `script/setup.list`. `db-run` itself doesn't know or care about that sequencing; it just executes whatever manifest/file/SQL it's given. Use `db-run` directly for anything narrower than a full reset - running one new table's create script, an ad-hoc `SELECT`, etc.

## Keeping this doc updated

Keep this file and `run-sql.sh` in sync with `dbscripts/`'s actual layout. See `docs/SKILLS.md` for the full skill catalog, and the "Skills" section of root `CLAUDE.md` for the rule that keeps that catalog current.
