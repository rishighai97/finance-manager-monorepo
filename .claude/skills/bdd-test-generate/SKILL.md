---
name: bdd-test-generate
description: Turn one test-automation/README.md catalog scenario (or a new one described ad hoc) into a runnable Cucumber BDD test (direct HTTP against the real service), then run it against a live local stack and flip the catalog row to Implemented once it passes. Use when asked to add/generate a test for a specific scenario, or to implement the next Planned row in the catalog.
---

# bdd-test-generate

Takes one scenario and produces a working backend test for it. Always against a real, already-running stack (`local-run` must be up) - never an embedded/mocked context.

Earlier versions of this skill also generated a Playwright UI test per scenario; the UI layer was removed (see `jira/JIRA_6.md`'s Changelog) in favor of backend-only coverage. All scenarios are backend-only now.

## Prerequisite

The target environment must actually be running first (`local-run` for `local`; for any other environment, whatever's already reachable at the URLs in `test-automation/src/test/resources/application-<env>.properties`). This skill never starts services itself.

## Procedure, per scenario

1. **Find the real endpoint** you're testing before writing any assertion: read the actual controller method's request/response shape (don't guess field names from the README's prose).
2. **Create the feature file** under `test-automation/src/test/resources/features/<category>/<scenario_slug>_backend.feature`, tagged `@backend @<category>`. Keep it short and readable (3-5 steps) - Given/When/Then describing user intent, not implementation.
3. **Write step definitions** under `test-automation/src/test/java/.../steps/backend/<Category><Thing>Steps.java`:
   - Steps take `EnvironmentConfig` (for the relevant `*Url()`) via constructor injection, and a `RestTemplate` (or similar) for the actual call.
   - Reuse an existing step definition (by matching Gherkin phrasing) instead of writing a near-duplicate - Cucumber matches steps by their `@Given`/`@When`/`@Then` regex/expression text across all glue classes in `cucumber.glue`'s package, not per-feature-file.
   - Test data that must be unique per run (usernames, category names, etc.) should be generated in the step (e.g. `"backend_user_" + System.currentTimeMillis()`), not hardcoded literals - these are black-box tests against a real, possibly-already-seeded database (see `db-setup`'s sample data), and re-running the suite must not collide with a previous run's leftover data or fail on a uniqueness constraint.
   - Watch for content-type mismatches when a service hand-rolls its response instead of using a framework JSON helper: `statement-loader`'s upload endpoint used to return a plain Python `str` from `json.dumps(...)`, which Flask defaults to `Content-Type: text/html` even though the body is valid JSON - `RestTemplate` throws `UnknownContentTypeException` in that case even though `curl`/`requests` see a fine 200. If a new endpoint does this, fix the endpoint (explicit `application/json` content type), not the test.
4. **Run it** and don't consider the scenario done until it's actually green:
   ```bash
   cd test-automation
   ./gradlew test -Dcucumber.filter.tags="@<category>"
   ```
5. **Update `test-automation/README.md`**: flip that scenario's catalog row from `Planned` to `Implemented` once it passes. If a fix was applied but not yet re-verified by a passing run, mark it `Ongoing` instead of `Implemented` - never mark a row `Implemented` without having actually seen it pass.

## Keeping this doc updated

See `docs/SKILLS.md` for the full skill catalog and `scenario-discovery`'s `SKILL.md` for how catalog rows get created in the first place.
