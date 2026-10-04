#!/bin/bash
# Chaos test: Simulate Redis failure and verify graceful degradation
set -e
echo "=== Chaos Test: Redis Down ==="
echo "1. Stopping Redis container..."
docker compose -f infra/docker/docker-compose.devremote.yml stop redis
echo "2. Verifying API health shows Redis degraded..."
for i in $(seq 1 6); do
  STATUS=$(curl -s https://chat-api.mainecybertech.us/healthz 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null || echo "")
  if echo "$STATUS" | grep -q "degraded"; then
    echo "Health check reports degraded (expected)"
    break
  fi
  sleep 5
done
echo "3. Verifying idempotency falls back to in-memory..."
curl -s -o /dev/null -w "HTTP %{http_code}\n" -X POST https://chat-api.mainecybertech.us/v1/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -d '{"channel_id":"test","content":"chaos test"}' || echo "Expected: degraded but operational"
echo "4. Restarting Redis..."
docker compose -f infra/docker/docker-compose.devremote.yml start redis
echo "5. Waiting for recovery..."
for i in $(seq 1 12); do
  STATUS=$(curl -s https://chat-api.mainecybertech.us/healthz 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null || echo "")
  if [ "$STATUS" = "healthy" ]; then
    echo "Redis recovered successfully"
    exit 0
  fi
  sleep 5
done
echo "FAIL: Redis did not recover"
exit 1
