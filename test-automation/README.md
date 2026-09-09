# test-automation

Black-box BDD test suite for finance-manager, covering business scenarios across the four backend services.

## Overview
A Spring Boot + Gradle project running Cucumber-JVM tests against an already-running finance-manager stack - it never starts, mocks, or embeds the services themselves. Scenarios call the real service HTTP endpoints directly (`account-service`, `api-gateway`, `transaction-service`, `statement-loader`). Two Claude Code skills maintain this project: `scenario-discovery` (finds business scenarios by reading the real API surface) and `bdd-test-generate` (turns a scenario into an actual test) - see `docs/SKILLS.md`.

Earlier iterations of this suite also drove `finance-manager-ui` end-to-end with Playwright. That UI layer was removed (see `jira/JIRA_6.md`'s Changelog) in favor of backend-only coverage - Ionic's shadow-DOM/tab-caching quirks made the UI tests slow to write and flaky to keep green relative to the value they added over the equivalent backend test. All scenarios are now backend-only.

## Tech stack
- Java 21, Spring Boot (Gradle) - same toolchain as the other Java modules, but this project has no runtime role of its own; Spring here only exists to host Cucumber's Spring integration (profile-based config, dependency injection into step classes).
- Cucumber-JVM (`cucumber-java`, `cucumber-spring`, `cucumber-junit-platform-engine`) for BDD, run via JUnit 5's platform through an explicit `@Suite` class (`RunCucumberTest`) - Gradle's own test-class scanner works off compiled `*Test` classes, not classpath resources, so relying on `.feature`-file auto-discovery alone isn't reliable.
- Plain `RestTemplate` for step definitions (matches this repo's other services' Spring-first HTTP conventions - no separate REST client library).

## Local setup & run
With the target environment's stack already running (`local-run` for `local` - see root `CLAUDE.md`):
```bash
./gradlew test                                    # everything
./gradlew test -Dcucumber.filter.tags="@account"  # one category (any tag from the catalog below)
./gradlew test -Dcucumber.filter.tags="@account and @backend"
./gradlew test -Dspring.profiles.active=dev       # against a different environment (local is the default)
```

### Environments
`spring.profiles.active` selects `src/test/resources/application-<profile>.properties`, each defining the four backend services' base URLs - `local`, `dev`, `qa`, `uat`, `prod`. Only `local` is actually exercised/verified so far; the others currently point at `localhost` too, mirroring `finance-manager-ui`'s own `environment.*.ts` files (no distinct dev/qa/uat/prod deployment host exists yet anywhere in this repo) - update them once one does.

### Viewing results
Cucumber's own HTML report (via its `html` plugin, wired in `RunCucumberTest`) is written to:
```
test-automation/build/reports/cucumber/report.html
```
Open it directly in a browser after any run. Gradle's own generic test report (`build/reports/tests/test/index.html`) also exists but the Cucumber one is the readable, scenario-level view.

## Key modules
- `src/test/resources/features/<category>/*.feature` - the actual Gherkin scenarios, one category per folder.
- `src/test/java/.../steps/backend/` - `RestTemplate`-backed step definitions.
- `src/test/java/.../config/EnvironmentConfig.java` - the per-profile base-URL bean injected into step classes.
- `src/test/java/.../RunCucumberTest.java` - the JUnit Platform Suite entry point Gradle actually runs.

## Adding a new test
1. If the scenario isn't in the catalog below yet, run the `scenario-discovery` skill to add it (or add the row by hand if it's a one-off).
2. Run the `bdd-test-generate` skill on that scenario - it writes the `.feature` file + step definitions, runs it, and flips the row below to `Implemented`.

## Test catalog
`Status` is `Planned` until `bdd-test-generate` has produced a passing test for that row, `Ongoing` if a test exists but hasn't been confirmed passing (fix applied but not yet re-verified, or newly broken and not yet diagnosed), and `Implemented` once it's green.

| Input source | Title | Category | Status |
|---|---|---|---|
| backend | Sign up a new user | auth | Implemented |
| backend | Log in with valid credentials | auth | Implemented |
| backend | Log out invalidates the session | auth | Implemented |
| backend | Fetch the full account catalog | account | Implemented |
| backend | Fetch the grouped account catalog | account | Implemented |
| backend | Link an existing account to a user | account | Implemented |
| backend | Rename a user's linked account | account | Implemented |
| backend | Unlink an account from a user | account | Implemented |
| backend | Fetch a user's linked accounts | account | Implemented |
| backend | Fetch a user's linked accounts, grouped | account | Implemented |
| backend | Bulk-create several categories at once | category | Implemented |
| backend | Create a single category | category | Implemented |
| backend | Bulk-edit existing categories | category | Implemented |
| backend | Bulk-delete categories | category | Implemented |
| backend | Map a transaction to a category | category | Implemented |
| backend | Fetch a user's transactions in a date range | transaction | Implemented |
| backend | Filter transactions by category | transaction | Implemented |
| backend | Filter transactions by debit/credit indicator | transaction | Implemented |
| backend | Upload a bank statement and have it parsed | statement_upload | Implemented |
| backend | Upload a statement and see its transactions appear in transaction fetch | e2e_flow | Implemented |
| backend | Sign up, link an account, and see it in the user's account list | e2e_flow | Implemented |

All 21 scenarios are implemented and passing (`./gradlew test`, verified against a local stack on 2026-09-09).

## Testing
This project *is* the test suite - "testing it" means running it (see above) against a healthy local stack and checking the HTML report.

## Gotchas
- Every test here writes real data (new users, categories, etc.) against whatever database the target environment is pointed at - there's no teardown/cleanup step, matching the fact that most of these endpoints have no corresponding delete (e.g. no delete-user endpoint exists on `api-gateway`). Re-running the suite repeatedly against the same local Postgres will accumulate `backend_user_*` users and similarly-titled fixture rows indefinitely - use the `db-setup` skill to reset if that matters to you, or give fixtures unique-per-run titles (e.g. a timestamp suffix) if a test's own assertions need to distinguish "this run's data" from prior runs' leftovers.
- `local-run`'s Gradle-launched services can take a while to become healthy on a cold start (first-time dependency download) - if a test fails immediately with a connection error, check the target service is actually up (`curl` its healthcheck) before assuming the test itself is broken.
- `statement-loader`'s `/statement/upload/v1/` endpoint used to return a plain Python `str` (`json.dumps(result)`), which Flask defaults to `Content-Type: text/html` - valid JSON bytes, wrong header. `curl`/`requests` don't care, but Spring's `RestTemplate` correctly refuses to deserialize a `List` from a `text/html` response (`UnknownContentTypeException`). Fixed in `statement-loader/controller/statement_upload_controller.py` by returning an explicit `application/json` content type. Worth knowing if a similar `UnknownContentTypeException` shows up against a new statement-loader endpoint.
