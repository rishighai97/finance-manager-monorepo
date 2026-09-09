#!/usr/bin/env bash
# Backing script for the `local-setup` skill (.claude/skills/local-setup/SKILL.md).
# Verifies/repairs local prerequisites for running finance-manager. Idempotent -
# safe to re-run any time. Does NOT touch application data (see the `db-setup` skill).
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
CONTAINER_NAME="finance-manager-postgres"
PG_USER="postgres"
PG_PASSWORD="admin"
PG_DB="finance_manager"

overall_ok=1
ok()   { echo "[OK]   $*"; }
note() { echo "       $*"; }
warn() { echo "[WARN] $*"; overall_ok=0; }
fail() { echo "[FAIL] $*"; overall_ok=0; }

echo "== Java (account-service, api-gateway, transaction-service) =="
if command -v java >/dev/null 2>&1 && java -version >/dev/null 2>&1; then
  ok "java found: $(java -version 2>&1 | head -1)"
else
  warn "no working 'java' on PATH (macOS ships a stub at /usr/bin/java that fails without a JDK installed - 'command -v java' alone isn't enough). Each service's build.gradle pins a JDK 21 Gradle toolchain, so ./gradlew will try to auto-provision one on first run (needs network access). If that's blocked in this environment, run: bash .claude/skills/local-install/install.sh java"
fi

echo
echo "== Python venv (statement-loader) =="
VENV_DIR="$REPO_ROOT/.venv"

# statement-loader's code uses `from datetime import ... UTC`, which needs
# Python 3.11+ - a plain `python3` on PATH can easily be older (e.g. macOS's
# Command Line Tools ships 3.9). Prefer a known-modern interpreter by name,
# falling back to `python3` only if it's actually >=3.11 itself.
is_py311_plus() {
  "$1" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 11) else 1)' >/dev/null 2>&1
}
find_python311_plus() {
  for candidate in python3.13 python3.12 python3.11; do
    if command -v "$candidate" >/dev/null 2>&1; then
      command -v "$candidate"
      return 0
    fi
  done
  if command -v python3 >/dev/null 2>&1 && is_py311_plus python3; then
    command -v python3
    return 0
  fi
  return 1
}

if [ -d "$VENV_DIR" ]; then
  if is_py311_plus "$VENV_DIR/bin/python"; then
    :
  else
    warn "existing venv at $VENV_DIR was created with $("$VENV_DIR/bin/python" --version 2>&1) - statement-loader needs 3.11+ (it uses 'datetime.UTC'). Not deleting it automatically (local-setup never deletes existing state) - remove it yourself (rm -rf .venv) and re-run this skill to rebuild it on a newer Python."
  fi
fi

if [ ! -d "$VENV_DIR" ]; then
  PYTHON_BIN="$(find_python311_plus || true)"
  if [ -z "$PYTHON_BIN" ]; then
    fail "no Python 3.11+ interpreter found on PATH (checked python3.13/python3.12/python3.11/python3) - statement-loader needs one. Install via 'brew install python@3.12' (macOS) or your distro's python3.12/python3.11 package (Linux), then re-run this skill."
  else
    note "creating venv at $VENV_DIR using $PYTHON_BIN ($("$PYTHON_BIN" --version 2>&1))"
    "$PYTHON_BIN" -m venv "$VENV_DIR"
  fi
fi

if [ -d "$VENV_DIR" ]; then
  # shellcheck disable=SC1091
  source "$VENV_DIR/bin/activate"
  pip install --quiet --upgrade pip
  if pip install --quiet -r "$REPO_ROOT/statement-loader/requirements.txt"; then
    ok "venv ready at $VENV_DIR ($(python --version 2>&1), statement-loader dependencies installed)"
  else
    fail "pip install failed - see output above"
  fi
  deactivate
fi
# else: venv doesn't exist and couldn't be created - already reported via fail() above.

echo
echo "== finance-manager-ui npm dependencies =="
if ! command -v npm >/dev/null 2>&1; then
  fail "no 'npm' on PATH - run: bash .claude/skills/local-install/install.sh node"
else
  if [ ! -d "$REPO_ROOT/finance-manager-ui/node_modules" ]; then
    note "running 'npm install' in finance-manager-ui (first time only)"
    if ! (cd "$REPO_ROOT/finance-manager-ui" && npm install); then
      fail "npm install failed - see output above"
    fi
  fi
  if [ -d "$REPO_ROOT/finance-manager-ui/node_modules" ]; then
    ok "finance-manager-ui/node_modules present"
  fi
  if command -v ionic >/dev/null 2>&1; then
    ok "ionic CLI found: $(ionic --version 2>/dev/null || echo present)"
  else
    warn "no 'ionic' CLI on PATH - the local-run skill will fall back to 'npm start' (ng serve, port 4200) instead of 'ionic serve --external' (port 8100). Install with: bash .claude/skills/local-install/install.sh ionic"
  fi
