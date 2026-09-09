---
name: db-setup
description: Destructively reset the local finance_manager Postgres schema (drop all tables cascade, recreate them) and reload it with sample data - account types/icons, demo accounts, a demo user, a linked user_account, and starter categories - by running dbscripts/'s versioned SQL files via the db-run skill (psql CLI, no Python). Use when the user asks to reset local data, wants a clean known-good dataset, or as part of local-run's first-time bootstrap against an empty database. Never run this against data you want to keep.
---

# db-setup

**Destructive**: this drops every table in the local `finance_manager` database and reloads a fixed sample dataset. Only run it when the user wants a reset, or when `local-run` detects a first-time empty database and needs to bootstrap one.

## Prerequisite

Postgres up with the `finance_manager` database already created (`db-setup` creates *tables*, not the database itself) - run the `local-setup` skill first if that's not the case yet. No Python/venv needed here - see below.

## Running it

```bash
bash .claude/skills/db-setup/reset-db.sh
```

This delegates entirely to the **`db-run`** skill (`.claude/skills/db-run/SKILL.md`), which runs SQL via the real `psql` CLI:

1. `db-run --manifest script/teardown.list` - drops every table (reverse dependency order, all `CASCADE`). Safe to run even on a schema that doesn't exist yet.
2. `db-run --manifest script/setup.list` - recreates every table in dependency order (`account_icon`/`account_type` -> `account` -> `account_statement`/`user_detail` -> `user_account` -> `transaction` -> `user_category` -> `transaction_user_category`, per the root `CLAUDE.md`'s table), then loads sample data.

Both manifests, and every `.sql` file they list, live in the **`dbscripts/`** module (see its own `README.md`) - that's the single, version-controlled source of truth for this repo's schema and sample data (see JIRA_5). `reset-db.sh` doesn't hardcode any SQL itself; it just tells `db-run` which manifests to run, in which order.

## What gets sample data (and what doesn't)

`dbscripts/script/setup.list` loads sample data into: `account_icon`, `account_type`, `account`, `account_statement`, `user_detail`, `user_account`, `user_category`. It deliberately leaves `transaction` and `transaction_user_category` **empty** - those are populated by the real upload flow (`statement-loader` -> `transaction-service`'s `/transaction/v1/save_all`), not by fixture data. After `db-setup` + `local-run`, expect to see sample accounts/categories/a demo user in the UI, but an empty transaction list until you upload a statement (see `scripts/statements/` for sample files, and each account's expected format in `statement-loader`'s README).

## Keeping this doc updated

Keep this file and `reset-db.sh` in sync with `dbscripts/script/{setup,teardown}.list`'s actual contents. See `docs/SKILLS.md` for the full skill catalog, and the "Skills" section of root `CLAUDE.md` for the rule that keeps that catalog current whenever a skill changes.
