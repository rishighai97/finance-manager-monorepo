<!--
Template for ux/UX_<page>.md. Maintained by the `ux-explore` skill
(.claude/skills/ux-explore/SKILL.md) - don't hand-edit this structure
without updating both this template and that skill. Mirrors
jira/TEMPLATE.md's status-lifecycle pattern, adapted for UX decisions
instead of engineering requirements - see jira/JIRA_12.md for why this
exists as a parallel spec-driven flow rather than folding into jira/.
Lifecycle note: `ux-explore` owns Draft through Ready for Dev; only
`ux-apply` moves a page to Implemented, after it has actually built and
verified the change (see .claude/skills/ux-apply/SKILL.md's final step).
-->

# UX_<page>: <Page name>

**Status**: Draft <!-- Draft -> Options Presented -> Selected -> Ready for Dev -> Implemented -->
**Created**: YYYY-MM-DD
**Last updated**: YYYY-MM-DD
**Direction**: <link to ux/UX_DIRECTION.md, and its status at the time this page's options were generated - this page's options must not be generated before UX_DIRECTION.md is itself Ready for Dev>

## Page
<which finance-manager-ui page/route this covers, e.g. `account-list` (`src/app/account-list/`)>

## Options presented
<one entry per generated variant (2-3 typically), each with an Artifact link. Populated with real data pulled via the `db-run` skill, not fake data - note what query/account was used.>

### Option 1 - <short name>
- **Artifact**: <link>
- **Layout**: <what's different about this variant - structure, density, component choices>
- **States covered**: happy path, empty, error, loading - <one line per state on how this variant treats it>

### Option 2 - <short name>
- **Artifact**: <link>
- **Layout**: ...
- **States covered**: ...

## Selected option
<which option was chosen, and why - filled in once the user picks. Leave blank at Draft/Options Presented.>

## Implementation detail
<enough concrete detail for `ux-apply` to implement without re-deciding anything: exact layout structure, which Ionic components to use, spacing/color tokens from UX_DIRECTION.md that apply here, interaction notes (transitions, gestures, feedback), and the happy/empty/error/loading treatment for each. Empty until an option is Selected.>

## Implementation notes
<filled in by `ux-apply` after building this, not before: real findings that only surface while implementing - deviations from the plan, discovered dead/pre-existing code the new behavior turned out to reuse, states that can't actually be triggered given how the real data flows (note them, don't silently invent a fix that changes a src/service/*.service.ts file), verification performed (build/tests run, live browser check done or not) and any bugs found but deliberately left alone. Empty until implemented.>

## Changelog
- YYYY-MM-DD: created, options presented (Draft -> Options Presented)
