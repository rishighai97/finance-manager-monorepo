#!/usr/bin/env bash
# Backing script for the `db-setup` skill (.claude/skills/db-setup/SKILL.md).
# DESTRUCTIVE: drops and recreates every table in the local `finance_manager`
# database, then loads sample data. Never run against data you want to keep.
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
DB_DIR="$REPO_ROOT/scripts/sql/finance_manager_db"
VENV_DIR="$REPO_ROOT/.venv"

if [ ! -d "$VENV_DIR" ]; then
  echo "[FAIL] no venv at $VENV_DIR - run the local-setup skill first (bash .claude/skills/local-setup/check-and-setup.sh)." >&2
  exit 1
fi
# shellcheck disable=SC1091
source "$VENV_DIR/bin/activate"

echo "== Preflight: Postgres reachable =="
if ! python - <<'EOF'
import sys
import psycopg2
try:
    psycopg2.connect(dbname="finance_manager", user="postgres", password="admin", host="localhost", port="5432").close()
except Exception as e:
    print(f"[FAIL] cannot connect to finance_manager on localhost:5432: {e}", file=sys.stderr)
    sys.exit(1)
EOF
then
  echo "Run the local-setup skill first (bash .claude/skills/local-setup/check-and-setup.sh) to bring Postgres up." >&2
  deactivate
  exit 1
fi
echo "[OK] finance_manager reachable"

cd "$DB_DIR"

echo
echo "== Dropping all tables (cascade) =="
if ! python database_manager.py --drop-all --cascade --postgres-username postgres --postgres-password admin; then
  echo "[FAIL] database_manager.py --drop-all failed - see output above." >&2
  deactivate
  exit 1
fi

echo
echo "== Recreating schema =="
if ! python database_manager.py --create-all --postgres-username postgres --postgres-password admin; then
  echo "[FAIL] database_manager.py --create-all failed - see output above." >&2
  deactivate
  exit 1
fi

echo
echo "== Loading sample data =="
# populate_accounts.py catches its own exceptions and always exits 0, so failure
# has to be detected from its output rather than its exit code.
populate_output="$(python populate_accounts.py 2>&1)"
echo "$populate_output"
if echo "$populate_output" | grep -q "An error occurred"; then
  echo "[FAIL] populate_accounts.py reported an error - see output above." >&2
  deactivate
  exit 1
fi

deactivate

echo
echo "Done. Sample data loaded into: account_icon, account_type, account, account_statement, user_detail, user_account, user_category."
echo "'transaction' and 'transaction_user_category' are created empty by design - they populate when a statement is uploaded through the running app (statement-loader -> transaction-service)."
