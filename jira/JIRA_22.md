# JIRA_22: Stop local-run from auto-purging DB data on empty-schema detection

**Status**: Done <!-- Draft -> In Refinement -> Ready for Dev -> In Progress -> Done -->
**Created**: 2026-09-19
**Last updated**: 2026-09-19

## One-liner
Update the skill to ensure that DB data is not purged when apps go down / starting up again. Next time the user stops or starts the app again, they need their data as-is.

## Summary
`local-run`'s `SKILL.md` (step 2) instructs Claude to automatically run `db-setup`'s destructive drop+reseed whenever it detects a schema-less `finance_manager` database at startup, without asking the user for confirmation first - this is exactly what happened in the session that raised this ticket. `stop-all.sh`/`start-all.sh` themselves already never touch data when a schema is present (Postgres runs in a persistent, bind-mounted, `--restart=always` container, and `start-all.sh` fails fast rather than resetting when the schema is missing) - the actual gap is the auto-bootstrap branch in the `local-run` skill's own instructions, which treats "no tables found" as sufficient license to destroy and recreate the schema with no human in the loop. If that detection is ever wrong (e.g. a transient connection issue misread as "no schema", or the schema check runs against the wrong DB), or if the `.postgres-data` mount is ever recreated empty while the user believed real data was still safe, this path silently destroys data with no way back.

## Scope

### In scope
- Removing/gating the automatic, unconfirmed invocation of `db-setup`'s reset script from the `local-run` skill's first-time-bootstrap flow.
- Adding a safety backup (`pg_dump`) taken automatically immediately before any destructive `db-setup` reset runs (whether triggered via `local-run`'s bootstrap path or a standalone `db-setup` invocation), so a reset is always recoverable even after explicit confirmation.
- Updating `.claude/skills/local-run/SKILL.md`, `.claude/skills/db-setup/reset-db.sh` (and/or `SKILL.md`), and `docs/SKILLS.md` to document the new behavior.

### Out of scope
- Building a full restore/rollback CLI or UI - just producing a recoverable backup artifact and documenting the manual `psql`/`pg_restore` restore command.
- Changing how `stop-all.sh`/`start-all.sh` handle an already-populated schema - that path is already safe and untouched by this ticket.
- Production/deployed database backup strategy - this ticket is scoped to the local dev workflow only.

## Affected modules
- [ ] scripts
- [x] root / docs / CI

## Requirements
1. `local-run`'s `SKILL.md` step 2 must no longer tell Claude to run `db-setup`'s reset script automatically on detecting a schema-less DB - it must instead stop and explicitly ask the user to confirm before any destructive reset runs, consistent with `db-setup`'s own skill doc ("standalone `db-setup` runs are always explicit user requests").
2. `db-setup`'s `reset-db.sh` takes an automatic `pg_dump` backup of `finance_manager` before dropping any tables, saved to a gitignored local directory (e.g. `.postgres-backups/`), timestamped, so every destructive reset - even a confirmed one - is recoverable.
3. Old backups are pruned so this doesn't grow unbounded - retain the 5 most-recent backups, deleting older ones.
4. `docs/SKILLS.md` and the affected `SKILL.md` files document the new confirm-before-reset behavior and where backups are written/how to restore one.

## Open questions
<none - all resolved>

## Acceptance criteria
- [ ] Running `local-run` against a schema-less `finance_manager` DB stops and asks the user for explicit confirmation before any `db-setup` reset runs - it never resets unconfirmed.
- [ ] Every run of `db-setup`'s `reset-db.sh` produces a timestamped `pg_dump` backup file before dropping tables, and old backups beyond the retention limit are pruned.
- [ ] `docs/SKILLS.md`, `local-run/SKILL.md`, and `db-setup/SKILL.md` reflect the updated behavior.
- [ ] Normal stop/start of the stack against an already-populated schema continues to leave data untouched (regression check - no behavior change intended here).

## Implementation notes
- `local-run/SKILL.md` step 2 rewritten: on a schema-less DB it now stops and requires explicit user confirmation before running `db-setup/reset-db.sh` - no code path in this skill runs a reset unconfirmed. (`start-all.sh` was already failing fast rather than resetting; the gap was purely in the orchestrating skill's own instructions telling Claude to auto-run the reset.)
- `db-setup/reset-db.sh` now takes an automatic `pg_dump` (native `pg_dump`, else `docker exec` into `finance-manager-postgres`, matching `db-run`'s existing fallback pattern) to `.postgres-backups/finance_manager_<timestamp>.sql` before dropping any tables. If the backup can't be taken or comes back empty, the script aborts before touching data.
- Retention: keeps the 5 most-recent backups (`ls -t` + `tail -n +6` prune), matching the confirmed retention choice.
- `.postgres-backups/` added to `.gitignore` alongside the existing `.postgres-data/` entry - local machine state, not committed.
- Updated `db-setup/SKILL.md`, `local-run/SKILL.md`, and `docs/SKILLS.md` to describe the new confirm-before-reset behavior and the backup/restore mechanism.
- Verified manually: ran `reset-db.sh` twice back-to-back (seeding extra dummy backup files in between) and confirmed (a) a real, restorable `pg_dump` file is written before every drop, and (b) pruning correctly keeps exactly 5 most-recent backups. All 5 running services stayed healthy throughout.

## Changelog
- 2026-09-19: created from one-liner (Draft)
- 2026-09-19: refined - backup retention set to 5 most-recent; Open Questions resolved (In Refinement)
- 2026-09-19: confirmed by user - marked Ready for Dev
- 2026-09-19: implemented and verified - marked Done
