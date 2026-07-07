#!/bin/bash
# Chaos test: Simulate API container crash and verify recovery
set -e
echo "=== Chaos Test: API Container Crash ==="
echo "1. Stopping API container..."
docker compose -f infra/docker/docker-compose.devremote.yml stop api
echo "2. Verifying web app shows connection error..."
curl -s -o /dev/null -w "HTTP %{http_code}\n" https://chat.mainecybertech.us || echo "Expected: connection degraded"
sleep 5
echo "3. Restarting API container..."
docker compose -f infra/docker/docker-compose.devremote.yml start api
echo "4. Waiting for recovery..."
for i in $(seq 1 12); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://chat-api.mainecybertech.us/health 2>/dev/null || echo "000")
  if [ "$STATUS" = "200" ]; then
    echo "API recovered successfully"
    exit 0
  fi
  sleep 5
done
echo "FAIL: API did not recover"
exit 1
