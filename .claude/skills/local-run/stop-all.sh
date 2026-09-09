#!/usr/bin/env bash
# Teardown helper for the `local-run` skill. Kills whatever is listening on
# each of finance-manager's local ports. Port-based (not PID-based) because
# Gradle's bootRun wrapper process isn't reliably the same PID as the JVM it
# launches. Leaves the Postgres container running (shared/persistent state).
set -uo pipefail

PORTS=(5001 5002 5003 5004 8100 4200)

for p in "${PORTS[@]}"; do
  pids="$(lsof -ti:"$p" 2>/dev/null || true)"
  if [ -n "$pids" ]; then
    echo "Killing process(es) on port $p: $pids"
    kill $pids 2>/dev/null || true
  fi
done

echo
echo "Stopped local-run's processes. Postgres container 'finance-manager-postgres' is left running."
echo "Stop it too with: docker stop finance-manager-postgres"
