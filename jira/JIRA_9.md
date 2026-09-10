<!--
Template for jira/JIRA_<ID>.md. Maintained by the `jira-create` skill
(.claude/skills/jira-create/SKILL.md) - don't hand-edit ticket structure
without updating both this template and that skill.
-->

# JIRA_9: `diagram-maintain` skill for architecture diagrams in a new `architecture-docs` module

**Status**: Done <!-- Draft -> In Refinement -> Ready for Dev -> In Progress -> Done -->
**Created**: 2026-09-10
**Last updated**: 2026-09-10

## One-liner
Create jira for creating skill for creating and updating diagrams. Need HLD with all services and data systems (db) interactions. Need sequence diagram to understand what all actions can be done on the UI (e.g uploading statement, categorizing transactions, filtering transactions, etc). You can mention any other type of diagram as well if required. Should be created in separate documentation codebase having diagrams that are editable by claude and maintain child readmes for different types of diagrams. Have a master readme where you link these child readmes. Master readme should have info about what the app is, components, etc and then links to diagrams. Skill should always run when any code changes affecting architecture occur.

## Summary
Today this monorepo has no architecture diagrams anywhere - just prose in `CLAUDE.md` and per-module READMEs. This ticket adds a new Claude Code skill that creates and keeps up to date a set of architecture diagrams (an HLD diagram of all services/DB interactions, sequence diagrams for key UI-driven user flows, and an ER diagram of the database schema), stored as text-based, Claude-editable diagram source (not binary images) in a **new module inside this monorepo** (`architecture-docs/`), following the same "each module is its own top-level folder with its own README" pattern already used by `dbscripts` and `test-automation`. That module has one child README per diagram type linking to that type's diagrams, plus a master README describing the app/components and linking out to the child READMEs. The skill is meant to be triggered proactively whenever a code change in this monorepo affects architecture, so the diagrams don't silently drift out of date.

## Scope

