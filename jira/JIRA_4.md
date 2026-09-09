<!--
Template for jira/JIRA_<ID>.md. Maintained by the `jira-create` skill
(.claude/skills/jira-create/SKILL.md) - don't hand-edit ticket structure
without updating both this template and that skill.
-->

# JIRA_4: Signup 500s - blank local Postgres password in api-gateway/transaction-service

**Status**: Done <!-- Draft -> In Refinement -> Ready for Dev -> In Progress -> Done -->
**Created**: 2026-09-09
**Last updated**: 2026-09-09

## One-liner
Signup with rishi and rishi as uname/password giving 500

## Summary
`POST /auth/signup` on `api-gateway` returns HTTP 500 for any input, including `{"username":"rishi","password":"rishi"}`. Root cause confirmed via `api-gateway/server.log`: `org.postgresql.util.PSQLException: The server requested SCRAM-based authentication, but no password was provided`. `api-gateway/src/main/resources/application-local.properties` has `spring.datasource.password=` (blank), so HikariCP can't open a JDBC connection to the local `finance_manager` Postgres at all, and `UserServiceImpl.createUser`'s transaction fails before it can insert into `user_detail`. The same blank-password config exists in `transaction-service/src/main/resources/application-local.properties` and was independently reproduced there too (`GET /category/v1/fetch_all?user_ids=1` -> 500 "Failed to obtain JDBC Connection", same Hikari/JDBC failure signature in its log). `account-service`'s equivalent file has `spring.datasource.password=admin` and is unaffected - it's just these two files with a blank password.

## Scope

### In scope
- Fix `api-gateway/src/main/resources/application-local.properties`'s `spring.datasource.password` (currently blank) to match the local Postgres default password (`admin` - same default used by `account-service`'s own `application-local.properties`, `scripts/postgres.sh`, and every one of this session's local-run/local-setup/db-setup skills).
- Fix the same blank `spring.datasource.password` in `transaction-service/src/main/resources/application-local.properties`.
- Re-verify: `POST /auth/signup` succeeds and a row appears in `user_detail`; a transaction-service DB-backed endpoint (e.g. `GET /category/v1/fetch_all`) succeeds.

### Out of scope
- `application-dev.properties`/`application-qa.properties`/`application-uat.properties`/`application-prod.properties` or any non-local profile - this is specifically about the `local` profile's password being blank, not a broader credentials-management change.
- Auth token design (in-memory, not real JWTs) - a separate known gap noted in `api-gateway`'s own README, not part of this bug.
- Rotating/changing the actual local Postgres password itself - `admin` is already the established local-dev default across this repo (not a real secret); this ticket just makes these two files consistent with that existing default, not introduce a new one.

## Affected modules
- [x] api-gateway (`application-local.properties` - blank `spring.datasource.password`, breaks `/auth/signup` and presumably `/auth/login`)
- [x] transaction-service (`application-local.properties` - same blank password, breaks any DB-backed endpoint e.g. `/category/v1/fetch_all`, `/transaction/v1/fetch_all`)

`account-service` checked and confirmed unaffected (`password=admin` already present).

## Requirements
1. `api-gateway`'s local Postgres password is no longer blank and matches the repo-wide local default.
2. `transaction-service`'s local Postgres password is no longer blank and matches the repo-wide local default.
3. Both fixes are verified against a running local stack (not just code-reviewed), since this class of bug (blank password) only surfaces at actual JDBC-connection time, not at compile/build time.

## Resolved (was Open questions)
- Confirmed via `git log`/`git show`: commit `ff16899` ("updating postgres password", 2025-04-12) fixed this exact blank-password issue in `account-service/src/main/resources/application-local.properties` (blank -> `admin`) but was never applied to the equivalent files in `api-gateway` or `transaction-service`. This is a clear oversight (a fix applied to one sibling service and never propagated), not a deliberate design choice - filling in `admin` in both is the right fix.

## Acceptance criteria
- [x] `POST /auth/signup` with a fresh username/password returns 2xx and the user appears in `user_detail`. Verified: `{"username":"rishi","password":"rishi"}` -> 200, `{"id":5,"username":"rishi",...}`.
- [x] `POST /auth/login` with that same user succeeds. Verified: 200, access/refresh tokens issued.
- [x] A transaction-service DB-backed endpoint (e.g. `GET /category/v1/fetch_all?user_ids=<id>`) returns 2xx instead of 500. Verified: `?user_ids=1` -> 200, sample categories (SALARY/FOOD/LUNCH/DINNER/SNACKS) returned.
- [x] No other local-profile Java service regresses. Verified: account-service, statement-loader, and the UI all still healthy after restarting api-gateway/transaction-service.

## Implementation notes
- One-line fix per file: `spring.datasource.password=` -> `spring.datasource.password=admin` in `api-gateway/src/main/resources/application-local.properties` and `transaction-service/src/main/resources/application-local.properties`, matching `account-service`'s already-correct value and every other local-default reference in this repo (`scripts/postgres.sh`, this session's `local-run`/`local-setup`/`db-setup` skills).
- Config changes need a JVM restart to take effect (not hot-reloaded) - restarted just `api-gateway` and `transaction-service` (killed by port, relaunched via the same `./gradlew bootRun --args='--spring.profiles.active=local'` pattern `local-run` uses), leaving `account-service`/`statement-loader`/the UI untouched and running.
- Verified for real against the live local stack (not just code review) per Requirement 3, since this class of bug only surfaces at actual JDBC-connection time.

## Changelog
- 2026-09-09: created from one-liner (Draft) - root cause pre-diagnosed via server.log (blank spring.datasource.password in api-gateway and transaction-service's application-local.properties) before filing, per this session's investigation
- 2026-09-09: resolved the one open question via git history (commit ff16899 shows this was fixed in account-service and never propagated to api-gateway/transaction-service - an oversight, not deliberate); user confirmed, moving to implementation (Ready for Dev)
- 2026-09-09: fixed both files (blank -> admin), restarted api-gateway/transaction-service, verified signup/login/category-fetch all succeed against the live local stack with no regressions. Marking **Done**.
