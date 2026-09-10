# transaction-service

APIs to read and write user transactions and their categories.

## Overview
Owns `transaction` (individual debit/credit entries linked to a `user_account`) and `user_category`/`transaction_user_category` (user-defined categories and their mapping to transactions). Transactions are written here by `statement-loader` after it parses an uploaded statement, and read/edited here by `finance-manager-ui`.

## Tech stack
- Java 21, Spring Boot (Gradle)
- Spring JDBC (`NamedParameterJdbcTemplate` / plain JDBC DAOs) - no JPA/Hibernate, no ORM
- Lombok
- Postgres, connection pooled via HikariCP

## Local setup & run
Assumes Postgres is already running locally (see repo root README) with the `finance_manager` database.

```bash
cd transaction-service
export JAVA_HOME=~/openjdk-21.0.1   # or your JDK 21 install
export PATH=$JAVA_HOME/bin:$PATH
./gradlew bootRun --args='--spring.profiles.active=local'
```

Listens on port **5004**. Connection settings are in `src/main/resources/application-local.properties`.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/transaction/v1/healthcheck` | Liveness check |
| POST | `/transaction/v1/save_all` | Bulk-insert transactions (used by `statement-loader`) |
| GET | `/transaction/v1/fetch_all?user_account_ids=&start_date=&end_date=&category_ids=&debit_credit_indicator=` | List a user's transactions in a date range, optionally filtered by category/debit-or-credit |
| GET | `/category/v1/healthcheck` | Liveness check |
| GET | `/category/v1/fetch_all?user_ids=` | List a user's categories |
| POST | `/category/v1/save_all` | Bulk-create categories |
| PUT | `/category/v1/edit_all` | Bulk-edit categories |
| DELETE | `/category/v1/delete_all` | Bulk-delete categories |
| PUT | `/category/v1/transaction_user_category/edit_all` | Bulk-edit which category(ies) a transaction is mapped to (`TransactionUserCategoryAction`: INSERT/DELETE) |

## Testing
`./gradlew test` (JUnit 5 + Mockito, `useJUnitPlatform()` enabled). Real unit tests cover `TransactionController`/`CategoryController` (including validation edge cases), `TransactionServiceImpl` (opening/closing balance derivation, debit/credit totals - including a documented known bug, see Gotchas below), `CategoryServiceImpl` (empty/null guards, delete-vs-insert mapping segregation), and the `*PostgresDao` classes (DAO layer mocked at the `NamedParameterJdbcTemplate` level - no live Postgres needed). `./gradlew test jacocoTestCoverageVerification` (also wired into `check`) fails the build below 60% line coverage; JaCoCo's HTML report is at `build/reports/jacoco/test/html/index.html`, the JUnit HTML report at `build/reports/tests/test/index.html`. `TransactionServiceApplicationTests`'s context-load smoke test uses an in-memory H2 database (`src/test/resources/application.properties`) purely to satisfy the `DataSource` bean - it was never previously verified as passing either, since it requires a `DataSource` that no-profile test runs didn't have.

## Gotchas
- Date range params (`start_date`/`end_date`) must be `yyyy-MM-dd`; `category_ids`/`user_account_ids` must parse as integers - both are validated with a 400 response, not silently coerced.
- **Known bug** (found via unit tests, not yet fixed - see `jira/JIRA_7.md`): `TransactionServiceImpl.calculateOpeningBalance` calls `t.isDebitOrCredit().equalsIgnoreCase(...)` without a null check, unlike `getTotalDebitOrCreditAmount`'s `Objects.nonNull(...)` guard for the same field. A transaction with a null debit/credit indicator throws a `NullPointerException` from `/transaction/v1/fetch_all` rather than being gracefully excluded. Not reachable via the normal product flow (every real transaction has an indicator), but a real latent bug if that ever changes.
- **Fixed bug** (found via `test-automation`'s Groww e2e scenario, fixed under `jira/JIRA_8.md`): `calculateOpeningBalance`/`calculateClosingBalance` used to NPE (`BigDecimal.subtract`/`.add` on `null`) on a null `closing_balance` - mutual-fund/broker transactions (Groww) never set one, since there's no running bank-account-balance concept for a fund holding, unlike bank-savings transactions. Fixed by treating a null closing balance as zero when aggregating, rather than throwing. This is a distinct null-safety gap from the still-open one above (indicator vs. closing balance) - fixing this one didn't touch that one.
