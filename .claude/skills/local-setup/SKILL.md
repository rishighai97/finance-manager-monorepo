---
name: local-setup
description: Verify and repair the local prerequisites for running finance-manager on this machine - a JDK for the three Java services (via each service's Gradle toolchain), a Python venv with statement-loader's dependencies, finance-manager-ui's npm dependencies, and a local Postgres with the finance_manager database created. Use before local-run on a fresh checkout or new machine, or whenever a prerequisite (venv, node_modules, Postgres) looks broken or missing. Does not touch application data (see db-setup) or install missing system tools like Java/Node/Docker itself (see local-install) - it only reports which are missing.
---

# local-setup

Idempotent environment check/repair for finance-manager's local dev stack. Safe to re-run any time - it only creates things that are missing, never deletes anything.

## What it checks/fixes

Run the backing script:

```bash
bash .claude/skills/local-setup/check-and-setup.sh
```

It walks through, in order:

1. **Java** - checks `java` is on `PATH`. If not, this is a warning, not a hard failure: `account-service`, `api-gateway`, and `transaction-service` each pin a JDK 21 Gradle toolchain (`java { toolchain { languageVersion = JavaLanguageVersion.of(21) } }` in their `build.gradle`), so `./gradlew bootRun` will attempt to auto-download a matching JDK the first time it runs (needs network access). If that download is blocked in the environment, run `bash .claude/skills/local-install/install.sh java` (or install a JDK 21 manually and put it on `PATH`).
2. **Python venv** - creates `.venv` at the repo root if missing (used by `statement-loader`; `db-setup`/`db-run` use the `psql` CLI directly and need no Python), preferring a 3.11+ interpreter (`statement-loader` needs it for `datetime.UTC`) and `pip install`ing `statement-loader/requirements.txt` into it.
3. **finance-manager-ui npm deps** - requires `npm` on `PATH` (hard failure if missing - run `bash .claude/skills/local-install/install.sh node`, or install Node.js LTS manually). Runs `npm install` if `finance-manager-ui/node_modules` doesn't exist yet. Also checks for the `ionic` CLI (`bash .claude/skills/local-install/install.sh ionic`, or `npm install -g @ionic/cli`) - not required, but without it `local-run` falls back to `npm start` (port 4200) instead of `ionic serve --external` (port 8100, the port documented in the root `README.md`/`CLAUDE.md` module table).
4. **Postgres + `finance_manager` database** - checks whether Postgres is already reachable on `localhost:5432` (native install or an existing container). If not, and `docker` is available, starts (or creates, per `scripts/postgres.sh`'s parameters) a container named `finance-manager-postgres` with its data volume at `<repo-root>/.postgres-data`. Either way, ensures the `finance_manager` database exists (default local creds `postgres`/`admin`, matching every service's `application-local.properties`). It does **not** create tables - an empty `finance_manager` database is the expected state after this skill; table creation + sample data is the `db-setup` skill's job. If `docker` itself is missing, run `bash .claude/skills/local-install/install.sh docker`.

## Interpreting the output

The script prints `[OK]` / `[WARN]` / `[FAIL]` per check and exits non-zero if anything needs attention. `[WARN]`s (missing Java, missing `ionic` CLI) don't block `local-run` - they're documented degraded paths. `[FAIL]`s (missing `npm`, Postgres unreachable with no `docker` available) need a tool actually installed before `local-run` will work - `local-setup` itself doesn't do that (installing a whole language runtime or Docker is a bigger action than what this skill does elsewhere); run the **`local-install`** skill (`.claude/skills/local-install/SKILL.md`) for the specific tool(s) reported, then re-run `local-setup` to confirm.

## Keeping this doc updated

This `SKILL.md` and `check-and-setup.sh` must stay in sync - if a prerequisite check changes (a new module, a different DB, a different venv location), update both here. See `docs/SKILLS.md` for the full skill catalog this belongs to, and the "Skills" section of the root `CLAUDE.md` for the process rule that keeps that catalog current.
