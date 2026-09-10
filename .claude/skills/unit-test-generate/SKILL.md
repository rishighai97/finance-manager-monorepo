---
name: unit-test-generate
description: Write unit tests for this repo's modules, in one of two modes - "existing feature" (characterization tests for code that already exists, no behavior change) or "new feature" (write failing tests first from a JIRA ticket's acceptance criteria, then implement to make them pass - TDD). New-feature mode is the default going forward for any ticket with a concrete acceptance criterion; use existing-feature mode to backfill coverage on code that predates this skill. Use when asked to add/generate unit tests for a class/module, to backfill coverage, or to implement a ticket "test-first"/"TDD".
---

# unit-test-generate

Writes real unit tests - not scaffolding - for `account-service`, `api-gateway`, `transaction-service` (JUnit 5 + Mockito), `statement-loader` (pytest), and `finance-manager-ui` (Jasmine/Karma). See `jira/JIRA_7.md` for the ticket this skill was built under and the coverage baseline it established.

## Modes

### Existing-feature mode
Backfills tests onto code that already ships, without changing its behavior.

1. Pick the target (a class/file, or "the next uncovered area" - check the module's coverage report, see below, for what's not covered yet).
2. Read the actual implementation - don't guess behavior from the class name or a docstring.
3. Write tests that pin down what the code **actually does today**: the happy path, at least one edge case (null/empty/boundary input), and at least one error path (invalid input, a mocked downstream failure) per unit under test where applicable.
4. Run them and confirm they pass against the code as-is. If a test doesn't pass, that means either the test is wrong (fix the test) or the code has a real bug - in the latter case, do **not** fix the bug as a side effect. Document it (see "Bugs found" below) and leave the code untouched.
5. Make no production code changes in this mode, with one narrow exception: a change needed purely to make something testable (e.g. extracting a `new SomeCollaborator()` behind constructor injection so it can be mocked). Keep it minimal and call it out explicitly in the PR/commit description - this is a seam change, not a behavior change.

### New-feature mode (the default for new tickets going forward)
Classic red-green-refactor TDD, driven by a JIRA ticket's acceptance criteria.

1. Read the ticket's Acceptance criteria - each one becomes at least one test.
2. Write the tests first. They should fail (red) - there's no implementation yet, or the existing implementation doesn't satisfy the new criterion.
3. Implement the minimum code to make them pass (green).
4. Refactor if needed, keeping the tests green.
5. Don't move on to the next acceptance criterion until the current one's test is green.

### Bugs found while characterizing existing behavior
Write it down - in the ticket's Implementation notes if it's a one-liner, or as a new `jira/JIRA_<N>.md` (via `jira-create`) if it's substantial - rather than fixing it inline. Existing-feature mode's whole point is a behavior-neutral diff; a silent fix defeats that and makes the diff harder to review.

## Java test structure convention (account-service, api-gateway, transaction-service)

Every test class groups its `@Test` methods into `@Nested` inner classes, one per method-under-test (or per scenario grouping for a more complex unit), each carrying a `@DisplayName` - on both the nested class and its test methods - so the JUnit/Gradle output reads as sentences, not method names:

```java
@ExtendWith(MockitoExtension.class)
class AccountServiceImplTest {

    @Mock AccountPostgresDao accountDao;
    @InjectMocks AccountServiceImpl accountService;

    @Nested
    @DisplayName("Fetching an account by id")
    class FetchById {

        @Test
        @DisplayName("returns the account when it exists")
        void returnsAccountWhenPresent() { ... }

        @Test
        @DisplayName("returns empty when no account matches the id")
        void returnsEmptyWhenMissing() { ... }

        @Test
        @DisplayName("propagates a DataAccessException from the DAO")
        void propagatesDaoFailure() { ... }
    }
}
```

Mock the DAO/`JdbcTemplate` layer with Mockito (`@Mock`/`@InjectMocks`, or `Mockito.mock(...)`) - these are unit tests, not integration tests. The real-Postgres path is already covered by `test-automation`'s black-box suite (`.claude/skills/scenario-discovery`, `.claude/skills/bdd-test-generate`); duplicating that here with Testcontainers would be slow and redundant.

## Coverage tooling and thresholds

Every module enforces a **60% minimum line coverage**, gated in the module's own normal test command (not a separate CI-only step):

| Module | Tool | Command | Threshold config |
|---|---|---|---|
| `account-service`, `api-gateway`, `transaction-service` | JaCoCo | `./gradlew test jacocoTestReport jacocoTestCoverageVerification` (the last task fails the build below threshold; `./gradlew check` runs all three) | `jacocoTestCoverageVerification` block in `build.gradle`, `minimum = 0.60` |
| `statement-loader` | `pytest-cov` | `pytest --cov --cov-fail-under=60` | `--cov-fail-under=60` (in `pytest.ini`/`setup.cfg` or the command itself) |
| `finance-manager-ui` | Istanbul (via Angular CLI) | `ng test --code-coverage` | `coverageIstanbulReporter.thresholds` in `karma.conf.js`, `statements`/`lines` at `60` |

DTOs/records/plain config classes with no branching logic can be excluded from the denominator (JaCoCo `excludes` patterns, `# pragma: no cover` in Python) instead of padded out with trivial getter tests - call this out explicitly per module rather than silently lowering the bar.

## Where to view results

- **Java services**: `build/reports/tests/test/index.html` (per-test pass/fail, with the `@DisplayName` sentences) and `build/reports/jacoco/test/html/index.html` (line/branch coverage by package/class), both under the module's own directory (e.g. `account-service/build/reports/...`).
- **statement-loader**: `pytest`'s own terminal summary, plus `pytest-cov`'s HTML report at `statement-loader/htmlcov/index.html` (generate with `pytest --cov --cov-report=html`).
- **finance-manager-ui**: Karma's terminal output, plus Istanbul's HTML coverage report at `finance-manager-ui/coverage/finance-manager-ui/index.html`.

Each module's own README `Testing` section documents this too - check there first if a path here goes stale.

## Keeping this doc updated

See `docs/SKILLS.md` for the full skill catalog and `jira/JIRA_7.md` for the ticket this skill and its initial coverage backfill were implemented under.
