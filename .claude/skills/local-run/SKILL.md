---
name: local-run
description: Bring up the entire finance-manager local stack - Postgres, account-service, api-gateway, transaction-service, statement-loader, finance-manager-ui - in one go, auto-running local-setup for missing prerequisites, so the app is reachable on localhost. On a schema-less database it stops and asks for explicit confirmation before bootstrapping sample data via db-setup - it never resets data unconfirmed. Use whenever the user asks to run/start/spin up finance-manager locally, "start everything", or view the app on localhost. Root-level orchestrator skill - see also local-setup (prerequisites only) and db-setup (data reset only) for their standalone uses.
---

# local-run

Root-level orchestrator: gets a fresh checkout of this monorepo to a working app at `http://localhost:8100` (or `:4200` if the `ionic` CLI isn't installed - see `local-setup`) with as few manual steps as possible.

## Procedure

1. **Ensure prerequisites.** Run local-setup's backing script:
   ```bash
   bash .claude/skills/local-setup/check-and-setup.sh
   ```
   If it exits non-zero, read its `[FAIL]` lines and resolve them (these are things it can't safely auto-fix, like installing Node.js or Docker) before continuing. `[WARN]`s are fine to proceed past.

2. **Check whether a schema exists - never bootstrap unconfirmed.** `start-all.sh` (next step) checks for a schema itself and fails fast if the `finance_manager` database has no tables yet. Before that, check the same thing yourself (e.g. `psql ... -tAc "SELECT 1 FROM information_schema.tables WHERE table_name='account'"`, or via `docker exec` if `psql` isn't on PATH - same fallback `start-all.sh` uses).
   - If tables already exist: do nothing here - existing data (including anything beyond the original sample data) is left untouched. **Never** run `db-setup`'s reset script in this case.
   - If there is genuinely no schema yet (fresh Postgres): **stop and ask the user for explicit confirmation** before running `db-setup`'s backing script - do not run it automatically, even though the DB currently looks empty. A schema-less reading can be wrong (a transient connection hiccup, a check that ran against the wrong database) and `db-setup` is destructive, so a human must confirm before it runs. Only after the user confirms, run:
     ```bash
     bash .claude/skills/db-setup/reset-db.sh
     ```
     (this now takes its own automatic pre-reset backup - see `db-setup`'s `SKILL.md` - so even a confirmed reset is recoverable.)

3. **Start everything.**
   ```bash
   bash .claude/skills/local-run/start-all.sh
   ```
   This starts, in dependency order, backgrounding each with its own log file and polling its healthcheck before moving to the next:
   - `account-service` (`./gradlew bootRun --args='--spring.profiles.active=local'`, port 5003, log `account-service/server.log`)
   - `api-gateway` (same pattern, port 5001, log `api-gateway/server.log`)
   - `transaction-service` (same pattern, port 5004, log `transaction-service/server.log`)
   - `statement-loader` (`python statement-loader/run.py --app-profile local`, run from the **repo root** per its README's gotcha, port 5002, log `statement-loader/server.log`)
   - `finance-manager-ui` (`ionic serve --external --no-open` if the `ionic` CLI is present -> port 8100; otherwise falls back to `npm start` -> port 4200; log `finance-manager-ui/server.log`)

   It prints a table of service/PID/log at the end, plus the URL to open.

4. **Report the result to the user**: the URL to open, and that logs live at `<module>/server.log` if something looks wrong (e.g. `tail -f account-service/server.log`).

## Stopping the stack

```bash
bash .claude/skills/local-run/stop-all.sh
```

Kills whatever is listening on ports 5001/5002/5003/5004/8100/4200 (port-based, not PID-based - Gradle's `bootRun` wrapper isn't reliably the same OS process as the JVM it launches, so tracked PIDs aren't a reliable kill target on their own). Leaves the Postgres container running, since that's shared/persistent state, not something `local-run` "owns" the lifecycle of the same way; stop it explicitly with `docker stop finance-manager-postgres` if wanted.

## Design notes / constraints

- Never touches data in an already-populated database, and never runs `db-setup` without explicit user confirmation, even against a schema-less DB (step 2) - see JIRA_22. `db-setup` itself also takes an automatic pre-reset backup, so a confirmed reset is still recoverable.
- Does not run `./gradlew clean build` before `bootRun` - faster iteration, matches each Java module's own README's documented local-run command. If a service is misbehaving after a dependency bump, a manual `./gradlew clean build` in that module is a reasonable troubleshooting step outside this skill.
- Must not depend on any hardcoded path from the pre-monorepo layout (unlike `scripts/local_startup/*.sh`, which still hardcode `/Users/rishighai/Desktop/finance-manager-application`) - `start-all.sh` derives `REPO_ROOT` from its own location.

## Keeping this doc updated

Keep this file, `start-all.sh`, and `stop-all.sh` in sync with the actual per-module run commands (ports, healthcheck paths, profile flags) documented in each module's own README and the root `CLAUDE.md`'s module table. See `docs/SKILLS.md` for the full skill catalog, and the "Skills" section of root `CLAUDE.md` for the rule that keeps that catalog current whenever a skill changes.
