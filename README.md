# Finance Manager

Finance Manager is a personal finance tracker. Users can:

- **Link accounts** - connect bank/broker accounts they hold.
- **Upload statements** - import a bank/broker statement file to automatically load its transactions.
- **Categorize transactions** - tag imported transactions with user-defined categories.
- **Filter transactions** - slice transactions by category or debit/credit to understand spending and holdings.

It's a multi-module workspace - four backend services plus an Angular/Ionic client, all backed by a shared Postgres database. Each module below keeps its own README with module-specific setup/usage details; this file just gives the map. See [`architecture-docs`](architecture-docs/README.md) for diagrams of how the pieces fit together (high-level design, key user-flow sequence diagrams, and the database schema).

| Module | Stack | Port (local) | Description |
|---|---|---|---|
| [`account-service`](account-service/README.md) | Java 21, Spring Boot (Gradle) | 5003 | APIs to read and write user accounts |
| [`api-gateway`](api-gateway/README.md) | Java 21, Spring Boot (Gradle) | 5001 | Handles signup/login/logout only - not a proxy for the other services |
| [`transaction-service`](transaction-service/README.md) | Java 21, Spring Boot (Gradle) | 5004 | APIs to read and write user transactions and categories |
| [`statement-loader`](statement-loader/README.md) | Python, Flask | 5002 | Loads transactions from uploaded bank/broker account statements |
| [`finance-manager-ui`](finance-manager-ui/README.md) | Angular 19 + Ionic 8 (Capacitor) | 8100 | Mobile/web client |
| [`dbscripts`](dbscripts/README.md) | SQL | — | Version-controlled schema/sample-data SQL, run via the `db-run`/`db-setup` skills |
| [`test-automation`](test-automation/README.md) | Java 21, Spring Boot + Cucumber | — | Black-box backend BDD test suite against a running stack |
| [`architecture-docs`](architecture-docs/README.md) | Markdown + Mermaid | — | Architecture diagrams (HLD, sequence, ER), kept in sync by the `diagram-maintain` skill |
| [`observability`](observability/README.md) | HTML/JS/CSS (Bootstrap) | — | Live healthcheck dashboard, kept in sync by the `healthcheck-maintain` skill |
| [`scripts`](scripts/README.md) | Bash / Python | — | Local environment setup and deployment helper scripts |

All four backend services (`account-service`, `api-gateway`, `transaction-service`, `statement-loader`) share a single Postgres database (`finance_manager`, default `localhost:5432` locally).

## Architecture

[`architecture-docs`](architecture-docs/README.md) has the full picture: a high-level design diagram of every service and how it talks to the shared database, sequence diagrams for key user flows (statement upload, categorizing/filtering transactions, signup/login), and an entity-relationship diagram of the schema. All diagrams are Mermaid source kept up to date by the `diagram-maintain` skill (`docs/SKILLS.md`).

## Observability

[`observability`](observability/README.md) has `healthcheck.html` - a single-page live dashboard that polls every backend service's healthcheck endpoint plus the UI, per environment (`local` is fully configured; `dev`/`qa`/`uat`/`prod` are placeholders). Open it directly in a browser against a running local stack to see pass/fail status and an IST timestamp for each check, with a manual refresh and a 60-second auto-refresh. Kept up to date by the `healthcheck-maintain` skill (`docs/SKILLS.md`), which is triggered automatically by a hook whenever an API-affecting file changes.

## Running locally

The `local-run` Claude Code skill (`.claude/skills/local-run/SKILL.md`) brings up the whole stack - Postgres, all three Java services, `statement-loader`, and the UI - and auto-bootstraps prerequisites/sample data on a fresh checkout, so the app ends up reachable at `http://localhost:8100`. See `docs/SKILLS.md` for that skill and its `local-setup`/`local-install`/`db-run`/`db-setup` counterparts.

## Testing

Automated end-to-end/API test coverage lives in [`test-automation`](test-automation/README.md) - a black-box BDD (Cucumber) suite that runs against an already-running stack (see `local-run` above) and documents its full scenario catalog and how to view the HTML report.

Each of `account-service`, `api-gateway`, `transaction-service`, `statement-loader`, and `finance-manager-ui` also has its own unit test suite (JUnit 5 + Mockito, pytest, and Jasmine/Karma respectively), each enforcing a 60% minimum line-coverage floor as part of its normal test command - see that module's own README `Testing` section for the exact command and where to view its coverage report. The `unit-test-generate` skill (`docs/SKILLS.md`) maintains these: existing-feature mode backfills tests without changing behavior, new-feature mode writes tests first (TDD) for a ticket's acceptance criteria before implementing it. See `jira/JIRA_7.md` for the ticket this baseline was established under, including real bugs found along the way.

## CI/CD

Each module has its own GitHub Actions deploy workflow (`.github/workflows/<module>-deploy.yml`), scoped to only run when that module's files change. Pull requests run `.github/workflows/pr-checks.yml`, which detects which modules changed and only builds/tests those (see that module's job for exact commands), aggregated into a single `pr-gate` check. That check is not yet required to merge (this repo is private on a free GitHub plan, which doesn't support required status checks on private repos) - it still reports pass/fail on every PR.

## Spec-driven development

Requirements are tracked as `jira/JIRA_<ID>.md` spec files (see `jira/README.md`), maintained via the `jira-create` skill - a one-line requirement gets captured and iteratively refined until explicitly marked "Ready for Dev" before any implementation starts. See root `CLAUDE.md` for details.
