# ux (this repo's UX decision tracker)

Spec-driven UX-direction tracker for finance-manager, parallel to `jira/`'s requirements tracker (see `jira/JIRA_12.md` for why this exists as its own thing rather than folding into `jira/`). `UX_DIRECTION.md` is the one app-wide style contract; each `UX_<page>.md` is a living per-page spec - captured as mockup options, refined/selected, then marked **Ready for Dev** before `ux-apply` may implement it. See `TEMPLATE.md` for the per-page structure, `.claude/skills/ux-explore/SKILL.md` for how these get created/refined, and `.claude/skills/ux-apply/SKILL.md` for how a Ready for Dev spec becomes real code.

## App-wide direction

| File | Status |
|---|---|
| [UX_DIRECTION.md](UX_DIRECTION.md) | Not yet created |

## Pages

| Page | File | Status |
|---|---|---|
| account-list | - | Not started |
| transaction-list | - | Not started |
| category-list | - | Not started |
| statement-uploader | - | Not started |
| auth | - | Not started |
| tabs | - | Not started |

## Proof captures

Before/after UI walkthrough recordings for JIRA_12, produced by the `ux-proof-capture` skill (scoped to that ticket only) - see `proof/` and `jira/JIRA_12.md`'s Implementation notes.
