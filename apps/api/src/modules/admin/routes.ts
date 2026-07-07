import { Router, type Request, type Response, type NextFunction } from "express";
import * as Sentry from "@sentry/node";
import { getSupabaseAdmin } from "../../lib/supabase.js";
import { authenticate } from "../../middleware/authenticate.js";
import { logger } from "../../lib/logger.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { InternalServerError, ForbiddenError } from "../../lib/app-error.js";
import { loadEnv } from "../../config/env.js";

const router = Router();
const startTime = Date.now();

async function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  try {
    const supabase = req.supabase;
    if (!supabase) {
      next(new ForbiddenError("Auth context missing"));
      return;
    }
    const { data, error } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("user_id", req.userId)
      .in("role", ["owner", "admin"])
      .limit(1);
    if (error || !data || data.length === 0) {
      next(new ForbiddenError("Admin access required"));
      return;
    }
    next();
  } catch (err) {
    next(new ForbiddenError("Admin access check failed"));
  }
}

router.get("/stats", authenticate, requireAdmin, asyncHandler(async (_req: Request, res: Response) => {
  const admin = getSupabaseAdmin();
  const [{ count: users }, { count: workspaces }, { count: channels }, { count: messages }] =
    await Promise.all([
      admin.from("users").select("*", { count: "exact", head: true }),
      admin.from("workspaces").select("*", { count: "exact", head: true }),
      admin.from("channels").select("*", { count: "exact", head: true }),
      admin.from("messages").select("*", { count: "exact", head: true }),
    ]);
  res.json({ stats: { users, workspaces, channels, messages } });
}));

router.get("/users", authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const admin = getSupabaseAdmin();
  const search = req.query.search as string;
  const page = parseInt(req.query.page as string) || 0;
  const limit = 20;
  let query = admin
    .from("users")
    .select("*", { count: "exact" })
    .range(page * limit, (page + 1) * limit - 1)
    .order("created_at", { ascending: false });
  if (search) query = query.or(`email.ilike.%${search}%,display_name.ilike.%${search}%`);
  const { data, error, count } = await query;
  if (error) throw new InternalServerError(error.message);
  res.json({ users: data, total: count ?? 0, page, limit });
}));

router.get("/channels", authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const admin = getSupabaseAdmin();
  const page = parseInt(req.query.page as string) || 0;
  const limit = 20;
  const { data, error, count } = await admin
    .from("channels")
    .select("*, workspaces!inner(name, slug)", { count: "exact" })
    .range(page * limit, (page + 1) * limit - 1)
    .order("created_at", { ascending: false });
  if (error) throw new InternalServerError(error.message);
  res.json({ channels: data, total: count ?? 0, page, limit });
}));

router.get("/workspaces", authenticate, requireAdmin, asyncHandler(async (_req: Request, res: Response) => {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("workspaces")
    .select("*, workspace_members(count)")
    .order("created_at", { ascending: false });
  if (error) throw new InternalServerError(error.message);
  res.json({ workspaces: data });
}));

router.get("/integrations", authenticate, requireAdmin, asyncHandler(async (_req: Request, res: Response) => {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("webhook_endpoints")
    .select("*, workspaces(name, slug)")
    .order("created_at", { ascending: false });
  if (error) throw new InternalServerError(error.message);
  res.json({ integrations: data });
}));

router.get("/health", authenticate, requireAdmin, asyncHandler(async (_req: Request, res: Response) => {
  const env = loadEnv();
  const checks: Record<string, { status: string; latencyMs?: number; message?: string; queueCounts?: Record<string, number> }> = {
    server: { status: "healthy" },
  };

  try {
    const dbStart = Date.now();
    const admin = getSupabaseAdmin();
    const { error } = await admin.from("workspaces").select("id", { count: "exact", head: true });
    checks.database = {
      status: error ? "unhealthy" : "healthy",
      latencyMs: Date.now() - dbStart,
      message: error?.message,
    };
  } catch (err) {
    checks.database = { status: "unhealthy", message: String(err) };
  }

  if (env.REDIS_URL) {
    try {
      const { default: Redis } = await import("ioredis");
      const redis = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        retryStrategy: null,
        lazyConnect: true,
        connectTimeout: 3000,
      });
      await redis.connect();
      await redis.ping();
      checks.redis = { status: "healthy" };
      await redis.quit().catch(() => {});
    } catch (err) {
      checks.redis = { status: "unhealthy", message: String(err) };
    }
  } else {
    checks.redis = { status: "degraded", message: "REDIS_URL not configured" };
  }

  const queueNames = ["webhook-delivery", "notification", "search-indexing", "cleanup", "data-retention"];
  const queueCounts: Record<string, number> = {};
  let workersOk = true;

  if (env.REDIS_URL) {
    for (const name of queueNames) {
      queueCounts[name] = 0;
    }
    try {
      const { default: Redis } = await import("ioredis");
      const redis = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        retryStrategy: null,
        lazyConnect: true,
        connectTimeout: 3000,
      });
      await redis.connect();
      for (const name of queueNames) {
        const count = await redis.llen(`bull:${name}:wait`).catch(() => 0);
        queueCounts[name] = (queueCounts[name] ?? 0) + count;
      }
      await redis.quit().catch(() => {});
    } catch {
      workersOk = false;
    }
  } else {
    workersOk = false;
  }

  checks.workers = {
    status: workersOk ? "healthy" : "degraded",
    queueCounts,
  };

  const hasUnhealthy = Object.values(checks).some((c) => c.status === "unhealthy");
  const hasDegraded = Object.values(checks).some((c) => c.status === "degraded");

  res.json({
    service: "api",
    status: hasUnhealthy ? "unhealthy" : hasDegraded ? "degraded" : "healthy",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks,
  });
}));

