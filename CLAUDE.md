# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository structure

This is a **single monorepo** consolidated (with full per-module git history preserved) from six previously-separate repos, each of which still exists standalone on GitHub but is no longer the canonical source:

| Module | Stack | Port (local) | Purpose |
|---|---|---|---|
| [`account-service`](account-service/README.md) | Java 21, Spring Boot (Gradle) | 5003 | Read/write user accounts |
| [`api-gateway`](api-gateway/README.md) | Java 21, Spring Boot (Gradle) | 5001 | Signup/login/logout only - not a reverse proxy for the other services |
| [`transaction-service`](transaction-service/README.md) | Java 21, Spring Boot (Gradle) | 5004 | Read/write user transactions and categories |
| [`statement-loader`](statement-loader/README.md) | Python 3, Flask | 5002 (via `STATEMENT_LOADER_SERVER_PORT`) | Parses bank/broker statements, calls `transaction-service` to load them |
| [`finance-manager-ui`](finance-manager-ui/README.md) | Angular 19 + Ionic 8 (Capacitor for iOS) | 8100 (ionic serve) | Mobile/web client |
| [`scripts`](scripts/README.md) | Bash/Python | — | Local environment setup, DB schema management, deployment helpers |

Each module's README is the source of truth for that module's endpoints, gotchas, and exact local-run command - **this file only covers cross-module/whole-repo concerns.** They all follow a shared structure defined in `docs/README_TEMPLATE.md`.

