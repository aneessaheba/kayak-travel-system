#!/usr/bin/env bash
set -euo pipefail

# Usage: scripts/seed-all.sh [path/to/.env]
# Defaults to ./backend/.env if present, otherwise ./ai-agent/.env or ./ .env

ENV_CANDIDATE="${1:-}"

pick_env() {
  if [ -n "$ENV_CANDIDATE" ] && [ -f "$ENV_CANDIDATE" ]; then
    echo "$ENV_CANDIDATE"; return
  fi
  for f in ./backend/.env ./ai-agent/.env ./.env; do
    if [ -f "$f" ]; then echo "$f"; return; fi
  done
}

ENV_FILE=$(pick_env)
if [ -n "$ENV_FILE" ]; then
  echo "🔑 Loading env from $ENV_FILE"
  # shellcheck disable=SC2046
  export $(grep -v '^#' "$ENV_FILE" | xargs)
else
  echo "⚠️  No .env file found; relying on current shell env"
fi

echo "🌱 Seeding Mongo..."
npm run seed:mongo

echo "🌱 Seeding Redis..."
npm run seed:redis

echo "🌱 Ensuring Kafka topics..."
npm run kafka:topics

echo "✅ Seeding complete"
