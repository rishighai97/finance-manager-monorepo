#!/usr/bin/env bash
# Backing script for the `local-run` skill (.claude/skills/local-run/SKILL.md).
# Brings up account-service, api-gateway, transaction-service, statement-loader
# and finance-manager-ui as backgrounded local processes. Assumes Postgres is
# already up with a `finance_manager` schema (see local-setup / db-setup skills)
# - fails fast with a pointer to the right skill if either precondition is missing.
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
CONTAINER_NAME="finance-manager-postgres"

pids=()
names=()
logs=()

start_bg() {
  local name="$1" dir="$2" logfile="$3"; shift 3
  echo "Starting $name ..."
  : > "$logfile"
  ( cd "$dir" && nohup "$@" >> "$logfile" 2>&1 & echo $! > "$logfile.pid" )
  sleep 0.3
  local pid
  pid="$(cat "$logfile.pid" 2>/dev/null || echo '?')"
  pids+=("$pid"); names+=("$name"); logs+=("$logfile")
  echo "  pid=$pid  log=$logfile"
}

wait_for_http() {
  local url="$1" name="$2" tries="${3:-90}"
  for _ in $(seq 1 "$tries"); do
    curl -sf "$url" >/dev/null 2>&1 && { echo "[OK] $name healthy ($url)"; return 0; }
    sleep 1
  done
  echo "[WARN] $name not responding yet at $url after ${tries}s - check its log" >&2
  return 1
}

echo "== Preflight: Postgres =="
postgres_up=0
if command -v psql >/dev/null 2>&1 && PGPASSWORD=admin psql -h localhost -p 5432 -U postgres -d finance_manager -tAc "SELECT 1" >/dev/null 2>&1; then
  postgres_up=1
elif command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "$CONTAINER_NAME"; then
  postgres_up=1
fi
if [ "$postgres_up" -eq 0 ]; then
  echo "[FAIL] Postgres / 'finance_manager' database not reachable." >&2
  echo "Run: bash \"$REPO_ROOT/.claude/skills/local-setup/check-and-setup.sh\"" >&2
  exit 1
fi
echo "[OK] Postgres reachable"

echo
echo "== Preflight: schema present =="
table_exists=0
if command -v psql >/dev/null 2>&1; then
  [ "$(PGPASSWORD=admin psql -h localhost -p 5432 -U postgres -d finance_manager -tAc \
      "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='account'" 2>/dev/null | tr -d '[:space:]')" = "1" ] && table_exists=1
else
  [ "$(docker exec "$CONTAINER_NAME" psql -U postgres -d finance_manager -tAc \
      "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='account'" 2>/dev/null | tr -d '[:space:]')" = "1" ] && table_exists=1
fi
if [ "$table_exists" -eq 0 ]; then
  echo "[FAIL] 'finance_manager' has no schema yet (first-time setup)." >&2
  echo "Run: bash \"$REPO_ROOT/.claude/skills/db-setup/reset-db.sh\"" >&2
  exit 1
fi
echo "[OK] schema present - existing data left untouched"

echo
echo "== Starting Java services =="
start_bg "account-service" "$REPO_ROOT/account-service" "$REPO_ROOT/account-service/server.log" \
  ./gradlew bootRun --args='--spring.profiles.active=local'
start_bg "api-gateway" "$REPO_ROOT/api-gateway" "$REPO_ROOT/api-gateway/server.log" \
  ./gradlew bootRun --args='--spring.profiles.active=local'
start_bg "transaction-service" "$REPO_ROOT/transaction-service" "$REPO_ROOT/transaction-service/server.log" \
  ./gradlew bootRun --args='--spring.profiles.active=local'

wait_for_http "http://localhost:5003/account/v1/healthcheck" "account-service"
wait_for_http "http://localhost:5001/auth/healthcheck" "api-gateway"
wait_for_http "http://localhost:5004/transaction/v1/healthcheck" "transaction-service"

echo
echo "== Starting statement-loader =="
if [ ! -d "$REPO_ROOT/.venv" ]; then
  echo "[FAIL] no venv at $REPO_ROOT/.venv - run the local-setup skill first." >&2
  exit 1
fi
: > "$REPO_ROOT/statement-loader/server.log"
# statement-loader/resources/env_variables/.env.local has its Postgres password
# intentionally blanked (a historical credential was scrubbed - see that module's
# README Gotchas); its config loader uses load_dotenv(..., override=False), so a
# real env var here wins over the blank .env value without touching that tracked file.
( cd "$REPO_ROOT" && source .venv/bin/activate && STATEMENT_LOADER_POSTGRES_PASSWORD="admin" nohup python statement-loader/run.py --app-profile local >> statement-loader/server.log 2>&1 & echo $! > statement-loader/server.log.pid )
sleep 0.3
pid="$(cat "$REPO_ROOT/statement-loader/server.log.pid" 2>/dev/null || echo '?')"
pids+=("$pid"); names+=("statement-loader"); logs+=("$REPO_ROOT/statement-loader/server.log")
echo "  pid=$pid  log=$REPO_ROOT/statement-loader/server.log"
wait_for_http "http://localhost:5002/statement/upload/v1/healthcheck" "statement-loader"

echo
echo "== Starting finance-manager-ui =="
if command -v ionic >/dev/null 2>&1; then
  start_bg "finance-manager-ui" "$REPO_ROOT/finance-manager-ui" "$REPO_ROOT/finance-manager-ui/server.log" \
    ionic serve --external --no-open
  UI_URL="http://localhost:8100"
else
  echo "[WARN] 'ionic' CLI not found - falling back to 'npm start' (ng serve, port 4200). Install with: npm install -g @ionic/cli" >&2
  start_bg "finance-manager-ui" "$REPO_ROOT/finance-manager-ui" "$REPO_ROOT/finance-manager-ui/server.log" \
    npm start
  UI_URL="http://localhost:4200"
fi

echo
echo "=================================================================="
echo " Local stack starting. Open the app at: $UI_URL"
echo " (the UI dev server can take 15-30s to finish compiling on first load)"
echo
printf "%-20s %-8s %s\n" "SERVICE" "PID" "LOG"
for i in "${!names[@]}"; do
  printf "%-20s %-8s %s\n" "${names[$i]}" "${pids[$i]}" "${logs[$i]}"
done
echo
echo " Stop everything:  bash \"$REPO_ROOT/.claude/skills/local-run/stop-all.sh\""
echo "=================================================================="
