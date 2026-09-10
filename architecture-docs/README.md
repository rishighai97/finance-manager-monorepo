# architecture-docs

Architecture diagrams for finance-manager - not a runnable service.

## Overview
`finance-manager` is a personal finance tracker: users link bank/broker accounts, upload account statements to auto-import transactions, and categorize/filter those transactions. The app is a monorepo of five runtime components plus a shared Postgres database:

| Component | Stack | Purpose |
|---|---|---|
| [`finance-manager-ui`](../finance-manager-ui/README.md) | Angular 19 + Ionic 8 (Capacitor for iOS) | Mobile/web client; calls the four backend services directly, no proxy layer |
| [`api-gateway`](../api-gateway/README.md) | Java 21, Spring Boot | Signup/login/logout only - owns `user_detail` |
| [`account-service`](../account-service/README.md) | Java 21, Spring Boot | Bank/broker accounts (`account`) and a user's linkage to them (`user_account`) |
| [`transaction-service`](../transaction-service/README.md) | Java 21, Spring Boot | Transactions (`transaction`) and user-defined categories (`user_category`, `transaction_user_category`) |
| [`statement-loader`](../statement-loader/README.md) | Python 3, Flask | Parses uploaded bank/broker statements, loads transactions via `transaction-service` |
| Postgres (`finance_manager`) | — | Shared database; schema/sample data versioned in [`dbscripts`](../dbscripts/README.md) |

Full detail on each lives in that module's own README (linked above and from the repo root `CLAUDE.md`). This module doesn't run any of that - it's a set of diagrams describing how the pieces above relate, kept up to date by the `diagram-maintain` skill (`.claude/skills/diagram-maintain/SKILL.md`) whenever those relationships change elsewhere in the repo.

## Diagrams
- [High-level design](hld/README.md) - every service, the shared database, and who calls/owns what.
- [Sequence diagrams](sequence/README.md) - step-by-step flow for key UI-driven actions (statement upload, categorization, filtering, signup/login).
- [Entity-relationship diagram](er/README.md) - the shared `finance_manager` schema's tables and relationships.

## Tech stack
Plain markdown with diagrams as embedded [Mermaid](https://mermaid.js.org/) source (` ```mermaid ` fenced code blocks) - no build step, no binary image files. Renders natively on GitHub and in Claude Code Artifacts, is directly readable/editable by Claude, and diffs like any other text file in git.

## Local setup & run
Nothing to install or run. View a diagram by opening its README on GitHub, in any Mermaid-aware editor, or by asking Claude Code to render it as an Artifact.

## Key modules
- `hld/README.md` - the high-level design diagram and its legend.
- `sequence/README.md` - one sequence diagram per key UI-driven flow.
- `er/README.md` - the database entity-relationship diagram.

## Testing
No automated tests - this is static documentation, not application code. Correctness is maintained by the `diagram-maintain` skill re-deriving each diagram from the actual current source (controllers/blueprints, DAOs, `dbscripts/table/create/*.sql`, `environment.ts`) each time it runs, rather than by hand-editing diagrams that can drift from reality.

## Gotchas
- These diagrams are maintained by the `diagram-maintain` skill, which is meant to trigger proactively whenever a change elsewhere in the repo affects architecture (a new/changed endpoint, inter-service call, database table, or UI-visible flow) - see that skill's `SKILL.md` for exactly what it watches for. A hand-edit here can be overwritten the next time the skill regenerates the diagram(s) it covers.
</content>
