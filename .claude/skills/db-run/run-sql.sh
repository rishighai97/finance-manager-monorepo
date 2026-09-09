#!/usr/bin/env bash
# Backing script for the `db-run` skill (.claude/skills/db-run/SKILL.md).
# Runs SQL against the local finance_manager Postgres via the psql CLI -
# native `psql` if on PATH, else `docker exec` into the finance-manager-postgres
# container (same fallback pattern as local-setup/local-run). No Python/psycopg2.
#
# Usage:
#   run-sql.sh --manifest <path/to/list-file>   # run every .sql listed, in order, stop on first error
#   run-sql.sh --file <path/to/file.sql>        # run a single .sql file
#   run-sql.sh --sql "<inline SQL>"             # run an inline SQL string
#
# Manifest/file paths are resolved relative to the dbscripts/ module root
# unless already absolute. Connection defaults match every other local-run
# skill and every service's application-local.properties: localhost:5432,
# db finance_manager, user postgres, password admin.
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
DBSCRIPTS_DIR="$REPO_ROOT/dbscripts"
CONTAINER_NAME="finance-manager-postgres"
PG_USER="postgres"
PG_PASSWORD="admin"
PG_DB="finance_manager"

MODE=""
ARG=""
case "${1:-}" in
  --manifest) MODE="manifest"; ARG="${2:-}" ;;
  --file) MODE="file"; ARG="${2:-}" ;;
  --sql) MODE="sql"; ARG="${2:-}" ;;
  *)
    echo "Usage: run-sql.sh --manifest <list-file> | --file <sql-file> | --sql \"<inline SQL>\"" >&2
    exit 2
    ;;
esac
if [ -z "$ARG" ]; then
  echo "[FAIL] missing argument for $1" >&2
  exit 2
fi

have_psql=0
command -v psql >/dev/null 2>&1 && have_psql=1

if [ "$have_psql" -eq 0 ] && ! command -v docker >/dev/null 2>&1; then
  echo "[FAIL] neither 'psql' nor 'docker' is on PATH - can't reach Postgres. Run the local-setup skill first." >&2
  exit 1
fi

run_file() {
  local sql_file="$1"
  if [ ! -f "$sql_file" ]; then
    echo "[FAIL] no such file: $sql_file" >&2
    return 1
  fi
  echo "-- running: ${sql_file#"$REPO_ROOT"/}"
  if [ "$have_psql" -eq 1 ]; then
    PGPASSWORD="$PG_PASSWORD" psql -h localhost -p 5432 -U "$PG_USER" -d "$PG_DB" \
      -v ON_ERROR_STOP=1 -f "$sql_file"
  else
    docker exec -i "$CONTAINER_NAME" psql -U "$PG_USER" -d "$PG_DB" \
      -v ON_ERROR_STOP=1 < "$sql_file"
  fi
}

run_sql_string() {
  local sql="$1"
  if [ "$have_psql" -eq 1 ]; then
    PGPASSWORD="$PG_PASSWORD" psql -h localhost -p 5432 -U "$PG_USER" -d "$PG_DB" \
      -v ON_ERROR_STOP=1 -c "$sql"
  else
    docker exec "$CONTAINER_NAME" psql -U "$PG_USER" -d "$PG_DB" \
      -v ON_ERROR_STOP=1 -c "$sql"
  fi
}

resolve() {
  local p="$1"
  if [ "${p:0:1}" = "/" ]; then
    echo "$p"
  else
    echo "$DBSCRIPTS_DIR/$p"
  fi
}

case "$MODE" in
  sql)
    run_sql_string "$ARG" || { echo "[FAIL] inline SQL failed" >&2; exit 1; }
    echo "[OK] inline SQL executed"
    ;;
  file)
    f="$(resolve "$ARG")"
    run_file "$f" || { echo "[FAIL] $ARG failed - see output above" >&2; exit 1; }
    echo "[OK] $ARG executed"
    ;;
  manifest)
    manifest="$(resolve "$ARG")"
    if [ ! -f "$manifest" ]; then
      echo "[FAIL] no such manifest: $manifest" >&2
      exit 1
    fi
    count=0
    while IFS= read -r line || [ -n "$line" ]; do
      line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
      [ -z "$line" ] && continue
      case "$line" in \#*) continue ;; esac
      f="$(resolve "$line")"
      if ! run_file "$f"; then
        echo "[FAIL] manifest stopped at '$line' - see output above" >&2
        exit 1
      fi
      count=$((count + 1))
    done < "$manifest"
    echo "[OK] manifest '$ARG' completed ($count script(s) run)"
    ;;
esac
