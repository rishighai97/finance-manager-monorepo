---
name: diagram-maintain
description: Creates and updates finance-manager's architecture diagrams - a high-level design (HLD) diagram of all services/database interactions, sequence diagrams of key UI-driven flows (statement upload, categorization, filtering, signup/login), and an entity-relationship diagram of the shared Postgres schema - stored as Mermaid source under architecture-docs/. TRIGGER - invoke this proactively, not only when explicitly asked, immediately after (or while about to make) any code change in this repo that affects architecture: a new/changed/removed controller or Flask blueprint endpoint; a new inter-service HTTP call (e.g. statement-loader calling another service); a new/changed/removed dbscripts/table/create/*.sql file or column; a new StatementReader subclass or account type; a new finance-manager-ui feature folder or src/service/*.service.ts client; or an edit to CLAUDE.md's Architecture/Service responsibilities sections. Also use whenever asked to create, update, or review an architecture/HLD/sequence/ER diagram for this repo.
---

# diagram-maintain

Keeps `architecture-docs/` (this repo's architecture-diagram module) accurate as the codebase changes. Diagrams are plain-text Mermaid embedded in markdown - always re-derive them from the current state of the relevant source, never hand-tweak them to "look right" without checking they still match reality.

## When this runs

Two ways to end up here:
1. **Explicitly asked** - the user asks to create/update/review a diagram.
2. **Proactively, mid-session** - you (Claude Code) just made, or are about to make, a change in this repo that fits one of the triggers in this skill's frontmatter `description` (new/changed endpoint, inter-service call, DB table/column, or UI-visible business flow). Run this skill before ending your turn on that change, the same way you'd update a README for an endpoint you just added - don't wait for the user to notice the diagrams are stale.

If you're unsure whether a change is "architecture-affecting" enough to warrant this: it is if it would change an edge/node in the [HLD diagram](../../architecture-docs/hld/README.md), add/remove a step in a [sequence diagram](../../architecture-docs/sequence/README.md), or add/remove/rename a table or column in the [ER diagram](../../architecture-docs/er/README.md). Purely internal refactors (renaming a private method, reformatting) are not.

## Procedure

1. **Read `architecture-docs/README.md` first** to see the current module/diagram inventory - don't assume it's still exactly what this SKILL.md describes; a prior run may have added diagram types beyond the original three (HLD, sequence, ER).
2. **Identify which diagram(s) are affected** by the change at hand:
   - A new/changed backend endpoint, inter-service call, or module responsibility -> `architecture-docs/hld/README.md`.
   - A new/changed UI-driven business flow (a user action spanning one or more services) -> `architecture-docs/sequence/README.md` (add a new diagram for a genuinely new flow; update an existing one if a step in that flow changed).
   - A new/changed/removed table or column in `dbscripts/table/create/*.sql` -> `architecture-docs/er/README.md`.
   - A change to what finance-manager *is* or its component list (a new module/service added to the repo) -> `architecture-docs/README.md`'s component table.
3. **Re-derive from source, not from the old diagram.** Read the actual current state of whatever the diagram claims to represent before editing it:
   - HLD: root `CLAUDE.md`'s "Architecture" section, each affected module's README `Overview`/`Endpoints`.
   - Sequence: the affected module's `Endpoints` table/controller or blueprint, and `finance-manager-ui`'s `src/service/*.service.ts` for what the UI actually calls and in what order.
   - ER: `dbscripts/table/create/*.sql` directly (column names/types/FKs), and `dbscripts/script/setup.list` for dependency order.
4. **Edit the Mermaid block(s) and surrounding prose together** - a diagram's legend/notes text often needs the same update as the diagram itself (e.g. a new "owns" line, a new step description). Keep each diagram file's "Kept in sync with" section accurate - it names the source-of-truth files a future run (or a human) should re-check against.
5. **Update `architecture-docs/README.md`** if a module's responsibilities changed or a new module/diagram type was added - its component table and diagram links must stay accurate.
6. **Don't invent architecture that doesn't exist.** Every node, edge, step, or table in a diagram must be traceable to something real you actually read in this step - same discipline as `scenario-discovery`'s "don't invent scenarios the API can't do."
7. **Stage, don't auto-commit.** Leave the changes for the user to review and commit, same as every other skill in this repo - this skill never runs `git commit`/`git push` itself.

## Adding a new diagram type

If a change doesn't fit HLD/sequence/ER (e.g. a deployment/CI diagram, a component diagram), it's fine to add a new child folder (`architecture-docs/<type>/README.md`) following the same pattern - Mermaid source + legend + "Kept in sync with" - and link it from `architecture-docs/README.md`'s Diagrams list. Update this SKILL.md's description and `docs/SKILLS.md` if the new type becomes a standing part of what this skill maintains, not a one-off.

## Keeping this doc updated

This is a standalone skill (not part of `test-automation`'s pair) - see `docs/SKILLS.md` for the full skill catalog and `architecture-docs/README.md` for what it has produced so far.
