# Finance Manager

Multi-module workspace for the Finance Manager application. Each module below keeps its own README with module-specific setup/usage details; this file just gives the map.

| Module | Stack | Port (local) | Description |
|---|---|---|---|
| [`account-service`](account-service/README.md) | Java 21, Spring Boot (Gradle) | 5003 | APIs to read and write user accounts |
| [`api-gateway`](api-gateway/README.md) | Java 21, Spring Boot (Gradle) | 5001 | Handles signup/login/logout only - not a proxy for the other services |
| [`transaction-service`](transaction-service/README.md) | Java 21, Spring Boot (Gradle) | 5004 | APIs to read and write user transactions and categories |
| [`statement-loader`](statement-loader/README.md) | Python, Flask | 5002 | Loads transactions from uploaded bank/broker account statements |
| [`finance-manager-ui`](finance-manager-ui/README.md) | Angular 19 + Ionic 8 (Capacitor) | 8100 | Mobile/web client |
| [`dbscripts`](dbscripts/README.md) | SQL | — | Version-controlled schema/sample-data SQL, run via the `db-run`/`db-setup` skills |
| [`test-automation`](test-automation/README.md) | Java 21, Spring Boot + Cucumber | — | Black-box backend BDD test suite against a running stack |
| [`scripts`](scripts/README.md) | Bash / Python | — | Local environment setup and deployment helper scripts |

All four backend services (`account-service`, `api-gateway`, `transaction-service`, `statement-loader`) share a single Postgres database (`finance_manager`, default `localhost:5432` locally).

## Running locally

The `local-run` Claude Code skill (`.claude/skills/local-run/SKILL.md`) brings up the whole stack - Postgres, all three Java services, `statement-loader`, and the UI - and auto-bootstraps prerequisites/sample data on a fresh checkout, so the app ends up reachable at `http://localhost:8100`. See `docs/SKILLS.md` for that skill and its `local-setup`/`local-install`/`db-run`/`db-setup` counterparts.

## Testing

Automated end-to-end/API test coverage lives in [`test-automation`](test-automation/README.md) - a black-box BDD (Cucumber) suite that runs against an already-running stack (see `local-run` above) and documents its full scenario catalog and how to view the HTML report.

## CI/CD

Each module has its own GitHub Actions deploy workflow (`.github/workflows/<module>-deploy.yml`), scoped to only run when that module's files change. Pull requests run `.github/workflows/pr-checks.yml`, which detects which modules changed and only builds/tests those (see that module's job for exact commands), aggregated into a single `pr-gate` check. That check is not yet required to merge (this repo is private on a free GitHub plan, which doesn't support required status checks on private repos) - it still reports pass/fail on every PR.

## Spec-driven development

Requirements are tracked as `jira/JIRA_<ID>.md` spec files (see `jira/README.md`), maintained via the `jira-create` skill - a one-line requirement gets captured and iteratively refined until explicitly marked "Ready for Dev" before any implementation starts. See root `CLAUDE.md` for details.
