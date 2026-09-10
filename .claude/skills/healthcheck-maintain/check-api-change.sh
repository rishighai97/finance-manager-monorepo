#!/bin/bash
# PostToolUse hook (Edit|Write): when the edited/written file is part of the
# API surface the healthcheck dashboard watches, remind Claude Code to run
# the healthcheck-maintain skill against the change. See SKILL.md.
set -euo pipefail

input="$(cat)"
file_path="$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')"

if [ -z "$file_path" ]; then
  exit 0
fi

matched=false
case "$file_path" in
  */src/main/java/*/controller/*.java) matched=true ;;
  */statement-loader/controller/*.py) matched=true ;;
  */finance-manager-ui/src/service/*.service.ts) matched=true ;;
esac

if [ "$matched" = true ]; then
  jq -n --arg fp "$file_path" '{
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext: ("This file is part of the API surface the healthcheck dashboard watches: " + $fp + ". Run the healthcheck-maintain skill (.claude/skills/healthcheck-maintain/SKILL.md) now to check whether observability/healthcheck.html needs a matching update.")
    }
  }'
fi
