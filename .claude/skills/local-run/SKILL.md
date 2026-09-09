---
name: local-run
description: Bring up the entire finance-manager local stack - Postgres, account-service, api-gateway, transaction-service, statement-loader, finance-manager-ui - in one go, auto-running local-setup for missing prerequisites and db-setup on a first-time empty database, so the app is reachable on localhost. Use whenever the user asks to run/start/spin up finance-manager locally, "start everything", or view the app on localhost. Root-level orchestrator skill - see also local-setup (prerequisites only) and db-setup (data reset only) for their standalone uses.
---

# local-run

Root-level orchestrator: gets a fresh checkout of this monorepo to a working app at `http://localhost:8100` (or `:4200` if the `ionic` CLI isn't installed - see `local-setup`) with as few manual steps as possible.

## Procedure

1. **Ensure prerequisites.** Run local-setup's backing script:
   ```bash
   bash .claude/skills/local-setup/check-and-setup.sh
   ```
   If it exits non-zero, read its `[FAIL]` lines and resolve them (these are things it can't safely auto-fix, like installing Node.js or Docker) before continuing. `[WARN]`s are fine to proceed past.

2. **Ensure sample data exists.** `start-all.sh` (next step) checks for a schema itself and fails fast if the `finance_manager` database has no tables yet - but the intent of this skill is to auto-bootstrap that case rather than stop and ask. So: if this is a first-time run (fresh Postgres, no tables), run db-setup's backing script now:
   ```bash
   bash .claude/skills/db-setup/reset-db.sh
   ```
   **Never** run this if tables already exist and the user has real data - it's destructive. Check first (e.g. `psql ... -tAc "SELECT 1 FROM information_schema.tables WHERE table_name='account'"`, which `start-all.sh` also does) rather than running it unconditionally.

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

- Never touches data in an already-populated database - `db-setup` only runs automatically against a schema-less DB (step 2), and standalone `db-setup` runs are always explicit user requests.
- Does not run `./gradlew clean build` before `bootRun` - faster iteration, matches each Java module's own README's documented local-run command. If a service is misbehaving after a dependency bump, a manual `./gradlew clean build` in that module is a reasonable troubleshooting step outside this skill.
- Must not depend on any hardcoded path from the pre-monorepo layout (unlike `scripts/local_startup/*.sh`, which still hardcode `/Users/rishighai/Desktop/finance-manager-application`) - `start-all.sh` derives `REPO_ROOT` from its own location.

## Keeping this doc updated

Keep this file, `start-all.sh`, and `stop-all.sh` in sync with the actual per-module run commands (ports, healthcheck paths, profile flags) documented in each module's own README and the root `CLAUDE.md`'s module table. See `docs/SKILLS.md` for the full skill catalog, and the "Skills" section of root `CLAUDE.md` for the rule that keeps that catalog current whenever a skill changes.
