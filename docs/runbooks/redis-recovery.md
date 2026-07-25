# Redis Recovery

Redis runs as a Docker container with AOF persistence enabled. It stores ephemeral data: Socket.io presence, rate-limit counters, BullMQ job queues, and idempotency keys.

## Detection

```bash
docker exec chat-redis-prod redis-cli ping
```

Expected: `PONG`. If no response or connection refused, Redis is down.

Also check via health endpoint (API `/healthz` returns `status: "down"` if Redis-backed services fail).

## Common Failures

### Container Stopped

```bash
docker compose -f infra/docker/docker-compose.prod.yml ps redis
docker compose -f infra/docker/docker-compose.prod.yml up -d redis
```

### Out of Memory

Redis is constrained to 64MB. Check logs:

```bash
docker logs chat-redis-prod | tail -50
```

If OOM, increase memory limit in compose file or add `maxmemory-policy allkeys-lru`.

### Corrupted AOF File

```bash
docker compose -f infra/docker/docker-compose.prod.yml stop redis
redis-check-aof /path/to/appendonly.aof
redis-check-aof --fix /path/to/appendonly.aof
docker compose -f infra/docker/docker-compose.prod.yml start redis
```

## Complete Recovery

```bash
docker compose -f infra/docker/docker-compose.prod.yml down redis
docker volume rm chat-prod_redis-data
docker compose -f infra/docker/docker-compose.prod.yml up -d redis
```

Data is ephemeral and will repopulate naturally:
- Rate-limit counters reset (users may get a few extra requests)
- Socket.io reconnects on next client handshake
- BullMQ jobs resume from stalled
- Presence state is rebuilt

## Post-Recovery Verification

```bash
docker exec chat-redis-prod redis-cli info stats | grep uptime_in_seconds
docker exec chat-redis-prod redis-cli info keyspace
docker compose -f infra/docker/docker-compose.prod.yml restart worker
```

Then check `/healthz` returns healthy. If BullMQ queues were drained, jobs will be re-enqueued by the scheduler.
