#!/usr/bin/env bash
set -euo pipefail

PORT="${LOCAL_API_PORT:-3001}"
BASE_URL="http://127.0.0.1:${PORT}"

pnpm --filter @chapterquest/functions start:local &
SERVER_PID=$!

cleanup() {
  kill "${SERVER_PID}" 2>/dev/null || true
}
trap cleanup EXIT

for _ in $(seq 1 30); do
  if curl -sf "${BASE_URL}/health" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "==> Smoke: GET /health"
curl -sf "${BASE_URL}/health" | grep -q '"status":"healthy"'

echo "==> Smoke: POST /users/guest validation"
STATUS=$(curl -s -o /tmp/guest-invalid.json -w "%{http_code}" \
  -X POST "${BASE_URL}/users/guest" \
  -H "Content-Type: application/json" \
  -d '{"username":"a"}')
test "${STATUS}" = "400"

echo "==> Smoke: GET /library"
STATUS=$(curl -s -o /tmp/library.json -w "%{http_code}" "${BASE_URL}/library")
test "${STATUS}" = "200"
grep -q '"books"' /tmp/library.json

echo "==> API smoke tests passed"
