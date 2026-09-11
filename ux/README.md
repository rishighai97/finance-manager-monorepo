# ux (this repo's UX decision tracker)

Spec-driven UX-direction tracker for finance-manager, parallel to `jira/`'s requirements tracker (see `jira/JIRA_12.md` for why this exists as its own thing rather than folding into `jira/`). `UX_DIRECTION.md` is the one app-wide style contract; each `UX_<page>.md` is a living per-page spec - captured as mockup options, refined/selected, then marked **Ready for Dev** before `ux-apply` may implement it. See `TEMPLATE.md` for the per-page structure, `.claude/skills/ux-explore/SKILL.md` for how these get created/refined, and `.claude/skills/ux-apply/SKILL.md` for how a Ready for Dev spec becomes real code.

## App-wide direction

| File | Status |
|---|---|
| [UX_DIRECTION.md](UX_DIRECTION.md) | Ready for Dev &mdash; "Calm Ledger" |

## Pages

| Page | File | Status |
|---|---|---|
| account-list | [UX_account-list.md](UX_account-list.md) | Ready for Dev |
| transaction-list | [UX_transaction-list.md](UX_transaction-list.md) | Ready for Dev |
| category-list | [UX_category-list.md](UX_category-list.md) | Ready for Dev |
| statement-uploader | [UX_statement-uploader.md](UX_statement-uploader.md) | Ready for Dev |
| auth | [UX_auth.md](UX_auth.md) | Ready for Dev |
| tabs | [UX_tabs.md](UX_tabs.md) | Ready for Dev |

## Proof captures

Before/after UI walkthrough recordings for JIRA_12, produced by the `ux-proof-capture` skill (scoped to that ticket only) - see `proof/` and `jira/JIRA_12.md`'s Implementation notes.
