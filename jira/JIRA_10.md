<!--
Template for jira/JIRA_<ID>.md. Maintained by the `jira-create` skill
(.claude/skills/jira-create/SKILL.md) - don't hand-edit ticket structure
without updating both this template and that skill.
-->

# JIRA_10: Observability module - single-page HTML healthcheck dashboard

**Status**: Done <!-- Draft -> In Refinement -> Ready for Dev -> In Progress -> Done -->
**Created**: 2026-09-10
**Last updated**: 2026-09-10

## One-liner
Create jira for setting up a new observability repo. This will house all setup for observability. For now we should create an HTML healthcheck page for finance manager where we can check all healthcheck api for backend at scheduled intervals and ui endpoint healthcheck also. Ensure all healthcheck apis are consistent (Return "OK"). This healthcheck page should have option to refresh in order to recall the APIs and should have multiple environments (local is the main focus for now, in dev, qa, uat, prod add local endpoint only). Add a skill which adds api to healthcheck with hook on any api changes in any other module. The page should also show time at which healthcheck was done in IST. healthcheck page is a single html page with js and css / bootstrap code in the same file.

## Summary
Today there's no single place to see whether the whole finance-manager stack is up - each backend service exposes its own `/.../healthcheck` endpoint with a different hardcoded string body, and there's no health signal for the UI at all. This ticket adds a new `observability` module inside this monorepo (following the precedent `architecture-docs` set in JIRA_9 - a module, not a separate repo, despite the "repo" wording in the one-liner) and its first deliverable: a single static HTML file (Bootstrap + vanilla JS, no build step) that polls every backend healthcheck endpoint plus the UI on a schedule, lets you force an immediate re-check, timestamps each check in IST, and is structured for multiple environments (local filled in now, dev/qa/uat/prod as empty slots for later). It also standardizes every backend healthcheck endpoint to return a consistent `{"status":"OK"}` JSON body, and adds a Claude Code skill with an actual hook (unlike JIRA_9's description-only-triggered `diagram-maintain`) that keeps the dashboard's endpoint list in sync whenever an API changes elsewhere in the monorepo.

## Scope

### In scope
- A new top-level module, `observability/` (added to `CLAUDE.md`'s module table, following `docs/README_TEMPLATE.md`'s shared structure), to house this and future observability tooling.
- A single static `healthcheck.html` file inside it: Bootstrap (via CDN) + vanilla JS + CSS all inline in that one file, no build step, no framework - opened directly as a local `file://` page.
- Polls, per environment: `account-service` (`/account/v1/healthcheck`, `/user_account/v1/healthcheck`), `api-gateway` (`/auth/healthcheck`), `transaction-service` (`/transaction/v1/healthcheck`, `/category/v1/healthcheck`), `statement-loader` (`/statement/upload/v1/healthcheck`), and a UI reachability check (`GET /` on the UI's base URL, since it has no dedicated health route).
- Standardizing all 5 backend healthcheck endpoints (`account-service` x2, `api-gateway`, `transaction-service` x2, `statement-loader`) to return `{"status":"OK"}` as JSON, replacing today's 5 different hardcoded plain-text strings - including updating the 4 existing unit tests that assert the old strings, and adding a first unit test for `UserAccountController.healthcheck()`.
- Automatic polling on a schedule, plus a manual "Refresh now" control that re-runs every check immediately.
- Each result shows the time it was last checked, formatted in IST (Asia/Kolkata), regardless of the browser's local timezone.
- Environment selector/sections: `local` fully configured now; `dev`/`qa`/`uat`/`prod` present in the page's structure but only the `local` endpoint filled in - others left as placeholders to fill in later.
- A new Claude Code skill (proposed name `healthcheck-maintain`) that updates the dashboard's endpoint list when a backend/UI API changes, plus a hook (configured via the `update-config` skill) that automatically invokes it when a matching file changes.

### Out of scope
- Historical/persisted health data, alerting, or paging - this is a live-poll dashboard, not a monitoring/alerting system.
- Filling in real dev/qa/uat/prod URLs - those environments exist as placeholders only; wiring them up is a follow-up once those environments' URLs are known/stable.
- Any other observability capability (logging, metrics/tracing, dashboards beyond this one) - the ticket title says "houses all observability setup" as the module's long-term purpose, but this ticket's actual deliverable is scoped to the healthcheck page only.
- Changing what a healthcheck endpoint *checks* (e.g. adding real DB-connectivity checks) - scope is standardizing the *response format* of what already exists, not deepening what "healthy" means.
- A local static server for the page - it's opened directly as a file, per the resolved decision below.

## Affected modules
- [x] account-service (healthcheck response format change to JSON `{"status":"OK"}`, `AccountControllerTest` update, new `UserAccountController` healthcheck test)
- [x] api-gateway (healthcheck response format change, `AuthControllerTest` update)
- [x] transaction-service (healthcheck response format change, `TransactionControllerTest`/`CategoryControllerTest` updates)
- [x] statement-loader (healthcheck response format change; also fixed a real, pre-existing blank local Postgres password bug found while restarting it - see Implementation notes)
- [ ] finance-manager-ui
- [ ] scripts
- [x] root / docs / CI (new `observability` module, new skill, hook config in `.claude/settings.json`)

## Requirements
1. New `observability` module created inside this monorepo, added to `CLAUDE.md`'s module table, with its own README (following `docs/README_TEMPLATE.md`) describing its purpose ("houses all observability setup for finance-manager") and pointing at the healthcheck page as its first artifact.
2. `healthcheck.html`: one file, Bootstrap + JS + CSS inline, no build step - opened directly as a local file.
3. Every backend healthcheck endpoint listed in Scope is called on page load, every 60 seconds thereafter, and on manual refresh; each row/card shows pass/fail and the IST timestamp of that check. The UI check hits its base URL and treats any 2xx as healthy.
4. All 5 backend healthcheck endpoints changed to return `{"status":"OK"}` JSON, with their existing unit tests updated to match and a new test added for `UserAccountController`.
5. Environment structure supports `local`, `dev`, `qa`, `uat`, `prod` - only `local` has real endpoint values for now.
6. A new skill keeps the page's endpoint list in sync with the real API surface, and a hook (in `.claude/settings.json`, via the `update-config` skill) automatically invokes that skill when a matching file changes: `*/src/main/java/**/controller/*.java` (3 Java services), `statement-loader/controller/*.py`, `finance-manager-ui/src/service/*.service.ts`.
7. `docs/SKILLS.md` and `CLAUDE.md`'s skills table updated with the new skill, per the repo's standing "keep the catalog in sync" rule.

## Current state (confirmed by reading the actual code, not just READMEs)
All 5 backend healthchecks return HTTP 200 with a hardcoded, human-readable plain-text string - **none already return `"OK"`, none are JSON, and no two are even worded the same**:
- `account-service` `AccountController.healthcheck()` -> `"Account API is up and running!"`
- `account-service` `UserAccountController.healthcheck()` -> `"Account API is up and running!"` (same string, likely copy/paste - no unit test exists for this one, unlike its sibling)
- `api-gateway` `AuthController.healthCheck()` -> `"API Gateway is up and running"`
- `transaction-service` `TransactionController.healthcheck()` -> `"Transaction API is up and running!"`
- `transaction-service` `CategoryController.healthcheck()` -> `"Category API is up and running!"`
- `statement-loader` `statement_upload_controller.healthcheck()` -> `"Statement API is up and running!"`

Four of these exact strings are asserted by existing unit tests (`AccountControllerTest`, `AuthControllerTest`, `TransactionControllerTest`, `CategoryControllerTest`) - standardizing the response means updating those tests in the same change, not just the controllers.

`finance-manager-ui` has **no dedicated health endpoint at all** - it's a plain Ionic/Angular SPA served by nginx with a catch-all `try_files $uri $uri/ /index.html`, so any "healthcheck" against it is just a plain `GET /` expecting a 2xx.

## Resolved (was Open questions)
- **Repo location**: not a separate git repo - a new top-level module, `observability/`, inside this monorepo (same pattern as `architecture-docs`/`dbscripts`/`test-automation`).
- **Response contract**: JSON body `{"status":"OK"}` (`Content-Type: application/json`) from every backend healthcheck endpoint, replacing today's 5 different hardcoded plain-text strings. This touches `AccountControllerTest`/`AuthControllerTest`/`TransactionControllerTest`/`CategoryControllerTest`'s existing string assertions (updated to check the new JSON body) and adds a first unit test for `UserAccountController.healthcheck()`, which currently has none.
- **Serving/CORS**: the page is opened directly as a local file (`file://`) - no local static server. Checked existing CORS config: `account-service`/`api-gateway`/`transaction-service` controllers already use bare `@CrossOrigin` (Spring) and `statement-loader`'s healthcheck route already uses bare `@cross_origin()` (flask-cors) - both permissive defaults that should already tolerate a `file://` page's `null` origin, but this needs to be actually verified against a live local stack during implementation (see Acceptance criteria), not just assumed from reading the annotation.
- **Hook behavior**: the hook auto-runs the `healthcheck-maintain` skill (no manual/reminder step) when it fires on a matching file change.
- **Hook file patterns**: `*/src/main/java/**/controller/*.java` (the three Java services), `statement-loader/controller/*.py`, and `finance-manager-ui/src/service/*.service.ts` - confirmed as the watched set.
- **Polling interval**: 60 seconds for the automatic schedule.

## Acceptance criteria
- [x] `observability` module exists with a README and the `healthcheck.html` page, listed in `CLAUDE.md`'s module table.
- [x] Opening `healthcheck.html` (served locally for the browser-automation check; the CORS behavior for the real `file://` case was independently verified via `curl`) against a live local stack shows live pass/fail status + IST timestamp for every in-scope backend + UI check ("7 up, 0 down"), with no console errors.
- [x] A "Refresh now" control immediately re-runs all checks - verified live (timestamp advanced from 06:28:33 pm to 06:29:10 pm IST on click).
- [x] `dev`/`qa`/`uat`/`prod` environment sections exist in the page but are clearly marked as not-yet-configured (no real URLs), while `local` is fully live - verified live (Dev tab shows the "not configured" placeholder).
- [x] All 5 backend healthcheck endpoints changed to return `{"status":"OK"}`; the 4 existing unit tests updated and passing (`./gradlew test jacocoTestCoverageVerification` green on all 3 Java services), `UserAccountController` has a new passing healthcheck test. Verified live via `curl` against all 6 real endpoints on a freshly restarted stack.
- [x] The new skill + hook exist (hook registered in `.claude/settings.json`, script at `.claude/skills/healthcheck-maintain/check-api-change.sh`) and were proven to fire live (sentinel-file test) against a real `Edit` on a matching controller file, then cleaned up.

## Implementation notes

### What was built
- **Healthcheck response standardization**: all 5 backend healthcheck methods (`AccountController`, `UserAccountController`, `AuthController`, `TransactionController`, `CategoryController`) changed from a hardcoded `String` to `Map<String, String>` returning `Map.of("status", "OK")` (Spring/Jackson auto-serializes to `{"status":"OK"}` JSON). `statement-loader`'s Flask route changed to `jsonify({"status": "OK"})`.
- **Real bug fixed along the way**: `statement-loader`'s `/statement/upload/v1/healthcheck` had no `@cross_origin()` decorator at all (every other route in that blueprint does) - a cross-origin page could never read its response. Added `@cross_origin()` to that route (see `statement-loader/README.md` Gotchas).
- **Test updates**: `AccountControllerTest`, `AuthControllerTest`, `TransactionControllerTest`, `CategoryControllerTest` updated to assert `Map.of("status", "OK")` instead of the old strings; a new `Healthcheck` nested test class added to `UserAccountControllerTest` (it had none before, unlike its sibling `AccountControllerTest`). Full `./gradlew test jacocoTestCoverageVerification` passes on all 3 Java services.
- **`observability/` module**: `README.md` (module README, following `docs/README_TEMPLATE.md`) + `healthcheck.html` (single file, Bootstrap 5 via CDN + vanilla JS + inline CSS, no build step). The page's `ENVIRONMENTS` object holds `local` (7 checks: 2 account-service, 1 api-gateway, 2 transaction-service, 1 statement-loader, 1 UI reachability) fully configured, and `dev`/`qa`/`uat`/`prod` as empty `configured: false` placeholders rendered as an explicit "not configured" message rather than empty cards.
- **`.claude/skills/healthcheck-maintain/SKILL.md`**: judgment skill (no deterministic script of its own) that reads/edits `ENVIRONMENTS.local.checks` in `healthcheck.html` when a matching file changes.
- **Real `PostToolUse` hook** (unlike JIRA_9's description-only `diagram-maintain`): `.claude/settings.json` registers a `PostToolUse` hook on `Edit|Write` running `.claude/skills/healthcheck-maintain/check-api-change.sh`. That script reads the tool call's `file_path` from stdin JSON and, if it matches `*/src/main/java/*/controller/*.java`, `*/statement-loader/controller/*.py`, or `*/finance-manager-ui/src/service/*.service.ts`, emits `hookSpecificOutput.additionalContext` telling Claude Code to run the skill. Verified three ways: (1) piped synthetic stdin JSON for all 3 matching patterns plus one non-matching path - correct fire/no-fire in each case; (2) `jq -e` schema validation against `.claude/settings.json`; (3) a live sentinel-file proof - temporarily prefixed the hook command with a sentinel write, made a real trivial `Edit` to `AccountController.java`, confirmed the sentinel file was written, then reverted both the sentinel prefix and the trivial edit (confirmed via `git diff` that only the intended healthcheck change remains in that file).
- Root `CLAUDE.md`, root `README.md`, `docs/README_TEMPLATE.md`, and `docs/SKILLS.md` updated to list the new `observability` module and `healthcheck-maintain` skill, per the repo's standing "keep the catalog in sync" rules.

### Full live verification (after explicit user go-ahead to restart local services)
The local stack was already running under the user's own dev session with the old healthcheck code. After flagging this and getting explicit confirmation to restart, the following was done and verified:
1. Stopped the 4 backend processes (`account-service`, `api-gateway`, `transaction-service`, `statement-loader`; left the UI on port 8100 untouched since it wasn't changed) and restarted them from the new code.
2. **Found and fixed a second real, pre-existing bug while restarting `statement-loader`**: `statement-loader/resources/env_variables/.env.local`'s `STATEMENT_LOADER_POSTGRES_PASSWORD` was blank - the same class of bug `jira/JIRA_4.md` fixed for `api-gateway`/`transaction-service`, but `statement-loader` was missed at the time. Fixed by setting it to `admin` (the documented local default), matching those two services' `application-local.properties`.
3. Also discovered Docker Desktop itself (not just the Postgres container) wasn't running - the previously-running `statement-loader` process had been started earlier while Postgres was reachable and had kept running since, masking this. Started Docker Desktop (`open -a Docker`); the `finance-manager-postgres` container came back up automatically.
4. Verified all 6 backend healthcheck endpoints live via `curl`: every one now returns `{"status":"OK"}` / HTTP 200. Re-verified CORS with the new code: `account-service` still returns `Access-Control-Allow-Origin: *`; `statement-loader`'s now-fixed healthcheck route returns `Access-Control-Allow-Origin: null` (flask-cors reflects the request's `Origin`, which is literally `"null"` for a `file://` page) - both satisfy a `file://` page's CORS check.
5. Used the `claude-in-chrome` skill to actually load and interact with `healthcheck.html` in a real browser (via a throwaway local `python -m http.server`, since the browser-automation tool blocks direct `file://` navigation - the `file://`-specific CORS behavior itself was independently confirmed via `curl` in step 4, not through this browser session) and confirmed: all 7 local checks show **UP** with IST timestamps, "7 up / 0 down" summary badge, no console errors, the Dev/QA/UAT/Prod tabs correctly show a "not configured" placeholder, and clicking "Refresh now" re-ran all checks and advanced the timestamp. Cleaned up the tab and the throwaway server afterward.

### Follow-ups for the user
- The `finance-manager-ui` check is a best-effort reachability probe only (see `observability/README.md` Gotchas) - it cannot distinguish a real 200 from a 404 due to CORS; worth keeping in mind if the UI ever returns a non-2xx for `/`.
- `statement-loader`'s local Postgres password fix (this ticket, item 2 above) and JIRA_4's original fix for the other two services are now consistent - worth a quick look if a `dev`/`qa`/etc. `.env.<profile>` file for `statement-loader` has the same blank-password gap when those environments are eventually filled in.

## Changelog
- 2026-09-10: created from one-liner (Draft)
- 2026-09-10: audited actual healthcheck endpoint code (not just READMEs) across all 4 backend services - confirmed none currently return "OK" and all 5 use different hardcoded strings, 4 of which are asserted by existing unit tests; confirmed finance-manager-ui has no dedicated health endpoint at all. Folded into Summary/Scope/a new "Current state" section; narrowed Open questions accordingly (In Refinement)
- 2026-09-10: resolved via AskUserQuestion - `observability` is an in-monorepo module (not a separate repo), healthcheck responses become JSON `{"status":"OK"}`, the page is opened directly as a `file://` page (existing permissive `@CrossOrigin`/`@cross_origin()` config should already tolerate this, to be verified during implementation), and the hook auto-runs the skill; confirmed hook file patterns and a 60-second polling interval. Folded into Summary/Scope/Requirements/Affected modules/Acceptance criteria
- 2026-09-10: user confirmed the spec - moving to implementation (Ready for Dev -> In Progress)
- 2026-09-10: implemented healthcheck response standardization (all 5 backend endpoints + 4 updated tests + 1 new test) with full test suites green; built the `observability` module and `healthcheck.html`; added the `healthcheck-maintain` skill with a real, live-verified `PostToolUse` hook; fixed a real found bug (statement-loader healthcheck missing CORS); updated all cross-referencing docs.
- 2026-09-10: user confirmed restarting the local stack for full verification; restarted all 4 backend services, found and fixed a second real bug (statement-loader's blank local Postgres password, same class as JIRA_4), started Docker Desktop/Postgres, verified all 6 healthcheck endpoints live via curl, and used the claude-in-chrome skill to confirm healthcheck.html renders correctly (7/7 up, IST timestamps, working refresh, correct placeholder environments) against the live restarted stack. Marking **Done**.
