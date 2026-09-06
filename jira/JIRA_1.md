# JIRA_1: Update documentation for all modules

**Status**: Done
**Created**: 2026-09-06
**Last updated**: 2026-09-06

## One-liner
update documentation for all modules

## Summary
The per-module `README.md` files are currently inconsistent and mostly thin: `api-gateway/README.md` is just a docker log snippet, `account-service`/`transaction-service` READMEs only list CI secrets, `statement-loader/README.md` has a stray unfinished DB-schema fragment, and `scripts/README.md` is a one-liner. `finance-manager-ui/README.md` is the most complete (env config + build/run) but doesn't cover architecture. Separately, the root `CLAUDE.md` was written before the monorepo migration and still describes the old "5 independent git repos" layout, the old per-repo CI workflows, and doesn't mention `jira/` or the skills being built now - it needs a refresh, not just the module docs.

This ticket also defines a reusable README template (`docs/README_TEMPLATE.md`) so the docs-consistency skill (next ticket) has something concrete to check against, and includes accurate endpoint tables for the 4 backend modules.

## Scope

### In scope
- Define `docs/README_TEMPLATE.md`: the shared section structure every module README must follow.
- Rewrite all 6 module READMEs to that template, sourced from actual current code (not copied from old text).
- For `account-service`, `api-gateway`, `transaction-service`, `statement-loader`: include a literal endpoint table (method, path, one-line purpose) matching current controllers/blueprint routes.
- Refresh root `CLAUDE.md` for the monorepo structure, current per-module + `pr-checks` CI workflows, and the `jira/` + skills workflow.
- Spot-check root `README.md`'s module table is still accurate; update if this pass surfaces anything it's missing.

### Out of scope
- Building the `docs-consistency` enforcement skill/agent itself (that's the next ticket) - this ticket is the one-time pass that gets docs *to* a good baseline; the next ticket keeps them there.
- The `local-run` skill (separate ticket).
- Any API contract changes, code changes, or new features - this is a documentation-only ticket.

## Affected modules
- [x] account-service
- [x] api-gateway
- [x] transaction-service
- [x] statement-loader
- [x] finance-manager-ui
- [x] scripts
- [x] root / docs / CI (`README.md`, `CLAUDE.md`, new `docs/README_TEMPLATE.md`)

## Requirements
1. Create `docs/README_TEMPLATE.md` covering, at minimum: overview/purpose, tech stack, local setup & run, endpoints or key modules (with a literal endpoint table for the 4 backend services), how to run tests, and any module-specific gotchas.
2. Apply that template to all 6 modules, verified against actual current code (Spring `@RequestMapping`/`@GetMapping` etc. in each controller, Flask blueprint routes in statement-loader, actual Angular feature folders/services in the UI).
3. Refresh root `CLAUDE.md`: monorepo layout (not 5 separate repos), the `account-service-deploy.yml`/`api-gateway-deploy.yml`/etc. + `pr-checks.yml` CI setup, and the `jira/` spec-driven workflow with its `jira-create` skill.
4. Update root `README.md`'s module table only if this pass surfaces a real gap (e.g. a module's description no longer matches reality) - not a mandatory rewrite.

## Acceptance criteria
- [x] `docs/README_TEMPLATE.md` exists and defines the shared section structure described in Requirement 1.
- [x] Each of `account-service`, `api-gateway`, `transaction-service`, `statement-loader`, `finance-manager-ui`, `scripts` has a `README.md` matching that template.
- [x] `account-service`, `api-gateway`, `transaction-service`, `statement-loader` READMEs include endpoint tables that are accurate against current controller/blueprint code (spot-checkable, not aspirational).
- [x] Root `CLAUDE.md` accurately describes the monorepo structure, current CI workflows, and the `jira/` + skills workflow - no references to the old 5-repo layout remain.
- [x] Root `README.md` module table reviewed and confirmed (or corrected) against the rewritten module READMEs.

## Implementation notes
- Verified endpoint tables directly against controller/blueprint source (`AccountController`, `UserAccountController`, `AuthController`, `TransactionController`, `CategoryController`, `statement_upload_controller.py`) rather than trusting old docs.
- Corrected two real architectural inaccuracies found in the old `CLAUDE.md` while verifying against source:
  1. `api-gateway` does **not** call `account-service` - it reads/writes `user_detail` directly via JDBC (old doc claimed it talked to `account-service` for user/account data).
  2. `statement-loader` calls `transaction-service` over HTTP (`TransactionApiDao` -> `/transaction/v1/save_all`) to write transactions - it does **not** write transactions directly to Postgres, though it does read account/`account_statement` metadata directly (old doc claimed transactions were written directly to Postgres).
- Also found and documented: `api-gateway` auth tokens are stored in-memory (not real JWTs, don't survive restart) - flagged as a Gotcha and a known pre-customer-facing gap, not fixed here (out of scope).
- Root README's `api-gateway` description and its "pr-gate check is required to merge" claim were both inaccurate against current reality; corrected as part of the "spot-check root README" requirement.
- `scripts/README.md` also flags `scripts/claude/claude_get_context.py`/`claude_patch.py` as legacy pre-Claude-Code tooling (hardcoded to a stale path) - left in place, noted as a future cleanup candidate.
- `statement-loader/README.md` documents the `--app-profile` working-directory requirement precisely (must run from repo root) after tracing `utils/env_utils.py`.

## Changelog
- 2026-09-06: created from one-liner (Draft)
- 2026-09-06: refined after clarifying questions - endpoint tables required for backend services, CLAUDE.md refresh included in scope, README template to be saved as `docs/README_TEMPLATE.md` (Status -> In Refinement)
- 2026-09-06: user confirmed spec (Status -> Ready for Dev), implementation started (Status -> In Progress)
- 2026-09-06: implementation complete - all acceptance criteria met, 2 real architectural inaccuracies in old docs corrected (Status -> Done)
