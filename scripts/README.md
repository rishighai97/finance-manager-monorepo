# scripts

Local environment setup, database schema management, and deployment helper scripts/docs. Not a runnable service.

## Overview
A grab-bag of operational tooling for running the app locally and (previously) deploying it: starting Postgres, per-service local-run scripts, and some auth/SMTP infrastructure notes that aren't currently wired into the running app. DB schema/sample-data management used to live here (`sql/finance_manager_db/`) but has moved to the top-level `dbscripts/` module (versioned `.sql` files) plus the `db-run`/`db-setup` Claude Code skills - see `dbscripts/README.md` and `docs/SKILLS.md`.

## Key modules
- `postgres.sh` - `docker run` command that starts the local Postgres container (`finance_manager` DB, port 5432).
- `local_startup/*.sh` - one script per module showing the exact local `bootRun`/`run.py`/`ionic serve` command for that module (see repo root README for the full startup sequence).
- `app_startup` - the same local-run sequence as `local_startup/`, but as one end-to-end reference doc (Postgres container, then each Java service via `nohup`, then statement-loader, then the UI).
- `auth/keycloack_setup.md`, `keycloack/` - notes/Dockerfile for a Keycloak instance; **not currently used** by any service (auth is handled directly in `api-gateway`, see its README's Gotchas).
- `mailhog/mailhog_local.sh` - local SMTP testing container; not currently called by any service.
- `server_setup.md`, `smtp.md` - prod server setup notes.
- `python_setup` - Ubuntu/Debian steps for installing Python 3.13 and creating a venv (used for `statement-loader`).

## Local setup & run
Nothing here runs on its own - see the repo root README for the overall local-stack sequence, which is what `local_startup/*.sh` / `app_startup` document.

## Gotchas
- `claude/claude_get_context.py` and `claude/claude_patch.py` are custom pre-Claude-Code tooling (manual context-gathering + patch-application scripts, hardcoded to an old `/Users/rishighai/Desktop/finance-manager-application` path that no longer matches this repo's layout) from before this project used Claude Code's own skills/agents. They're superseded by the `.claude/skills/` in this repo and are candidates for removal in a future cleanup ticket - not touched here since this ticket is docs-only.
- The old README's `docker-compose up --build` instruction has been removed: there is no `docker-compose.yml` anywhere in this repo. Use `local_startup/*.sh` / `app_startup` instead.