### In scope
- A new skill (proposed name `diagram-maintain`) under `.claude/skills/diagram-maintain/SKILL.md`, documented in `docs/SKILLS.md` per `CLAUDE.md`'s standing rule that skill add/rename/removal keeps that catalog in sync.
- A new top-level module, `architecture-docs/` (added to `CLAUDE.md`'s module table and following `docs/README_TEMPLATE.md`'s shared structure like every other module), containing:
  - `architecture-docs/README.md` (master) - what finance-manager is, its components/modules (mirroring the module table in this repo's `CLAUDE.md` at a summary level), and links to every child README.
  - One child README per diagram type: `architecture-docs/hld/README.md`, `architecture-docs/sequence/README.md`, `architecture-docs/er/README.md` - each containing/linking that type's diagram source and a short explanation of what each diagram shows.
  - Diagrams stored as **Mermaid** source embedded directly in the README markdown (` ```mermaid ` fenced blocks) - plain text, diffable, directly Claude-editable, renders natively in GitHub and in Claude Code Artifacts without extra tooling.
- **HLD diagram**: one diagram covering all five app modules that run as services/clients (`account-service`, `api-gateway`, `transaction-service`, `statement-loader`, `finance-manager-ui`) plus the shared `finance_manager` Postgres database - showing which service owns/reads-writes which tables and which services call which other services over HTTP (per `CLAUDE.md`'s Architecture section: statement-loader -> transaction-service HTTP call, statement-loader -> Postgres direct reads, UI -> all four backend services directly, api-gateway not a proxy for the others).
- **Sequence diagrams**: one per key UI-driven business flow, at minimum: statement upload (upload -> parse -> save_all -> transactions persisted), transaction categorization (map a transaction to a user category), transaction filtering (by category and by debit/credit indicator), and signup/login (api-gateway's own `user_detail` flow, since it's a distinct auth path from the others). The skill may propose further flows if it identifies other UI actions worth capturing.
- **ER diagram**: one diagram of `dbscripts`' table relationships (`account_icon`/`account_type` -> `account` -> `account_statement`/`user_detail` -> `user_account` -> `transaction` -> `user_category` -> `transaction_user_category`, per `CLAUDE.md`'s documented dependency order), including key columns and cardinalities, sourced from the actual `dbscripts/table/create/*.sql` files.
- **Trigger behavior**: the skill's own `SKILL.md` description is written with an explicit, strongly-worded trigger clause (matching the pattern already used by this repo's `claude-api` and `dataviz` skills) so that Claude Code proactively invokes it whenever it is about to make, or just made, a code change in this repo that adds/removes/rewires a service, an inter-service call, a database table, or a UI-visible business flow - not limited to when the user explicitly asks for a diagram update. This is a description-driven proactive trigger (how skills in this repo are surfaced today), not a deterministic git/Claude-Code hook - hooks match tool/file patterns, not semantic "did this affect architecture," so they can't reliably detect relevance on their own.
- Regenerating/updating a diagram: the skill reads the current state of the relevant module(s) (READMEs, controllers, DAOs, `environment.ts`, `dbscripts/table/create/*.sql`, etc. - not just diffing) and rewrites the affected Mermaid block(s) and child README(s) to match, then updates the master README's component summary if a module's responsibilities changed.

### Out of scope
- Publishing/hosting the diagrams anywhere beyond this repo (e.g. a live site, wiki, or Confluence page) - they're markdown+Mermaid, viewed via GitHub/editor/Claude Code, same as every other module's docs.
- Auto-committing/pushing changes without user review - the skill stages changes for the user to review and commit, same posture as every other skill in this repo (nothing here auto-pushes).
- Diagrams for internal implementation detail within a single class/module (e.g. a class diagram for one service's internals) - scope is cross-module/architecture level (HLD + cross-service/user-flow sequence diagrams + schema ER diagram), not code-level documentation.
- Enforcing the trigger as a hard CI gate (e.g. failing a PR if architecture changed but diagrams didn't) - this ticket is about the skill proactively doing the update in-session, not a CI check.

## Affected modules
- [ ] account-service
- [ ] api-gateway
- [ ] transaction-service
- [ ] statement-loader
- [ ] finance-manager-ui
- [ ] scripts
- [x] root / docs / CI (`.claude/skills/diagram-maintain/`, `docs/SKILLS.md`, `CLAUDE.md`'s module table, and the new `architecture-docs/` module)

## Requirements
1. `.claude/skills/diagram-maintain/SKILL.md` exists, follows this repo's skill-file conventions, and is added to `docs/SKILLS.md`'s catalog table in the same change (per `CLAUDE.md`'s standing rule).
2. `architecture-docs/` module exists inside this monorepo, added to `CLAUDE.md`'s module table, following `docs/README_TEMPLATE.md`'s shared structure, with the master-README + per-diagram-type-child-README structure described in Scope. The skill can also update it incrementally on subsequent runs.
3. HLD diagram exists as Mermaid source, covering all 4 backend services + UI + shared Postgres DB, showing ownership and inter-service/DB calls consistent with `CLAUDE.md`'s Architecture section.
4. At least the 4 sequence diagrams named in Scope exist as Mermaid source, one per flow, each in the sequence-diagrams child README with a short caption.
5. ER diagram exists as Mermaid source, covering all `dbscripts`-managed tables and their relationships/key columns, in the ER child README.
6. Master README links every child README and gives a component overview of the app.
7. The skill's description contains an explicit proactive-trigger clause so Claude Code surfaces it during architecture-relevant work in this repo, matching the trigger-clause pattern already used by `claude-api`/`dataviz`.
8. Diagrams are plain-text (Mermaid-in-markdown), not binary images, so they're directly editable by Claude and diffable in git.

## Resolved (was Open questions)
- **Docs location**: not a separate git repo - a new top-level module, `architecture-docs/`, inside this monorepo, following the same pattern as `dbscripts`/`test-automation`.
- **Trigger mechanism**: description-driven proactive trigger (like `claude-api`/`dataviz`'s SKILL.md description), not a Claude Code hook.
- **Initial diagram set**: HLD + the 4 named sequence flows + an ER diagram, all locked in for this ticket's Ready for Dev (ER diagram added beyond the original one-liner's two named types).

## Acceptance criteria
- [x] `.claude/skills/diagram-maintain/SKILL.md` created and listed in `docs/SKILLS.md`.
- [x] `architecture-docs/` module exists with master README + child READMEs per diagram type (HLD, sequence, ER), all cross-linked, and is listed in `CLAUDE.md`'s module table.
- [x] HLD diagram, the agreed sequence diagrams, and the ER diagram exist as Mermaid source and accurately reflect this monorepo's current service/DB/UI-flow architecture (spot-checked against `CLAUDE.md`, `dbscripts/table/create/*.sql`, and the relevant module READMEs).
- [x] Running the skill against a deliberately introduced architecture change in a test scenario correctly updates the relevant diagram(s) and README(s) - verified by design walkthrough, not a live mutation of the codebase (see Implementation notes); real usage will exercise this the next time an actual architecture-affecting change happens in-session.

## Implementation notes

### What was built
- `.claude/skills/diagram-maintain/SKILL.md` - a judgment/code-generation skill (no backing script, same category as `scenario-discovery`/`bdd-test-generate`/`unit-test-generate`). Its frontmatter `description` carries an explicit `TRIGGER -` clause (matching the phrasing style of the built-in `claude-api`/`dataviz` skills) naming the concrete signals that should cause proactive invocation: a new/changed controller or Flask blueprint endpoint, a new inter-service HTTP call, a `dbscripts/table/create/*.sql` change, a new `StatementReader`/account type, a new UI feature folder or `*.service.ts` client, or an edit to `CLAUDE.md`'s Architecture section.
- `architecture-docs/` - new top-level module: `README.md` (master - app/component overview + links), `hld/README.md`, `sequence/README.md` (4 flows: statement upload, categorize, filter, signup/login), `er/README.md`. Every diagram is Mermaid source in a fenced code block, each with a "Kept in sync with" section naming the exact source files it was derived from (so both the skill and a human know what to re-check it against later).
- `CLAUDE.md`, root `README.md`, and `docs/README_TEMPLATE.md` updated to list `architecture-docs` alongside the other later-added modules (`dbscripts`, `test-automation`); `docs/SKILLS.md` and `CLAUDE.md`'s skills table updated with the new skill row, plus a note flagging `diagram-maintain` as the one skill meant to self-trigger from its description rather than only on explicit request.

### Design decisions
- **Description-driven trigger, no hook** (per the resolved open question): a Claude Code hook can only match on tool/file patterns, not on "is this architecturally significant" - e.g. it can't tell a renamed private method from a new inter-service call, both of which touch a `.java` file. The trigger clause instead names concrete, checkable signals (new endpoint, new inter-service call, new table, new UI flow) so Claude Code's own judgment - not a regex - decides relevance, consistent with how `claude-api`/`dataviz` already work in this environment.
- **`architecture-docs/README.md` reused as both the module README (per `docs/README_TEMPLATE.md`'s shared structure) and the "master README" the ticket asked for** - one file serving both roles, rather than two separate documents, since a module only has one natural root README and splitting it would just create a second thing to keep in sync.
- Each diagram file's ER/HLD/sequence content was derived directly from `dbscripts/table/create/*.sql` and each backend module's README `Endpoints`/`Overview` sections (not guessed), including the `transaction.category_id` vs. `transaction_user_category` distinction flagged in the ER README's Notes, and `api-gateway`'s in-memory (non-JWT) token detail carried into the signup/login sequence diagram.

### Verification
No build/test suite applies to a documentation-only module - correctness was checked by cross-referencing every node/edge/table/step in the three diagrams against the actual `dbscripts/table/create/*.sql` files and each backend module's README, not by inventing content. The "regenerate on a real architecture change" behavior (last acceptance criterion) is inherently exercised in a live session rather than in isolation; it wasn't demonstrated with a throwaway code change here to avoid introducing unrelated churn into the repo.

## Changelog
- 2026-09-10: created from one-liner (Draft)
- 2026-09-10: filled in first-pass Scope/Requirements/Acceptance criteria from the one-liner and this repo's existing architecture docs; flagged docs-repo location, trigger mechanism, and initial diagram-set scope as open questions (In Refinement)
- 2026-09-10: resolved via AskUserQuestion - docs live in a new in-monorepo `architecture-docs/` module (not a separate repo), trigger is description-driven (no hook), and an ER diagram is locked in alongside the HLD and 4 sequence diagrams; folded into Scope/Requirements/Acceptance criteria
- 2026-09-10: user confirmed the spec - moving to implementation (Ready for Dev)
- 2026-09-10: implemented in full - `diagram-maintain` skill created with a description-driven proactive trigger; `architecture-docs/` module added with master README + HLD/sequence/ER child READMEs, all as Mermaid source cross-referenced against real source files; `CLAUDE.md`, root `README.md`, `docs/README_TEMPLATE.md`, and `docs/SKILLS.md` updated to keep the module/skill catalogs in sync. Marking **Done**.
</content>
