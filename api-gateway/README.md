# api-gateway

Handles user signup/login/logout.

## Overview
Owns the `user_detail` table and issues/validates auth tokens for the UI. Despite the name, it is **not** a reverse proxy in front of the other services - `finance-manager-ui` calls `account-service`/`transaction-service`/`statement-loader` directly; this service is only involved in the auth flow. It also does **not** call `account-service` - it reads/writes `user_detail` directly via JDBC.

## Tech stack
- Java 21, Spring Boot (Gradle)
- Spring JDBC (`NamedParameterJdbcTemplate`) - no JPA/Hibernate, no ORM
- `spring-security-crypto` (BCrypt password hashing)
- Lombok

## Local setup & run
Assumes Postgres is already running locally (see repo root README) with the `finance_manager` database.

```bash
cd api-gateway
export JAVA_HOME=~/openjdk-21.0.1   # or your JDK 21 install
export PATH=$JAVA_HOME/bin:$PATH
./gradlew bootRun --args='--spring.profiles.active=local'
```

Listens on port **5001**. Connection settings are in `src/main/resources/application-local.properties`.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/auth/healthcheck` | Liveness check |
| POST | `/auth/signup` | Create a user (username + password, BCrypt-hashed) |
| POST | `/auth/login` | Authenticate, returns an access/refresh token pair |
| POST | `/auth/logout` | Invalidate a token (`Authorization` header) |

## Testing
`./gradlew test` (JUnit 5, `useJUnitPlatform()` enabled). A default `ApiGatewayApplicationTests` context-load test exists; no endpoint-level tests yet.

## Gotchas
- **Tokens are not real JWTs and are not persisted**: `UserServiceImpl` stores active tokens in an in-memory `HashMap` (`token -> userId`) and generates the token as `"token-" + System.currentTimeMillis()`. This means: tokens don't survive a service restart, don't work across multiple instances, have no expiry enforcement beyond the `expiresIn` field in the response, and are trivially guessable. Treat this as a known gap to close before this is customer-facing, not as a design to build further on.
