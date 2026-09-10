# account-service

APIs to read and write user accounts.

## Overview
Owns two related domains: `account` (the catalog of bank/broker accounts, e.g. "HDFC Savings") and `user_account` (a specific user's ownership/linkage of an account, with a user-chosen display name). It's called directly by `finance-manager-ui`; it does not call, and is not called by, the other backend services.

## Tech stack
- Java 21, Spring Boot (Gradle)
- Spring JDBC (`NamedParameterJdbcTemplate` / plain JDBC DAOs) - no JPA/Hibernate, no ORM
- Lombok
- Postgres (`org.postgresql:postgresql`), connection pooled via HikariCP

## Local setup & run
Assumes Postgres is already running locally (see repo root README) with the `finance_manager` database.

```bash
cd account-service
export JAVA_HOME=~/openjdk-21.0.1   # or your JDK 21 install
export PATH=$JAVA_HOME/bin:$PATH
./gradlew bootRun --args='--spring.profiles.active=local'
```

Listens on port **5003**. Connection settings are in `src/main/resources/application-local.properties` (defaults: `localhost:5432`, user `postgres`, password `admin`).

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/account/v1/healthcheck` | Liveness check |
| GET | `/account/v1/fetch_all` | List all accounts in the catalog |
| GET | `/account/v1/fetch_all/grouped` | List all accounts, grouped (see `AccountGrouper`) |
| GET | `/user_account/v1/healthcheck` | Liveness check |
| GET | `/user_account/v1/fetch_all?user_ids=` | List a user's linked accounts, by user ID(s) |
| GET | `/user_account/v1/fetch_all/grouped?user_ids=` | Same, grouped |
| POST | `/user_account/v1/save` | Link an account to a user with a display name |
| PUT | `/user_account/v1/edit` | Rename a user's linked account |
| DELETE | `/user_account/v1/delete?user_account_id=` | Unlink an account from a user |

## Testing
`./gradlew test` (JUnit 5 via `spring-boot-starter-test` + Mockito) - `useJUnitPlatform()` is now enabled (previously commented out, so this task silently ran 0 tests; see `jira/JIRA_7.md`). Real unit tests cover `AccountController`/`UserAccountController` (including validation edge cases), `AccountServiceImpl`/`UserAccountServiceImpl`, `AccountGrouper`'s grouping logic, and the `*PostgresDao` classes (DAO layer mocked at the `NamedParameterJdbcTemplate` level - no live Postgres needed). `./gradlew test jacocoTestCoverageVerification` (also wired into `check`) fails the build below 60% line coverage; JaCoCo's HTML report is at `build/reports/jacoco/test/html/index.html`, the JUnit HTML report (with `@DisplayName` sentences) at `build/reports/tests/test/index.html`. `UserAccountServiceApplicationTests`'s context-load smoke test uses an in-memory H2 database (`src/test/resources/application.properties`) purely to satisfy the `DataSource` bean - it was never previously verified as passing either, since it requires a `DataSource` that no-profile test runs didn't have.

## Gotchas
- No JPA/ORM - all data access is hand-written SQL via `AccountPostgresDao`/`UserAccountPostgresDao`. Schema changes need a matching DAO change; there's no auto-migration.
