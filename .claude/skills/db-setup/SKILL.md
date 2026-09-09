---
name: db-setup
description: Destructively reset the local finance_manager Postgres schema (drop all tables cascade, recreate them) and reload it with sample data - account types/icons, demo accounts, a demo user, a linked user_account, and starter categories - via scripts/sql/finance_manager_db/database_manager.py and populate_accounts.py. Use when the user asks to reset local data, wants a clean known-good dataset, or as part of local-run's first-time bootstrap against an empty database. Never run this against data you want to keep.
---

# db-setup

**Destructive**: this drops every table in the local `finance_manager` database and reloads a fixed sample dataset. Only run it when the user wants a reset, or when `local-run` detects a first-time empty database and needs to bootstrap one.

## Prerequisite

Requires the `local-setup` skill to have been run at least once (needs the repo-root `.venv` with `psycopg2-binary` installed, and Postgres up with the `finance_manager` database already created - `db-setup` creates *tables*, not the database itself). The backing script checks for the venv and fails fast with a pointer to `local-setup` if it's missing.

## Running it

```bash
bash .claude/skills/db-setup/reset-db.sh
```

This runs, in order, against `localhost:5432` / db `finance_manager` / user `postgres` / password `admin` (the defaults baked into every service's `application-local.properties` and into `populate_accounts.py` itself):

1. `python database_manager.py --drop-all --cascade` - drops every table (in reverse dependency order) if they exist. Safe to run even on a schema that doesn't exist yet.
2. `python database_manager.py --create-all` - recreates every table in dependency order (`account_icon`/`account_type` -> `account` -> `account_statement`/`user_detail` -> `user_account` -> `transaction` -> `user_category` -> `transaction_user_category`, per the root `CLAUDE.md`'s table).
3. `python populate_accounts.py` - inserts sample data.

Both scripts live in `scripts/sql/finance_manager_db/` and are **not** modified or reimplemented by this skill - `reset-db.sh` just wraps the exact same commands documented in that folder's own `README.md`, run with the local defaults, so it stays correct if that tooling changes.

## What gets sample data (and what doesn't)

`populate_accounts.py` inserts rows into: `account_icon`, `account_type`, `account`, `account_statement`, `user_detail`, `user_account`, `user_category`. It deliberately leaves `transaction` and `transaction_user_category` **empty** - those are populated by the real upload flow (`statement-loader` -> `transaction-service`'s `/transaction/v1/save_all`), not by fixture data. After `db-setup` + `local-run`, expect to see sample accounts/categories/a demo user in the UI, but an empty transaction list until you upload a statement (see `scripts/statements/` for sample files, and each account's expected format in `statement-loader`'s README).

## Keeping this doc updated

Keep this file and `reset-db.sh` in sync with each other and with `scripts/sql/finance_manager_db/`'s actual CLI (table list, connection defaults). See `docs/SKILLS.md` for the full skill catalog, and the "Skills" section of root `CLAUDE.md` for the rule that keeps that catalog current whenever a skill changes.
