# API Rate Limits

Rate limiting uses `express-rate-limit` with composite keys (userId + IP, or IP-only for unauthenticated requests). Standard headers are sent: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`.

## Tiers

| Limiter              | Window   | Max Requests | Key                        | Used On                         |
| -------------------- | -------- | ------------ | -------------------------- | ------------------------------- |
| `apiLimiter`         | 1 minute | 100          | `userId:ip` or `ip`        | All `/v1/*` routes              |
| `authLimiter`        | 1 minute | 10           | `userId:ip` or `ip`        | Auth endpoints (`/v1/auth/*`)   |
| `searchLimiter`      | 1 minute | 30           | `userId:ip` or `ip`        | Search endpoints (`/v1/search`) |
| `magicLinkLimiter`   | 1 minute | 3            | `ip` only                  | Magic link send endpoint        |
| `gdprExportLimiter`  | 1 hour   | 5            | `userId` or `ip`           | GDPR export endpoint            |

## Response on Limit Hit

HTTP 429 with body:

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests, please try again later"
  }
}
```

Headers include `Retry-After` (seconds) and `X-RateLimit-Remaining: 0`.

Rate limit hits are logged at `warn` level with IP, userId, and path.

## Configuration

Global defaults (overridable via env):

```
RATE_LIMIT_WINDOW_MS=60000     # Window in ms (default: 60000 = 1 min)
RATE_LIMIT_MAX_REQUESTS=100    # Max per window (default: 100)
```

Per-tier limits are hardcoded in `apps/api/src/middleware/rate-limit.ts`. To adjust a tier, edit the `max` and `windowMs` values in the corresponding limiter definition.

## Source

`apps/api/src/middleware/rate-limit.ts`
