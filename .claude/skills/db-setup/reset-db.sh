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
BACKUP_DIR="$REPO_ROOT/.postgres-backups"
CONTAINER_NAME="finance-manager-postgres"
PG_USER="postgres"
PG_PASSWORD="admin"
PG_DB="finance_manager"
BACKUP_RETENTION=5

echo "== Preflight: Postgres reachable =="
if ! bash "$DB_RUN" --sql "SELECT 1;" >/dev/null 2>&1; then
  echo "[FAIL] cannot reach finance_manager on localhost:5432. Run the local-setup skill first (bash .claude/skills/local-setup/check-and-setup.sh)." >&2
  exit 1
fi
echo "[OK] finance_manager reachable"

echo
echo "== Safety backup before destructive reset =="
mkdir -p "$BACKUP_DIR"
backup_file="$BACKUP_DIR/finance_manager_$(date +%Y%m%d_%H%M%S).sql"
backup_ok=0
if command -v pg_dump >/dev/null 2>&1; then
  PGPASSWORD="$PG_PASSWORD" pg_dump -h localhost -p 5432 -U "$PG_USER" -d "$PG_DB" -f "$backup_file" && backup_ok=1
elif command -v docker >/dev/null 2>&1; then
  docker exec "$CONTAINER_NAME" pg_dump -U "$PG_USER" -d "$PG_DB" > "$backup_file" && backup_ok=1
fi
if [ "$backup_ok" -ne 1 ] || [ ! -s "$backup_file" ]; then
  echo "[FAIL] could not take a pre-reset backup (neither 'pg_dump' nor 'docker' worked, or the dump came back empty) - aborting reset without touching any data." >&2
  rm -f "$backup_file"
  exit 1
fi
echo "[OK] backup written to ${backup_file#"$REPO_ROOT"/}"

# Retain only the BACKUP_RETENTION most-recent backups.
ls -1t "$BACKUP_DIR"/finance_manager_*.sql 2>/dev/null | tail -n "+$((BACKUP_RETENTION + 1))" | while IFS= read -r old; do
  rm -f "$old"
done

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
echo
echo "Pre-reset backup of what was just dropped: ${backup_file#"$REPO_ROOT"/}"
echo "Restore it with: PGPASSWORD=$PG_PASSWORD psql -h localhost -p 5432 -U $PG_USER -d $PG_DB -f \"$backup_file\""