fi

echo
echo "== Postgres (finance_manager database) =="
postgres_reachable() {
  PGPASSWORD="$PG_PASSWORD" psql -h localhost -p 5432 -U "$PG_USER" -d postgres -tAc "SELECT 1" >/dev/null 2>&1
}

have_psql=0
command -v psql >/dev/null 2>&1 && have_psql=1

postgres_up=0
if [ "$have_psql" -eq 1 ] && postgres_reachable; then
  postgres_up=1
  ok "Postgres already reachable on localhost:5432"
elif command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "$CONTAINER_NAME"; then
  postgres_up=1
  ok "Postgres container '$CONTAINER_NAME' already running"
fi

if [ "$postgres_up" -eq 0 ]; then
  if ! command -v docker >/dev/null 2>&1; then
    fail "no Postgres reachable on localhost:5432, and no 'docker' on PATH to start one. Run: bash .claude/skills/local-install/install.sh docker (or start a local Postgres yourself with a '$PG_DB' database - user $PG_USER / password $PG_PASSWORD)."
  else
    if docker ps -a --format '{{.Names}}' 2>/dev/null | grep -qx "$CONTAINER_NAME"; then
      note "starting existing stopped container '$CONTAINER_NAME'"
      docker start "$CONTAINER_NAME" >/dev/null
    else
      note "creating Postgres container '$CONTAINER_NAME' (see scripts/postgres.sh for the reference command). Pinned to postgres:16, not :latest - Postgres 18+ changed its data-directory layout and rejects the .../data-suffixed volume mount used here."
      mkdir -p "$REPO_ROOT/.postgres-data"
      docker run --name "$CONTAINER_NAME" \
        -e POSTGRES_PASSWORD="$PG_PASSWORD" \
        -e POSTGRES_USER="$PG_USER" \
        -e POSTGRES_DB="$PG_DB" \
        -p 5432:5432 \
        --restart=always \
        -v "$REPO_ROOT/.postgres-data:/var/lib/postgresql/data" \
        -d postgres:16 >/dev/null
    fi
    note "waiting for Postgres to accept connections..."
    for _ in $(seq 1 30); do
      docker exec "$CONTAINER_NAME" pg_isready -U "$PG_USER" >/dev/null 2>&1 && { postgres_up=1; break; }
      sleep 1
    done
    if [ "$postgres_up" -eq 1 ]; then
      ok "Postgres container '$CONTAINER_NAME' is up"
    else
      fail "Postgres container did not become ready in time - check 'docker logs $CONTAINER_NAME'"
    fi
  fi
fi

if [ "$postgres_up" -eq 1 ]; then
  db_exists() {
    if [ "$have_psql" -eq 1 ]; then
      PGPASSWORD="$PG_PASSWORD" psql -h localhost -p 5432 -U "$PG_USER" -d postgres -tAc \
        "SELECT 1 FROM pg_database WHERE datname='$PG_DB'" 2>/dev/null | grep -q 1
    else
      docker exec "$CONTAINER_NAME" psql -U "$PG_USER" -tAc \
        "SELECT 1 FROM pg_database WHERE datname='$PG_DB'" 2>/dev/null | grep -q 1
    fi
  }
  create_db() {
    if [ "$have_psql" -eq 1 ]; then
      PGPASSWORD="$PG_PASSWORD" psql -h localhost -p 5432 -U "$PG_USER" -d postgres -c "CREATE DATABASE $PG_DB;" >/dev/null 2>&1
    else
      docker exec "$CONTAINER_NAME" psql -U "$PG_USER" -c "CREATE DATABASE $PG_DB;" >/dev/null 2>&1
    fi
  }
  if db_exists; then
    ok "'$PG_DB' database exists"
  else
    note "creating '$PG_DB' database"
    if create_db; then
      ok "created '$PG_DB' database"
    elif db_exists; then
      # A freshly-created container can report "accepting connections" (pg_isready)
      # while its own POSTGRES_DB-env-var init is still finishing a startup/restart
      # cycle - our create attempt can race that and fail ("already exists"), even
      # though the database is genuinely there a moment later. Re-check before failing.
      ok "'$PG_DB' database exists (was still finishing its own first-boot init when first checked)"
    else
      fail "could not create '$PG_DB' database"
    fi
  fi
  note "note: the database has no tables yet until the db-setup skill has been run at least once."
fi

echo
if [ "$overall_ok" -eq 1 ]; then
  echo "All prerequisites satisfied - safe to proceed to the db-setup / local-run skills."
  exit 0
else
  echo "One or more prerequisites need attention (see WARN/FAIL above)."
  exit 1
fi
