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
`./gradlew test` (JUnit 5, `useJUnitPlatform()` enabled). A default `TransactionServiceApplicationTests` context-load test exists; no endpoint-level tests yet.

## Gotchas
- Date range params (`start_date`/`end_date`) must be `yyyy-MM-dd`; `category_ids`/`user_account_ids` must parse as integers - both are validated with a 400 response, not silently coerced.
