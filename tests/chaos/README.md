# Chaos Tests

Chaos tests verify system resilience by simulating infrastructure failures and validating recovery.

## Failure Scenarios

| Scenario | Description | Script |
|----------|-------------|--------|
| **API Crash** | Stop the API container, verify degradation, restart, confirm recovery | `scenarios/api-crash.sh` |
| **Redis Down** | Stop Redis, verify graceful fallback, restart, confirm recovery | `scenarios/redis-down.sh` |
| **DB Disconnect** | Revoke database access, verify cached/graceful behavior, restore | Manual (via firewall rule) |
| **High Latency** | Inject network latency via `tc`, verify timeout handling | Manual (`tc qdisc add dev eth0 latency 500ms`) |

## How to Run

```bash
# API crash test
./tests/chaos/scenarios/api-crash.sh

# Redis down test
./tests/chaos/scenarios/redis-down.sh
```

All scripts target the development environment (`docker-compose.devremote.yml`).

## Expected Behavior

### API Container Crash
- Web app shows connection degraded / retry UI
- Socket.io clients auto-reconnect on restart
- In-flight messages fail with retryable error (no data loss)
- API recovers within 60 seconds of container restart

### Redis Down
- Socket.io falls back to in-memory adapter (single-instance only)
- Idempotency falls back to in-memory Map
- Workers cannot process jobs (degraded, not down)
- Queue data persists in Redis on restart (AOF/RDB)
- All Redis-backed features recover automatically when Redis returns

### Database Disconnect
- Read operations served from cache where possible
- Write operations fail with clear error messages
- Health check endpoint reports `unhealthy`
- Auto-recovery on database reconnect

### High Latency
- Request timeout config (default 30s) prevents resource exhaustion
- Socket.io heartbeat detects dead connections
- Circuit breaker opens for downstream calls
- Latency-tolerant UX (loading spinners, optimistic UI)

## Recovery Verification

After each chaos test, verify:

1. **Health endpoint**: `GET /health` returns 200 with `"status": "healthy"`
2. **Database queries**: Supabase queries succeed
3. **Message send/receive**: Create and read a message
4. **WebSocket**: Socket.io connects and presence updates work
5. **Workers**: BullMQ queues process jobs (check worker `/healthz`)