All four backend services share Postgres database `finance_manager` on `localhost:5432` (default local creds `postgres`/`admin`, see each service's `application-local.properties`).

## Spec-driven development (jira/)

Requirements are tracked as `jira/JIRA_<ID>.md` files (not the Jira tool) following `jira/TEMPLATE.md`, maintained via the `jira-create` skill (`.claude/skills/jira-create/SKILL.md`). A ticket goes `Draft -> In Refinement -> Ready for Dev -> In Progress -> Done`; implementation should not start before a ticket is explicitly confirmed **Ready for Dev** by the user. `jira/README.md` is the ticket index. See `jira/JIRA_1.md` for the ticket this documentation pass was implemented under.

## Common commands

### Java services (account-service, api-gateway, transaction-service)
Each is a standalone Gradle/Spring Boot project with the same layout (`build.gradle`, `gradlew`, `src/main/java/com/finance/manager/<service_name>`).

```bash
cd <service>
./gradlew clean build          # compile + run tests
./gradlew test                 # run tests only
./gradlew bootRun --args='--spring.profiles.active=local'   # run locally against local Postgres
```

Run a single test class with `./gradlew test --tests "com.finance.manager.<pkg>.SomeClassTest"`.

Note: `transaction-service` and `api-gateway` have `useJUnitPlatform()` enabled in `build.gradle`; `account-service`'s is currently commented out.

To build a Docker image and run it, each service has a `run.sh`:
```bash
./run.sh local        # or `prod`, add --detach to run detached
```

Spring profiles: `local` (`application-local.properties`) and `prod` (`application-prod.properties`), selected via `SPRING_PROFILES_ACTIVE`.

### statement-loader (Python/Flask)
Run from the **repo root**, not from inside `statement-loader/` (see its README's Gotchas for why):
```bash
pip install -r statement-loader/requirements.txt
python statement-loader/run.py --app-profile local     # profiles: local, dev, qa, prod
```

### finance-manager-ui (Angular/Ionic)
```bash
cd finance-manager-ui
npm install
npm start              # ng serve, local env
npm run start:dev      # / :qa / :uat / :prod for other environments
npm run build          # ng build (also build:dev/:qa/:uat/:prod)
npm test               # karma/jasmine unit tests
npm run lint
ionic serve --external # serve reachable on LAN, used for device testing
```
Environment config (API base URLs per env) lives in `src/environments/environment*.ts` and is selected via the Angular build `--configuration` flag.

### Running the whole stack locally
`scripts/local_startup/*.sh` has one script per module showing the exact local run command (Postgres via Docker, then each Gradle service via `bootRun`, then statement-loader, then `ionic serve`). `scripts/app_startup` documents the same flow end-to-end including the Postgres container and `nohup`-backgrounding each process. There's no single top-level script that starts everything yet - start Postgres first, then the three Java services, then statement-loader, then the UI. (A dedicated `local-run` skill to automate this is planned - see `jira/README.md` for status.)

Database schema is managed by `scripts/sql/finance_manager_db/database_manager.py` (create/drop/truncate tables from `finance_manager_db_config.py`); see `scripts/sql/finance_manager_db/README.md` for full CLI usage and table creation order (dependencies flow: `account_icon`/`account_type` -> `account` -> `account_statement`/`user_detail` -> `user_account` -> `transaction` -> `user_category` -> `transaction_user_category`).

## Architecture

### Service responsibilities
- **api-gateway**: owns `user_detail` (signup/login/logout via `AuthController`/`UserServiceImpl`), hashing passwords with BCrypt. Reads/writes `user_detail` directly via JDBC - it does **not** call `account-service` or any other service. Auth tokens are stored in an in-memory map (not real JWTs, don't survive a restart) - see its README's Gotchas.
- **account-service**: `account` (bank/broker accounts) and `user_account` (a user's linkage to an account) domains. `AccountController` / `UserAccountController` -> `*ServiceImpl` -> `*PostgresDao`, using Spring JDBC (no JPA/ORM). `AccountGrouper` groups accounts for API responses (`GroupedAccount`/`GroupedUserAccount` DTOs).
- **transaction-service**: `transaction` (individual transactions with `DebitCreditIndicator`) and `user_category`/`transaction_user_category` (user-defined categorization of transactions). Same controller -> service -> DAO -> Postgres JDBC pattern. Its `/transaction/v1/save_all` is called by `statement-loader` (not a direct DB write from that module).
- **statement-loader**: ingests uploaded bank/broker statement files. Flow: `controller/statement_upload_controller.py` (Flask blueprint at `/statement/upload/v1`) -> `service/statement_uploader.py` -> per-account/format parsing in `service/statement_reader/**` -> `service/transaction_service.py`, which upserts via `dao/transaction_dao.py`'s `TransactionApiDao` - an HTTP POST to `transaction-service`'s `/transaction/v1/save_all` (a `TransactionPostgresDao` also exists in that file but is not the one wired up). Account/`account_statement` metadata lookups, by contrast, **are** direct Postgres reads (`dao/account_statement_dao.py`).
- **finance-manager-ui**: Ionic/Angular app under `src/app/*` (one folder per feature: `account-list`, `transaction-list`, `category-list`, `statement-uploader`, `auth`, `tabs`, etc.), with HTTP clients in `src/service/*.service.ts` mapping 1:1 to backend endpoints, plus an `auth-inteceptor.service.ts` for attaching auth to requests and an `auth-guard.service.ts` for route protection.

### statement-loader's plugin pattern (important when adding a new bank/broker format)
- `model/account_details_factory.py` (`AccountDetailsFactory`) enumerates supported accounts (HDFC, ICICI, CANARA, AXIS, GROWW, ZERODHA, FDs, PPF, etc.) as `AccountDetails`.
- Each concrete parser lives under `service/statement_reader/bank_savings/*.py` or `service/statement_reader/mutual_fund_statement/*.py` and subclasses the abstract `StatementReader` (`service/statement_reader/statement_reader.py`), implementing `read_statement(request, file)`, `account_id()`, `version()`, `extension()`.
- `service/statement_reader/statement_reader_factory.py` auto-discovers **every** `StatementReader` subclass at import time (via `import_subclasses_from_package` + `get_all_subclasses`) and indexes them by `StatementReaderKey(account_id, version, extension)`. A new reader is picked up automatically just by adding the file under the package - no manual registration - but it will raise at startup if two readers share the same key.
- The actual `(account_id, extension) -> reader` resolution for a given upload additionally depends on `account_statement` rows in Postgres (which map an account + timestamp range + extension + version to the statement format in effect at that time) - see `service/account_statement_service.py`.

### Cross-service coupling
- `account-service` and `transaction-service` (and `api-gateway`, for `user_detail`) each own their own tables and are not called by each other over HTTP.
- `statement-loader` is the one module that both reads Postgres directly (account/account_statement metadata) *and* calls another service over HTTP (`transaction-service`, to write transactions) - see above.
- The UI is configured with all four backend base URLs simultaneously (`environment.ts`'s `apiEndpoints`) and calls each service directly - `api-gateway` is not a reverse proxy for general traffic, it's specifically for auth.

## CI/CD
Each module has its own GitHub Actions deploy workflow at the repo root (`.github/workflows/<module>-deploy.yml`), scoped with `paths:` so a push to `main` only builds/deploys the module that actually changed - it builds a Docker image (`bootBuildImage` for Java, `docker build`/`build-push-action` for statement-loader/UI) and deploys it via SSH/SCP, running the container directly with `SPRING_PROFILES_ACTIVE=prod` where applicable. Note: nested `.github/workflows/` directories *inside* a module folder are not read by GitHub Actions - only the repo-root one is.

`pr-checks.yml` runs on every PR: a `detect-changes` job (via `dorny/paths-filter`) determines which modules changed, then only that module's build/test job runs; an always-on `pr-gate` job aggregates the results into a single check. Branch protection requiring `pr-gate` to pass is not currently configured (this repo is private on a free GitHub plan, which doesn't support required status checks on private repos) - the check still reports pass/fail on every PR, it just doesn't block merge yet.
