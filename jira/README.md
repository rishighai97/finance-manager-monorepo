# JIRA (this repo's spec files)

Spec-driven development tracker for finance-manager. Each `JIRA_<ID>.md` is a living spec: captured from a one-line requirement, then iteratively refined (with a visible changelog) until marked **Ready for Dev**. No implementation should start on a ticket before it reaches that status. See `TEMPLATE.md` for the structure, and the `jira-create` skill (`.claude/skills/jira-create/SKILL.md`) for the workflow that creates/maintains these files.

## Tickets

| ID | Title | Status |
|---|---|---|
| [JIRA_1](JIRA_1.md) | Update documentation for all modules | Done |
| [JIRA_2](JIRA_2.md) | Local-run, local-setup and db-setup skills | Done |
| [JIRA_3](JIRA_3.md) | local-install skill (Java/Node/Ionic/Docker toolchain installer) | Done |
| [JIRA_4](JIRA_4.md) | Signup 500s - blank local Postgres password in api-gateway/transaction-service | Done |
| [JIRA_5](JIRA_5.md) | dbscripts module + db-run skill (version-controlled SQL, psql-driven db-setup) | Done |
| [JIRA_6](JIRA_6.md) | test-automation module (BDD scenario discovery + generation skills) | Done |
| [JIRA_7](JIRA_7.md) | Unit test coverage across all modules + `unit-test-generate` (TDD) skill | Done |
| [JIRA_8](JIRA_8.md) | Synthetic statement fixtures per bank/broker format + e2e upload coverage | Done |
| [JIRA_9](JIRA_9.md) | `diagram-maintain` skill for architecture diagrams in a new `architecture-docs` module | Done |
| [JIRA_10](JIRA_10.md) | Observability module - single-page HTML healthcheck dashboard | Done |
| [JIRA_11](JIRA_11.md) | `statement-onboard` skill - onboard any new statement format/bank end-to-end | Done |
| [JIRA_12](JIRA_12.md) | `ux-explore` and `ux-apply` skills for a finance-manager-ui UX overhaul | In Progress |
| [JIRA_13](JIRA_13.md) | Revamp transaction-list's search/filter section | Ready for Dev |
| [JIRA_14](JIRA_14.md) | Split transaction-list into separate search and list components | Done |
| [JIRA_15](JIRA_15.md) | Gate "Revert Categorize" on pending changes, label the bulk-actions row | Done |
| [JIRA_16](JIRA_16.md) | Search bar sizing, balance summary row, and compact bulk-action buttons | Done |
| [JIRA_17](JIRA_17.md) | Amazon-style search + filter button, filters in a modal | Done |
| [JIRA_18](JIRA_18.md) | Onboard American Express Excel statement format | Done |
| [JIRA_19](JIRA_19.md) | Fix Axis CSV reader's date format + make every reader tolerate date-format drift | Done |
| [JIRA_20](JIRA_20.md) | Fix missing debit/credit color distinction on transaction rows | Done |
