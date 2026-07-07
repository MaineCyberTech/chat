# Distributed Tracing

## Current Monitoring State

| Tool          | Purpose                             | Integration                                     |
| ------------- | ----------------------------------- | ------------------------------------------------ |
| **Prometheus** | Metrics collection                 | Exposed at `GET /metrics` (counter, histogram, gauge) |
| **Sentry**    | Error tracking + performance        | `@sentry/node` initialized in `server.ts`         |
| **Health endpoint** | Liveness/readiness checks     | `GET /health` (readiness), `GET /healthz` (full health) |

**Gap**: No distributed tracing across services (API → DB → Worker).
Each service has independent metrics; there is no trace context propagation.

## Adding Tracing with OpenTelemetry

### Strategy

Use OpenTelemetry (OTel) with the Sentry integration layer. Sentry's OTel-based SDK handles span export automatically when performance monitoring is enabled.

### Key Spans to Instrument

| Span                           | Location                          | Description                          |
| ------------------------------ | --------------------------------- | ------------------------------------ |
| `api.request`                  | Express middleware                 | Per-request span with method, route  |
| `db.query`                     | Supabase client wrapper            | SQL query timing                     |
| `socket.event`                 | Socket.io event handlers           | Per-event processing time            |
| `worker.job`                   | BullMQ processor                   | Per-job execution span               |
| `worker.webhook_delivery`      | Webhook service                    | HTTP call to webhook endpoint        |

### Configuration

```typescript
// Sentry init with tracing (already partially configured in lib/sentry.ts)
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
  // For high-traffic endpoints, use beforeSendSpan to drop low-value spans
  integrations: [Sentry.httpIntegration(), Sentry.prismaIntegration()],
});
```

| Config             | Recommended Value | Notes                               |
| ------------------ | ----------------- | ----------------------------------- |
| `tracesSampleRate` | `0.1` (10%)       | Increase to `1.0` for debugging     |
| OTLP endpoint      | Sentry DSN        | Sentry ingests OTel spans natively  |
| Environment        | `NODE_ENV`        | Separate sampling per environment   |

### Code Example: Adding a Child Span

```typescript
import * as Sentry from "@sentry/node";

async function queryMessages(channelId: string) {
  const span = Sentry.getActiveSpan();
  if (span) {
    const childSpan = span.startChild({ op: "db.query", description: "SELECT messages" });
    try {
      return await db.messages.findMany({ where: { channel_id: channelId } });
    } finally {
      childSpan.end();
    }
  }
  return db.messages.findMany({ where: { channel_id: channelId } });
}
```

### Middleware for Automatic Request Tracing

```typescript
import * as Sentry from "@sentry/node";

export function tracingMiddleware(req: Request, res: Response, next: NextFunction) {
  const transaction = Sentry.startTransaction({
    op: "api.request",
    name: `${req.method} ${req.route?.path ?? req.path}`,
  });
  res.on("finish", () => transaction.end());
  next();
}
```

## Verification

1. Ship a test event: `Sentry.captureMessage("Tracing test")`
2. Check Sentry Performance tab for the transaction
3. Verify `trace.id` and `span.id` appear in logs
