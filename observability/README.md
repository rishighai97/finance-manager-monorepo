# observability

Observability tooling for finance-manager - not a runnable service.

## Overview
Houses finance-manager's observability setup, starting with a live healthcheck dashboard. Every backend service (`account-service`, `api-gateway`, `transaction-service`, `statement-loader`) and `finance-manager-ui` gets polled from one page so you can see at a glance whether the whole stack is up, without hitting each service's healthcheck endpoint by hand. The `healthcheck-maintain` skill (`.claude/skills/healthcheck-maintain/SKILL.md`) keeps the dashboard's endpoint list in sync as APIs change elsewhere in the repo, via a hook - see that skill for details.

## Tech stack
A single static HTML file: Bootstrap 5 (CDN) + vanilla JS + inline CSS. No build step, no framework, no backend of its own.

## Local setup & run
Open `healthcheck.html` directly in a browser (double-click it, or `open observability/healthcheck.html` on macOS) - no server needed. It calls each backend service's real healthcheck endpoint and the UI's base URL directly from the browser via `fetch()`.

Point it at a running local stack (see the `local-run` skill) - it works with only some services up too, it'll just show those as down.

## Key modules
- `healthcheck.html` - the dashboard: environment selector (`local`/`dev`/`qa`/`uat`/`prod`), per-service healthcheck cards with pass/fail + an IST timestamp, a manual "Refresh now" button, and a 60-second auto-refresh.

## Testing
No automated tests - this is a static page with no build step. Correctness is verified by opening it against a live local stack and confirming each card reflects that service's actual state (stop a service locally and confirm its card flips to down).

## Gotchas
- Only `local` has real endpoints configured today - `dev`/`qa`/`uat`/`prod` exist as placeholder sections in the page (clearly marked as not yet configured) since those environments' URLs aren't stabilized yet.
- The `finance-manager-ui` check is a plain reachability probe (`fetch` in `no-cors` mode against its base URL), not a real healthcheck - the UI has no dedicated health endpoint and, unlike the backend services, doesn't send CORS headers permitting a `file://` page to read its response. A resolved fetch is treated as "up"; a thrown network error is treated as "down." This can't distinguish a 200 from a 404/500 the way the backend checks can.
- Every backend healthcheck endpoint now returns `{"status":"OK"}` as JSON (see `jira/JIRA_10.md`) - if a future endpoint doesn't match that contract, `healthcheck.html`'s check will report it as down even if the HTTP call itself succeeded.
- This page is meant to be opened as a local `file://` page. It relies on the backend services' existing permissive `@CrossOrigin`/`@cross_origin()` CORS config to be readable from that origin - if a service's CORS config is ever tightened to a specific origin list, `file://`'s `null` origin needs to stay included (or the page needs to move behind a real static server) for these checks to keep working.