router.get("/system", authenticate, requireAdmin, asyncHandler(async (_req: Request, res: Response) => {
  let dbStatus = "unknown";
  let dbLatencyMs: number | undefined;
  try {
    const dbSpan = Sentry.startInactiveSpan({ op: "db.query", name: "admin health check", onlyIfParent: true });
    const dbStart = Date.now();
    const admin = getSupabaseAdmin();
    const { error } = await admin.from("workspaces").select("id", { count: "exact", head: true });
    dbLatencyMs = Date.now() - dbStart;
    dbStatus = error ? "unreachable" : "connected";
    if (dbSpan) { dbSpan.setAttribute("db.latency_ms", dbLatencyMs); dbSpan.end(); }
  } catch (err) {
    dbStatus = "unreachable";
    logger.error("Admin system check DB failure", { error: String(err) });
  }

  res.json({
    version: process.env.npm_package_version ?? "0.0.0",
    environment: process.env.NODE_ENV ?? "development",
    uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    database: dbStatus,
    db_latency_ms: dbLatencyMs,
    timestamp: new Date().toISOString(),
  });
}));

router.get("/webhooks/deliveries", authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const admin = getSupabaseAdmin();
  const page = parseInt(req.query.page as string) || 0;
  const limit = 20;
  const webhookId = req.query.webhook_id as string | undefined;
  let query = admin
    .from("webhook_deliveries")
    .select("*, webhook_endpoints!inner(name, workspace_id)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(page * limit, (page + 1) * limit - 1);
  if (webhookId) query = query.eq("webhook_id", webhookId);
  const { data, error, count } = await query;
  if (error) throw new InternalServerError(error.message);
  res.json({ deliveries: data, total: count ?? 0, page, limit });
}));

router.get("/webhooks/dead-letters", authenticate, requireAdmin, asyncHandler(async (_req: Request, res: Response) => {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("webhook_dead_letters")
    .select("*, webhook_endpoints!inner(name, workspace_id)")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new InternalServerError(error.message);
  res.json({ deadLetters: data ?? [] });
}));

router.post("/webhooks/dead-letters/:id/retry", authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { webhookService } = await import("../../modules/webhooks/service.js");
  const success = await webhookService.retryDeadLetter(req.params.id as string);
  if (!success) res.status(404).json({ error: "Dead letter not found or webhook inactive" });
  else res.json({ success: true });
}));

router.get("/export/compliance", authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const admin = getSupabaseAdmin();
  const workspaceId = req.query.workspace_id as string | undefined;

  async function fetchAll(query: any) {
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  const exportMeta = {
    exported_at: new Date().toISOString(),
    workspace_id: workspaceId ?? "all",
    format_version: "1.0",
  };

  type ExportTask = { key: string; fn: () => Promise<unknown> };
  const tasks: ExportTask[] = [
    { key: "export_meta", fn: async () => exportMeta },
  ];

  if (!workspaceId || workspaceId === "all") {
    tasks.push({ key: "users", fn: () => fetchAll(admin.from("users").select("*").order("created_at", { ascending: true })) });
  }

  tasks.push(
    { key: "workspaces", fn: () => fetchAll(admin.from("workspaces").select("*").order("created_at", { ascending: true })) },
    { key: "channels", fn: () => fetchAll(admin.from("channels").select("*").order("created_at", { ascending: true })) },
    { key: "messages", fn: () => fetchAll(
      admin.from("messages").select("id, channel_id, user_id, content, parent_id, is_pinned, priority, created_at, edited_at, deleted_at")
        .order("created_at", { ascending: true })
    )},
    { key: "audit_logs", fn: () => fetchAll(admin.from("audit_logs").select("*").order("created_at", { ascending: true })) },
  );

  const results = await Promise.allSettled(tasks.map((t) => t.fn()));

  const data: Record<string, unknown> = {};
  const errs: string[] = [];
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === "fulfilled") {
      data[tasks[i].key] = r.value;
    } else {
      errs.push(`${tasks[i].key}: ${r.reason?.message ?? String(r.reason)}`);
    }
  }

  if (errs.length > 0) {
    logger.warn("Compliance export completed with errors", { errors: errs });
    data.errors = errs;
  }

  const timestamp = Date.now();
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename="compliance-export-${timestamp}.json"`);
  res.json(data);
}));

export default router;
