/**
 * Alerting setup:
 *
 * Prometheus metrics are exposed at GET /metrics (see server.ts).
 * For production alerting configure:
 *
 *   TODO: Configure alerting channels
 *   - Prometheus + Alertmanager rules for:
 *     - chat_http_requests_total{status_code=~"5.."} rate > threshold
 *     - chat_websocket_connections_active dropping near zero
 *     - chat_circuit_breaker_status > 0 (open / half-open)
 *     - Node / process metrics (high CPU, memory, FD count)
 *   - Sentry (initSentry() in server.ts) captures unhandled errors
 *   - PagerDuty / OpsGenie webhook for P0/P1 escalations
 *   - Health check endpoint consumed by DO monitoring (port 3000 TCP)
 */
import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from "prom-client";

export const register = new Registry();

collectDefaultMetrics({ register, prefix: "chat_" });

export const httpRequestsTotal = new Counter({
  name: "chat_http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: "chat_http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const websocketConnections = new Gauge({
  name: "chat_websocket_connections_active",
  help: "Number of active WebSocket connections",
  registers: [register],
});

export const websocketMessagesTotal = new Counter({
  name: "chat_websocket_messages_total",
  help: "Total number of WebSocket messages",
  labelNames: ["event", "direction"],
  registers: [register],
});

export const dbQueryDuration = new Histogram({
  name: "chat_db_query_duration_seconds",
  help: "Database query duration in seconds",
  labelNames: ["operation", "table"],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

export const webhookDeliveriesTotal = new Counter({
  name: "chat_webhook_deliveries_total",
  help: "Total number of webhook deliveries",
  labelNames: ["status", "event"],
  registers: [register],
});

export const messagesCreatedTotal = new Counter({
  name: "chat_messages_created_total",
  help: "Total number of messages created",
  labelNames: ["channel_id"],
  registers: [register],
});

export const authAttemptsTotal = new Counter({
  name: "chat_auth_attempts_total",
  help: "Total number of authentication attempts",
  labelNames: ["result"],
  registers: [register],
});

// Business metrics
export const activeWorkspaces = new Gauge({
  name: "chat_active_workspaces",
  help: "Number of workspaces with activity in last 24h",
  registers: [register],
});

export const activeUsers = new Gauge({
  name: "chat_active_users",
  help: "Number of users active in last 24h",
  registers: [register],
});

export const workspacesCreatedTotal = new Counter({
  name: "chat_workspaces_created_total",
  help: "Total number of workspaces created",
  registers: [register],
});

export const channelsCreatedTotal = new Counter({
  name: "chat_channels_created_total",
  help: "Total number of channels created",
  registers: [register],
});

export const reactionsCreatedTotal = new Counter({
  name: "chat_reactions_created_total",
  help: "Total number of reactions created",
  registers: [register],
});

export const notificationsCreatedTotal = new Counter({
  name: "chat_notifications_created_total",
  help: "Total number of notifications created",
  labelNames: ["type"],
  registers: [register],
});

export const filesUploadedTotal = new Counter({
  name: "chat_files_uploaded_total",
  help: "Total number of files uploaded",
  registers: [register],
});

export const searchQueriesTotal = new Counter({
  name: "chat_search_queries_total",
  help: "Total number of search queries executed",
  registers: [register],
});

export const circuitBreakerStatus = new Gauge({
  name: "chat_circuit_breaker_status",
  help: "Circuit breaker status (0=closed, 1=half-open, 2=open)",
  labelNames: ["name"],
  registers: [register],
});

export const idempotencyKeyHits = new Counter({
  name: "chat_idempotency_key_hits_total",
  help: "Total number of idempotent requests served from cache",
  registers: [register],
});

export function incrementWebsocketConnections(delta: number) {
  websocketConnections.inc(delta);
}

export function recordWebsocketMessage(event: string, direction: "in" | "out") {
  websocketMessagesTotal.inc({ event, direction });
}

export function recordDbQuery(operation: string, table: string, durationSeconds: number) {
  dbQueryDuration.observe({ operation, table }, durationSeconds);
}

export function recordWebhookDelivery(status: "success" | "failed", event: string) {
  webhookDeliveriesTotal.inc({ status, event });
}

export function recordMessageCreated(channelId: string) {
  messagesCreatedTotal.inc({ channel_id: channelId });
}

export function recordAuthAttempt(result: "success" | "failure") {
  authAttemptsTotal.inc({ result });
}

export function setActiveWorkspaces(count: number) {
  activeWorkspaces.set(count);
}

export function setActiveUsers(count: number) {
  activeUsers.set(count);
}

export function recordWorkspaceCreated() {
  workspacesCreatedTotal.inc();
}

export function recordChannelCreated() {
  channelsCreatedTotal.inc();
}

export function recordReactionCreated() {
  reactionsCreatedTotal.inc();
}

export function recordNotificationCreated(type: string) {
  notificationsCreatedTotal.inc({ type });
}

export function recordFileUploaded() {
  filesUploadedTotal.inc();
}

export function recordSearchQuery() {
  searchQueriesTotal.inc();
}

export function setCircuitBreakerStatus(name: string, status: "closed" | "half-open" | "open") {
  const value = status === "closed" ? 0 : status === "half-open" ? 1 : 2;
  circuitBreakerStatus.set({ name }, value);
}

export function recordIdempotencyKeyHit() {
  idempotencyKeyHits.inc();
}
