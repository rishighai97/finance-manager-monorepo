#!/usr/bin/env bash
# Backing script for the `db-setup` skill (.claude/skills/db-setup/SKILL.md).
# DESTRUCTIVE: drops and recreates every table in the local `finance_manager`
# database, then loads sample data. Never run against data you want to keep.
#
# Delegates entirely to the db-run skill's psql-based runner against
# dbscripts/'s versioned SQL - no Python/psycopg2 involved (see JIRA_5).
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
DB_RUN="$REPO_ROOT/.claude/skills/db-run/run-sql.sh"

echo "== Preflight: Postgres reachable =="
if ! bash "$DB_RUN" --sql "SELECT 1;" >/dev/null 2>&1; then
  echo "[FAIL] cannot reach finance_manager on localhost:5432. Run the local-setup skill first (bash .claude/skills/local-setup/check-and-setup.sh)." >&2
  exit 1
fi
echo "[OK] finance_manager reachable"

echo
echo "== Dropping all tables (cascade) =="
if ! bash "$DB_RUN" --manifest script/teardown.list; then
  echo "[FAIL] teardown failed - see output above." >&2
  exit 1
fi

echo
echo "== Recreating schema + loading sample data =="
if ! bash "$DB_RUN" --manifest script/setup.list; then
  echo "[FAIL] setup failed - see output above." >&2
  exit 1
fi

echo
echo "Done. Sample data loaded into: account_icon, account_type, account, account_statement, user_detail, user_account, user_category."
echo "'transaction' and 'transaction_user_category' are created empty by design - they populate when a statement is uploaded through the running app (statement-loader -> transaction-service)."
