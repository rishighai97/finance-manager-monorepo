# Finance Manager

Multi-module workspace for the Finance Manager application. Each module below keeps its own README with module-specific setup/usage details; this file just gives the map.

| Module | Stack | Port (local) | Description |
|---|---|---|---|
| [`account-service`](account-service/README.md) | Java 21, Spring Boot (Gradle) | 5003 | APIs to read and write user accounts |
| [`api-gateway`](api-gateway/README.md) | Java 21, Spring Boot (Gradle) | 5001 | Handles signup/login and fronts auth for the other services |
| [`transaction-service`](transaction-service/README.md) | Java 21, Spring Boot (Gradle) | 5004 | APIs to read and write user transactions and categories |
| [`statement-loader`](statement-loader/README.md) | Python, Flask | 5002 | Loads transactions from uploaded bank/broker account statements |
| [`finance-manager-ui`](finance-manager-ui/README.md) | Angular 19 + Ionic 8 (Capacitor) | 8100 | Mobile/web client |
| [`scripts`](scripts/README.md) | Bash / Python | — | Local environment setup, database schema management, and deployment helper scripts |

All four backend services (`account-service`, `api-gateway`, `transaction-service`, `statement-loader`) share a single Postgres database (`finance_manager`, default `localhost:5432` locally).

## CI/CD

Each module has its own GitHub Actions deploy workflow (`.github/workflows/<module>-deploy.yml`), scoped to only run when that module's files change. Pull requests run `.github/workflows/pr-checks.yml`, which detects which modules changed and only builds/tests those (see that module's job for exact commands); a single `pr-gate` check is required to merge.
