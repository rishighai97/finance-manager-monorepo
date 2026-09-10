---
name: healthcheck-maintain
description: Keeps observability/healthcheck.html's list of monitored endpoints (the local ENVIRONMENTS.local.checks array) in sync with the real API surface - account-service, api-gateway, transaction-service, statement-loader healthchecks, plus the finance-manager-ui reachability check. Invoked automatically by a PostToolUse hook (see .claude/settings.json) whenever a controller/blueprint/service-client file changes, and should also be run whenever explicitly asked to update/review the healthcheck dashboard's endpoint list.
---

# healthcheck-maintain

Keeps `observability/healthcheck.html` accurate as backend/UI endpoints change. Unlike `diagram-maintain` (JIRA_9, which relies purely on its description to trigger proactively), this skill is backed by an actual hook - a `PostToolUse` hook in `.claude/settings.json` fires after an `Edit`/`Write` to a matching file and instructs Claude Code to run this skill, so it isn't only opportunistic.

## When this runs

1. **Via the hook** - after editing any of:
   - `*/src/main/java/**/controller/*.java` (the three Java services)
   - `statement-loader/controller/*.py`
   - `finance-manager-ui/src/service/*.service.ts`
   The hook's output tells you to run this skill against the change you just made - do so before ending your turn, don't just note it and move on.
2. **Explicitly asked** - the user asks to update/review the healthcheck dashboard.

## Procedure

1. **Read `observability/healthcheck.html`'s `ENVIRONMENTS` object first** - specifically `ENVIRONMENTS.local.checks`, the array this skill maintains. Don't assume it still matches what this SKILL.md describes; a prior run may have added/removed checks.
2. **Figure out what changed** in the file(s) that triggered this:
   - A new `@GetMapping`/`@PostMapping`/etc. healthcheck-style endpoint added to a controller, or a new Flask health route -> add a new entry to `checks` (`{ service, name, url, kind: "json" }` for a real backend healthcheck that returns `{"status":"OK"}`).
   - An existing healthcheck endpoint's path changed (`@RequestMapping`/`url_prefix`/route rule) -> update that entry's `url` to match.
   - A healthcheck endpoint removed -> remove its entry.
   - A change to `finance-manager-ui/src/service/*.service.ts` that implies the UI's reachable base URL changed (rare - the UI check just hits `/`) -> update the `finance-manager-ui` entry's `url` if the port/base path actually changed.
   - A change that isn't actually a healthcheck-relevant endpoint (e.g. a new business endpoint like `/account/v1/fetch_all`) -> no dashboard change needed. Not every controller edit needs a new `checks` entry - only ones that add/move/remove a `/healthcheck`-style route.
3. **Verify the endpoint's actual current behavior** before adding it - read the controller/blueprint method body to confirm it returns `{"status":"OK"}` JSON (the standardized contract from JIRA_10) and use `kind: "json"`. If a new healthcheck endpoint *doesn't* follow that contract yet, fix the endpoint to match it in the same change (don't add a `kind` that special-cases a different contract - keep the dashboard's check logic uniform) - same "ensure all healthcheck APIs are consistent" requirement JIRA_10 established.
4. **Edit only `ENVIRONMENTS.local.checks`** unless the user has specifically asked to fill in `dev`/`qa`/`uat`/`prod` (those stay `configured: false` placeholders otherwise, per JIRA_10's scope).
5. **Don't invent endpoints that don't exist.** Every `checks` entry must be traceable to a real route you actually read - same discipline as `diagram-maintain`/`scenario-discovery`.
6. **Stage, don't auto-commit** - leave the change for the user to review, same as every other skill in this repo.

## Keeping this doc updated

See `docs/SKILLS.md` for the full skill catalog and `observability/README.md` for what this module contains. If the hook's watched file patterns change, update both `.claude/settings.json` and this file's frontmatter `description` together.
</content>
