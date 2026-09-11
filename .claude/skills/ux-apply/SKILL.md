---
name: ux-apply
description: Implements one finance-manager-ui page's approved UX redesign into real Angular/Ionic code, from a ux/UX_<page>.md spec that ux-explore brought to Ready for Dev (see jira/JIRA_12.md). Refuses to run against a spec that isn't Ready for Dev. Reuses Ionic's component library, applies ux/UX_DIRECTION.md's shared tokens (colors/type/spacing/nav) globally the first time it runs, implements the happy/empty/error/loading states the spec describes, and never touches src/service/*.service.ts. Edits directly on whatever branch is checked out - no branching/committing/PRs of its own. Use when asked to implement/apply a page's approved UX redesign, or to build the "after" state for a JIRA_12 proof comparison.
---

# ux-apply

Turns one `ux/UX_<page>.md` spec (already `Ready for Dev`, via `ux-explore`) into real changes in `finance-manager-ui`. One page per run - this keeps every diff reviewable and matches this repo's per-module CI scoping (`pr-checks.yml`).

## Step 1 - Verify the spec is actually ready

Read `ux/UX_<page>.md` (and `ux/UX_DIRECTION.md`, which it must be built on). **Refuse and stop** if:
- The page's spec doesn't exist, or its `Status` isn't `Ready for Dev` - tell the user to finish `ux-explore` for this page first. Don't improvise a design from scratch.
- `ux/UX_DIRECTION.md` itself isn't `Ready for Dev` - a page spec shouldn't exist without it, but don't assume; check.
- `Selected option` / `Implementation detail` are empty or too vague to implement without re-deciding layout choices yourself - go back to `ux-explore` (or ask the user) rather than guessing.

## Step 2 - Apply the shared direction tokens (first run only)

`ux/UX_DIRECTION.md`'s color/type/spacing/nav tokens are app-wide, not per-page - they belong in the shared theme files, applied once, not re-derived per page:
- **Color tokens** -> Ionic CSS custom properties in `finance-manager-ui/src/theme/variables.scss` (map the spec's palette onto the existing `--ion-color-*` variables rather than inventing new ones, unless the direction genuinely needs a token Ionic doesn't have).
- **Type scale / global spacing/density defaults** -> `finance-manager-ui/src/global.scss`.
- **Navigation pattern** -> `finance-manager-ui/src/app/tabs/` (Ionic's tab bar component config), only if the direction's nav pattern differs from the current tab bar and `tabs` isn't itself the page being applied right now (in which case it's covered by Step 3 below).

Skip this step on every run after the first for a given `ux/UX_DIRECTION.md` version - check `finance-manager-ui/src/theme/variables.scss`'s current values against the spec rather than blindly re-writing it (a prior `ux-apply` run may have already applied it).

## Step 3 - Implement the page

For the page named in `ux/UX_<page>.md` (`finance-manager-ui/src/app/<page>/`):
1. Edit `<page>.component.html`/`.scss`/`.ts` to match the spec's `Implementation detail` - layout structure, Ionic components used, and interaction notes.
2. Implement **all four states** the spec describes, not just the happy path:
   - **Happy path**: the normal populated view.
   - **Empty**: no accounts/transactions/categories yet - a real empty-state treatment (see the existing `statement-uploader`'s "No Statements Uploaded" pattern for the kind of thing this repo already does, and match its intent even if you're changing its look).
   - **Error**: a failed fetch/upload - actionable messaging, not a silent blank screen.
   - **Loading**: an in-flight skeleton/spinner, not a jarring pop-in.
3. **Reuse Ionic's component library** (`ion-card`, `ion-list`, `ion-skeleton-text`, `ion-toast`, etc.) rather than hand-rolling primitives Ionic already provides - check what's already imported in the page's module/standalone component before reaching for a new dependency.
4. **Do not touch `src/service/*.service.ts`** - this is UI/UX only. If a state (e.g. a proper error state) seems to need a service change, that's out of scope for this skill; note it in the spec's `Implementation notes` instead of making the change.
5. **Do not touch pages other than the one named** - `finance-manager-ui/src/app/tab2`, `tab3`, `explore-container`, `logout` are unrelated Ionic-starter leftovers, not in JIRA_12's scope; leave them alone.

## Step 4 - Verify and hand off

1. Run `finance-manager-ui`'s existing checks against the change: `npm run lint` and `npm test` (from `finance-manager-ui/`) - a UX rewrite that breaks the existing component spec tests isn't done.
2. If the local stack is reachable (`local-run`), pull the page up in a browser and sanity-check the happy/empty/error/loading states actually render as described - don't just trust the diff.
3. **Don't create a branch, commit, or PR** - leave the changes on whatever branch is checked out, for the user to review and commit themselves (same as every other skill in this repo).
4. Report back which states were implemented and whether lint/test passed. If this run was meant to produce the "after" state for a `jira/JIRA_12.md` proof comparison, say so and point at `ux-proof-capture` as the next step (run it with the same accounts/files as the "before" GIF for a fair comparison).

## Keeping this doc updated

See `docs/SKILLS.md` for the catalog entry, `ux/TEMPLATE.md`/`.claude/skills/ux-explore/SKILL.md` for how the spec this reads gets built, and `jira/JIRA_12.md` for the ticket this was built under.
