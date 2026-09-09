---
name: scenario-discovery
description: Inspect the backend services' actual API surface (account-service, api-gateway, transaction-service, transaction-service's category endpoints, statement-loader controllers/blueprints) and produce/update a catalog of business-level test scenarios - not code, not implementation detail - in test-automation/README.md's catalog table. Use when asked to find/document what user scenarios exist to test, to refresh the catalog after an endpoint changes, or before running bdd-test-generate on a new scenario that isn't catalogued yet.
---

# scenario-discovery

Reads what the backend services can actually do, and writes down the business scenarios that implies - in plain language, not code. This is a documentation/analysis skill: it never writes test code or touches `dbscripts/table/` etc. Its only output is rows in `test-automation/README.md`'s catalog table (see that file for the current state).

## Procedure

1. **Read the real endpoint surface**, not just each module's README's Endpoints table (useful as a starting map, but verify against the actual controller/blueprint source since it's the source of truth):
   - `account-service/src/main/java/.../controller/*.java` (`AccountController`, `UserAccountController`)
   - `api-gateway/src/main/java/.../controller/*.java` (`AuthController`)
   - `transaction-service/src/main/java/.../controller/*.java` (`TransactionController`, `CategoryController`)
   - `statement-loader/controller/statement_upload_controller.py`
2. **For each endpoint, ask**: what business capability does this give a user, not what does this method do technically? "POST /category/v1/save_all accepts a list" becomes two distinct scenarios - "bulk-create several categories at once" and "create a single category" (a one-item list) - because those are two different things a user actually does, even though it's one endpoint. Cross-endpoint capabilities (e.g. upload a statement, then see its transactions show up via fetch) become their own `e2e_flow` scenario spanning multiple services.
3. **Categorize** each scenario using this repo's fixed category list (don't invent new ones without updating this skill and `test-automation/README.md`'s legend together): `account`, `auth`, `transaction`, `category`, `statement_upload`, `e2e_flow`.
4. **Check `test-automation/README.md`'s existing catalog table** for a scenario that already covers the same capability (by title, not by exact wording) before adding a new row - this is meant to converge on one row per distinct scenario, not accumulate near-duplicates as endpoints get re-scanned over time.
5. **Add one `backend` row per scenario** (this repo's tests are backend-only - see JIRA_6's Changelog for why the earlier UI-layer policy was dropped), with `Status: Planned` until `bdd-test-generate` actually produces a passing test for it (that skill flips the status to `Implemented`, or `Ongoing` if a fix was applied but not yet re-verified). Columns: `Input source` (always `backend`), `Title`, `Category`, `Status`.
6. **Don't invent scenarios the API can't actually do** - if there's no delete-transaction endpoint, there's no "delete a transaction" scenario. Ground every row in a real endpoint (or a real cross-endpoint flow) you actually read.

## What "business-level" means here

Bad (too technical): "POST /user_account/v1/save returns 200". Good: "Link an existing bank/broker account to a user, giving it a display name." The row's `Title` should read like something out of a product spec, not an API test assertion - the actual assertion detail belongs in the generated test itself (`bdd-test-generate`'s job), not the catalog row.

## Keeping this doc updated

This is one of `test-automation`'s two skills - see `docs/SKILLS.md` for the full skill catalog, `test-automation/README.md` for what it has produced so far, and `bdd-test-generate`'s `SKILL.md` for what happens to a catalog row next.
