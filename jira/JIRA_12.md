# JIRA_12: `ux-explore` and `ux-apply` skills for a finance-manager-ui UX overhaul

**Status**: In Progress <!-- Draft -> In Refinement -> Ready for Dev -> In Progress -> Done -->
**Created**: 2026-09-11
**Last updated**: 2026-09-11 (round 3)

## One-liner
Create skills for a UX overhaul: `ux-explore` to generate comparable UX mockup options for existing finance-manager-ui pages so the user can decide on a direction, and `ux-apply` to implement the approved direction into the real UI.

## Summary
finance-manager-ui's existing pages (account-list, transaction-list, category-list, statement-uploader, auth, tabs) are getting a UX overhaul. Rather than redesigning directly in code, this introduces a two-phase, spec-driven workflow mirroring `jira-create`'s Draft -> Ready for Dev gate: `ux-explore` produces clickable HTML mockups (via the `design` skill's canvas) - first a handful of app-wide style directions on representative screens, then per-page layout variants within the chosen direction - and records decisions in `ux/` spec files; `ux-apply` reads an approved per-page spec and implements it into the real Angular/Ionic components, one page at a time.

## Scope

### In scope
- New skill `ux-explore`:
  - Round 1 (app-wide direction, run once or whenever revisiting the whole app's look): generate ~3 distinct style-direction mockups (typography, color palette, spacing/density, navigation pattern) applied to 1-2 representative screens, as clickable HTML artifacts with fake data via the `design` skill. User picks one direction (or asks for further iteration).
  - Chosen direction recorded in `ux/UX_DIRECTION.md` (shared style contract: color tokens, type scale, spacing rules, component style, nav pattern).
  - Round 2 (per page): for each existing page, generate 2-3 layout variants within the approved direction as further mockup artifacts, populated with real data pulled from the local Postgres via the `db-run` skill (not synthetic fake data) - requires a locally running/seeded DB (see `db-setup`) as a dependency of this round. Variants must also cover that page's empty, error, and loading states, not just the happy path. Each page gets its own `ux/UX_<page>.md` spec file, going through the same Draft -> Options Presented -> Selected -> Ready for Dev gate as `jira-create`, recording the chosen variant (including its empty/error/loading treatments), artifact link, and enough concrete detail (layout, key components, interaction notes) to implement from.
- New skill `ux-apply`:
  - Takes one `ux/UX_<page>.md` marked Ready for Dev and implements it into the real Angular/Ionic components for that page in `finance-manager-ui`, including the happy-path, empty, error, and loading states described in the spec.
  - Reuses Ionic's component library rather than inventing new primitives per page.
  - Leaves the existing `src/service/*.service.ts` HTTP client layer untouched - UI/UX only, no API contract changes.
  - Edits directly on the current branch (no automatic branch/PR-per-page) - the user controls branching/committing.
  - Runs one page at a time, producing a small reviewable diff per page (not one repo-wide rewrite).
- `docs/SKILLS.md` updated with both new skills (per `CLAUDE.md`'s rule that skill additions must keep that catalog in sync).
- Clean-slate design: no existing brand/design system constraints to preserve.
- Pages covered: account-list, transaction-list, category-list, statement-uploader, auth, tabs - each including its empty, error, and loading states.
- New skill `ux-proof-capture` (scoped to this ticket only, not a general-purpose skill): generates a sample statement file for every `statement-loader` reader (extends `scripts/generate_dummy_statement_fixtures.py` with an `--out-dir` option, writing to `scripts/statements/synthetic/`), then drives a full login/upload/categorize walkthrough on the HDFC RISHI and AXIS RISHI demo accounts via `claude-in-chrome`, captured as an animated GIF. Run once before `ux-apply` changes land (the "before" baseline) and once after (the "after" comparison) as visual proof of the overhaul - see `.claude/skills/ux-proof-capture/SKILL.md`.

### Out of scope
- Actually running the exploration/decision process itself (picking the app-wide direction, picking per-page variants) - that happens after this ticket, using the skills once built.
- Backend/API changes of any kind.
- finance-manager-ui's non-page chrome not listed above, unless it's part of the shared direction contract (e.g. tabs nav styling) established in `ux/UX_DIRECTION.md`.
- Capacitor/iOS-specific UI concerns beyond what Ionic's web components already handle.

## Affected modules
- [x] finance-manager-ui <!-- not yet edited by this ticket - ux-apply will touch it once run against an approved page spec, per Scope's "actually running the exploration/decision process" being out of scope here -->
- [x] root / docs / CI

## Requirements
1. `ux-explore` skill file at `.claude/skills/ux-explore/SKILL.md`, following this repo's skill conventions (see `docs/SKILLS.md` and existing skills like `jira-create`, `statement-onboard`).
2. `ux-apply` skill file at `.claude/skills/ux-apply/SKILL.md`.
3. `ux/` directory with a template (`ux/TEMPLATE.md`, mirroring `jira/TEMPLATE.md`'s structure/status lifecycle) and an index (`ux/README.md`, mirroring `jira/README.md`).
4. `ux-explore` invokes the `design` skill to produce mockups as published Artifacts; mockup links are recorded in the relevant `ux/` spec file.
5. `ux-explore` never proceeds to per-page variants before `ux/UX_DIRECTION.md` exists and is approved.
6. `ux-explore`'s per-page round pulls real sample data via the `db-run` skill (checking for a locally running/seeded Postgres first, per `local-setup`/`db-setup`) rather than fabricating fake data, and generates variants for each page's empty, error, and loading states in addition to its happy path.
7. `ux-apply` refuses to implement a page whose `ux/UX_<page>.md` is not `Ready for Dev`, and implements all state variants (happy/empty/error/loading) described in that spec.
8. `ux-apply` edits directly on whatever branch is currently checked out - it does not create branches, commits, or PRs itself.
9. `docs/SKILLS.md` catalog table updated with both skills.
10. `ux-proof-capture` skill file at `.claude/skills/ux-proof-capture/SKILL.md`, `docs/SKILLS.md` entry marked as scoped to this ticket, and the "before" baseline GIF captured prior to any `ux-apply` run.

## Open questions
None outstanding - resolved during refinement (see Changelog).

## Acceptance criteria
- [x] `.claude/skills/ux-explore/SKILL.md` and `.claude/skills/ux-apply/SKILL.md` exist and follow this repo's skill conventions.
- [x] `ux/TEMPLATE.md` and `ux/README.md` exist with a Draft -> Options Presented -> Selected -> Ready for Dev status lifecycle.
- [ ] Running `ux-explore` for the app-wide round produces 3 published mockup artifacts covering distinct style directions and a way to record the chosen one in `ux/UX_DIRECTION.md`. **Deferred**: this requires live user direction-picking (Scope explicitly puts "actually running the exploration/decision process" out of this ticket) - first real invocation is the next step after this ticket.
- [ ] Running `ux-explore` for a single page (after a direction is approved) produces 2-3 mockup artifacts - each covering happy/empty/error/loading states, populated with real data pulled via `db-run` - and a `ux/UX_<page>.md` file that reaches Ready for Dev only on explicit user confirmation. **Deferred**, same reason - depends on a direction existing first.
- [ ] Running `ux-apply` against a Ready for Dev `ux/UX_<page>.md` updates that page's real Angular/Ionic component(s) and templates (including its empty/error/loading states) in `finance-manager-ui`, without touching `src/service/*.service.ts` files, and without creating branches/commits itself. **Deferred**, same reason - depends on an approved page spec existing first.
- [x] `docs/SKILLS.md` lists both new skills.

## Implementation notes
- `ux-proof-capture` skill and its sample statements (`scripts/statements/synthetic/`) were built ahead of the rest of this ticket reaching Ready for Dev, at the user's explicit direction, specifically so a "before" baseline recording could be captured before `ux-explore`/`ux-apply` exist.
- "Before" baseline captured: `ux/proof/ux-proof-before-20260911.gif` (login as Rishi Ghai -> account list -> upload `hdfc.xls` to HDFC RISHI -> view/categorize its transactions -> upload `axis.csv` to AXIS RISHI -> view its transactions). Run against the local stack as it existed pre-overhaul (Angular/Ionic default styling, no `ux-explore`/`ux-apply` yet). The "after" GIF (same script, same accounts, same files) should be captured once a page reaches `ux-apply`'d state, and its path added here alongside this one.
- Built `ux-explore` (`.claude/skills/ux-explore/SKILL.md`) and `ux-apply` (`.claude/skills/ux-apply/SKILL.md`), plus the `ux/` tracker (`ux/TEMPLATE.md`, `ux/README.md`) they read/write - a parallel spec-driven flow to `jira/`'s, documented in `docs/SKILLS.md`'s Conventions section.
- Design decisions made while building these:
  - `ux/` mirrors `jira/`'s Draft-refine-Ready-for-Dev discipline but with its own 4-state lifecycle (`Draft -> Options Presented -> Selected -> Ready for Dev`) rather than reusing `jira/TEMPLATE.md` directly - a UX option-comparison spec doesn't fit a requirements/acceptance-criteria shape.
  - `ux-apply` maps `UX_DIRECTION.md`'s color tokens onto Ionic's existing `--ion-color-*` custom properties in `finance-manager-ui/src/theme/variables.scss` rather than inventing new ones, and applies the shared direction tokens globally only on its first run per direction version (checked against `variables.scss`'s current values, not re-applied blindly every page).
  - `ux-apply` explicitly excludes `finance-manager-ui/src/app/{tab2,tab3,explore-container,logout}` - unrelated Ionic-starter-template leftovers not in JIRA_12's six-page scope.
- **Deferred to a follow-up invocation** (per Scope's "actually running the exploration/decision process... happens after this ticket"): the first real `ux-explore` Round 1 (app-wide direction), any page's Round 2, any `ux-apply` run, and the "after" proof GIF. This requires live user UX decisions this ticket doesn't make unilaterally - see the three unchecked Acceptance criteria above.

## Changelog
- 2026-09-11: created from one-liner (Draft)
- 2026-09-11: refinement round 2 - resolved all three open questions: `ux-apply` edits directly on the current branch (no auto branch/PR-per-page), `ux-explore`'s per-page mockups use real data via `db-run` instead of synthetic fake data, and scope explicitly includes empty/error/loading states for each of the six pages (In Refinement)
- 2026-09-11: added `ux-proof-capture` skill (scoped to this ticket only) for before/after UX proof recordings; generated sample statements for all 9 available formats into `scripts/statements/synthetic/` via an `--out-dir` extension to `scripts/generate_dummy_statement_fixtures.py` (In Refinement)
- 2026-09-11: captured the "before" baseline walkthrough GIF (`ux/proof/ux-proof-before-20260911.gif`) via `ux-proof-capture`, run against the local stack prior to any UX changes (In Refinement)
- 2026-09-11: user confirmed the spec - marked Ready for Dev, then immediately moved to In Progress to begin implementation (Ready for Dev -> In Progress)
- 2026-09-11: implemented `ux-explore`, `ux-apply`, and the `ux/` tracker (`TEMPLATE.md`, `README.md`); updated `docs/SKILLS.md`. Live exploration/apply runs deferred to a follow-up per Scope (In Progress)
