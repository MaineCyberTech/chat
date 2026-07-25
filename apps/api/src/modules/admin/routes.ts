import { Router, type Request, type Response, type NextFunction } from "express";
import * as Sentry from "@sentry/node";
import { getSupabaseAdmin } from "../../lib/supabase.js";
import { authenticate } from "../../middleware/authenticate.js";
import { logger } from "../../lib/logger.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { InternalServerError, ForbiddenError } from "../../lib/app-error.js";
import { loadEnv } from "../../config/env.js";
import { getErrors } from "./error-buffer.js";

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
      .select("workspace_id, role")
      .eq("user_id", req.userId)
      .in("role", ["owner", "admin"]);
    if (error || !data || data.length === 0) {
      next(new ForbiddenError("Admin access required"));
      return;
    }
    (req as Request & { adminWorkspaceIds?: string[] }).adminWorkspaceIds = data.map(
      (m: { workspace_id: string }) => m.workspace_id,
    );
    next();
  } catch {
    next(new ForbiddenError("Admin access check failed"));
  }
}

async function getAdminWorkspaceIds(req: Request): Promise<string[]> {
  return (
    (req as Request & { adminWorkspaceIds?: string[] }).adminWorkspaceIds ??
    (
      await req
        .supabase!.from("workspace_members")
        .select("workspace_id")
        .eq("user_id", req.userId)
        .in("role", ["owner", "admin"])
    ).data?.map((m: { workspace_id: string }) => m.workspace_id) ?? []
  );
}

async function verifyWorkspaceMembership(
  req: Request,
  workspaceId: string,
): Promise<void> {
  const supabase = req.supabase;
  if (!supabase) throw new ForbiddenError("Auth context missing");
  const { data } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", req.userId)
    .single();
  if (!data) throw new ForbiddenError("Not a member of this workspace");
}

router.get(
  "/stats",
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const admin = getSupabaseAdmin();
    const workspaceIds = await getAdminWorkspaceIds(req);

    const [{ count: users }, { count: workspaces }, { count: channels }, { count: messages }] =
      await Promise.all([
        admin.from("users").select("*", { count: "exact", head: true }),
        admin.from("workspaces").select("*", { count: "exact", head: true }).in("id", workspaceIds),
        admin.from("channels").select("*", { count: "exact", head: true }).in("workspace_id", workspaceIds),
        admin.from("messages").select("*", { count: "exact", head: true }),
      ]);
    res.json({ stats: { users, workspaces, channels, messages } });
  }),
);

router.get(
  "/users",
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
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
  }),
);

router.get(
  "/channels",
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const admin = getSupabaseAdmin();
    const workspaceIds = await getAdminWorkspaceIds(req);
    const page = parseInt(req.query.page as string) || 0;
    const limit = 20;
    const { data, error, count } = await admin
      .from("channels")
      .select("*, workspaces!inner(name, slug)", { count: "exact" })
      .in("workspace_id", workspaceIds)
      .range(page * limit, (page + 1) * limit - 1)
      .order("created_at", { ascending: false });
    if (error) throw new InternalServerError(error.message);
    res.json({ channels: data, total: count ?? 0, page, limit });
  }),
);

router.get(
  "/workspaces",
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const admin = getSupabaseAdmin();
    const workspaceIds = await getAdminWorkspaceIds(req);
    const { data, error } = await admin
      .from("workspaces")
      .select("*, workspace_members(count)")
      .in("id", workspaceIds)
      .order("created_at", { ascending: false });
    if (error) throw new InternalServerError(error.message);
    res.json({ workspaces: data });
  }),
);

router.get(
  "/integrations",
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const admin = getSupabaseAdmin();
    const workspaceIds = await getAdminWorkspaceIds(req);
    const { data, error } = await admin
      .from("webhook_endpoints")
      .select("*, workspaces(name, slug)")
      .in("workspace_id", workspaceIds)
      .order("created_at", { ascending: false });
    if (error) throw new InternalServerError(error.message);
    res.json({ integrations: data });
  }),
);

router.get(
  "/health",
  authenticate,
  requireAdmin,
  asyncHandler(async (_req: Request, res: Response) => {
    const env = loadEnv();
    const checks: Record<
      string,
      { status: string; latencyMs?: number; message?: string; queueCounts?: Record<string, number> }
    > = {
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
      } catch (_err) {
        checks.redis = { status: "unhealthy", message: String(_err) };
      }
    } else {
      checks.redis = { status: "degraded", message: "REDIS_URL not configured" };
    }

    const queueNames = [
      "webhook-delivery",
      "notification",
      "search-indexing",
      "cleanup",
      "data-retention",
    ];
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
  }),
);

router.get(
  "/system",
  authenticate,
  requireAdmin,
  asyncHandler(async (_req: Request, res: Response) => {
    let dbStatus = "unknown";
    let dbLatencyMs: number | undefined;
    try {
      const dbSpan = Sentry.startInactiveSpan({
        op: "db.query",
        name: "admin health check",
        onlyIfParent: true,
      });
      const dbStart = Date.now();
      const admin = getSupabaseAdmin();
      const { error } = await admin.from("workspaces").select("id", { count: "exact", head: true });
      dbLatencyMs = Date.now() - dbStart;
      dbStatus = error ? "unreachable" : "connected";
      if (dbSpan) {
        dbSpan.setAttribute("db.latency_ms", dbLatencyMs);
        dbSpan.end();
      }
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
  }),
);

router.get(
  "/webhooks/deliveries",
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const admin = getSupabaseAdmin();
    const workspaceIds = await getAdminWorkspaceIds(req);
    const page = parseInt(req.query.page as string) || 0;
    const limit = 20;
    const webhookId = req.query.webhook_id as string | undefined;

    const endpointIds = (
      await admin
        .from("webhook_endpoints")
        .select("id")
        .in("workspace_id", workspaceIds)
    ).data?.map((e: { id: string }) => e.id) ?? [];

    let query = admin
      .from("webhook_deliveries")
      .select("*, webhook_endpoints!inner(name, workspace_id)", { count: "exact" })
      .in("webhook_id", endpointIds)
      .order("created_at", { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);
    if (webhookId) query = query.eq("webhook_id", webhookId);
    const { data, error, count } = await query;
    if (error) throw new InternalServerError(error.message);
    res.json({ deliveries: data, total: count ?? 0, page, limit });
  }),
);

router.get(
  "/webhooks/dead-letters",
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const admin = getSupabaseAdmin();
    const workspaceIds = await getAdminWorkspaceIds(req);

    const endpointIds = (
      await admin
        .from("webhook_endpoints")
        .select("id")
        .in("workspace_id", workspaceIds)
    ).data?.map((e: { id: string }) => e.id) ?? [];

    const { data, error } = await admin
      .from("webhook_dead_letters")
      .select("*, webhook_endpoints!inner(name, workspace_id)")
      .in("webhook_id", endpointIds)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new InternalServerError(error.message);
    res.json({ deadLetters: data ?? [] });
  }),
);

router.post(
  "/webhooks/dead-letters/:id/retry",
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { webhookService } = await import("../../modules/webhooks/service.js");
    const success = await webhookService.retryDeadLetter(req.params.id as string);
    if (!success) res.status(404).json({ error: "Dead letter not found or webhook inactive" });
    else res.json({ success: true });
  }),
);

router.get(
  "/security",
  authenticate,
  requireAdmin,
  asyncHandler(async (_req: Request, res: Response) => {
    const env = loadEnv();
    const _supabaseUrl = env.SUPABASE_URL ?? "";
    const authProviders: Record<string, { enabled: boolean; label: string }> = {
      "magic-link": { enabled: true, label: "Magic Link Email" },
      google: { enabled: !!env.SUPABASE_URL, label: "Google OAuth" },
      github: { enabled: !!env.SUPABASE_URL, label: "GitHub OAuth" },
    };

    const rateLimiters = [
      { name: "API", limit: 100, windowMs: 60000, unit: "requests/min" },
      { name: "Auth", limit: 10, windowMs: 60000, unit: "requests/min" },
      { name: "Search", limit: 30, windowMs: 60000, unit: "requests/min" },
      { name: "Magic Link", limit: 3, windowMs: 60000, unit: "requests/min/IP" },
    ];

    const securityHeaders = [
      { name: "Content-Security-Policy", status: "enabled" as const },
      { name: "Strict-Transport-Security", status: "enabled" as const },
      { name: "X-Content-Type-Options", status: "enabled" as const },
      { name: "X-Frame-Options", status: "enabled" as const },
      { name: "Referrer-Policy", status: "enabled" as const },
      { name: "Permissions-Policy", status: "enabled" as const },
      { name: "Cross-Origin-Embedder-Policy", status: "enabled" as const },
      { name: "Cross-Origin-Opener-Policy", status: "enabled" as const },
    ];

    res.json({
      authProviders,
      rateLimiters,
      securityHeaders,
      sessionConfig: {
        jwtEnabled: true,
        sessionDuration: "1 year",
        refreshTokenRotation: true,
      },
    });
  }),
);

router.get(
  "/logs",
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 200);
    const level = req.query.level as string | undefined;
    const logs = getErrors(limit, level);
    res.json({ logs });
  }),
);

router.get(
  "/config",
  authenticate,
  requireAdmin,
  asyncHandler(async (_req: Request, res: Response) => {
    const env = loadEnv();
    const supabaseUrl = env.SUPABASE_URL ?? "";
    const projectRef = supabaseUrl ? new URL(supabaseUrl).hostname.split(".")[0] : null;
    res.json({
      appName: "Chat",
      version: process.env.npm_package_version ?? "0.0.0",
      environment: env.NODE_ENV,
      frontendUrl: env.FRONTEND_URL,
      apiUrl: env.API_BASE_URL,
      supabaseProjectRef: projectRef,
      redisConfigured: !!env.REDIS_URL,
      smtpConfigured: !!(env.SMTP_HOST && env.SMTP_USER),
      sentryConfigured: !!env.SENTRY_DSN,
      vapidConfigured: !!(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY),
    });
  }),
);

router.get(
  "/audit-logs",
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const admin = getSupabaseAdmin();
    const page = parseInt(req.query.page as string) || 0;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const workspaceId = req.query.workspaceId as string | undefined;
    const action = req.query.action as string | undefined;
    const actorUserId = req.query.actorUserId as string | undefined;
    const dateFrom = req.query.dateFrom as string | undefined;
    const dateTo = req.query.dateTo as string | undefined;

    if (workspaceId) {
      await verifyWorkspaceMembership(req, workspaceId);
    }

    let query = admin
      .from("audit_logs")
      .select("*, auth_users:actor_user_id(email)", { count: "exact" });

    if (workspaceId) query = query.eq("organization_id", workspaceId);
    if (action) query = query.eq("action", action);
    if (actorUserId) query = query.eq("actor_user_id", actorUserId);
    if (dateFrom) query = query.gte("created_at", dateFrom);
    if (dateTo) query = query.lte("created_at", dateTo);

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    if (error) throw new InternalServerError(error.message);
    res.json({ logs: data ?? [], total: count ?? 0, page, limit });
  }),
);

router.get(
  "/export/compliance",
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const admin = getSupabaseAdmin();
    const workspaceId = req.query.workspace_id as string | undefined;

    if (!workspaceId) {
      res.status(400).json({ error: { code: "BAD_REQUEST", message: "workspace_id query param is required" } });
      return;
    }

    await verifyWorkspaceMembership(req, workspaceId);

    async function fetchAll(
      query: PromiseLike<{ data: unknown; error: { message: string } | null }>,
    ) {
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data ?? [];
    }

    const exportMeta = {
      exported_at: new Date().toISOString(),
      workspace_id: workspaceId,
      format_version: "1.0",
    };

    type ExportTask = { key: string; fn: () => Promise<unknown> };
    const tasks: ExportTask[] = [{ key: "export_meta", fn: async () => exportMeta }];

    tasks.push(
      {
        key: "workspaces",
        fn: () =>
          fetchAll(admin.from("workspaces").select("*").eq("id", workspaceId).order("created_at", { ascending: true })),
      },
      {
        key: "channels",
        fn: () =>
          fetchAll(admin.from("channels").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: true })),
      },
      {
        key: "messages",
        fn: async () => {
          const { data: chIds } = await admin
            .from("channels")
            .select("id")
            .eq("workspace_id", workspaceId);
          const ids = (chIds ?? []).map((c: { id: string }) => c.id);
          if (ids.length === 0) return [];
          return fetchAll(
            admin
              .from("messages")
              .select(
                "id, channel_id, user_id, content, parent_id, is_pinned, priority, created_at, edited_at, deleted_at",
              )
              .in("channel_id", ids)
              .order("created_at", { ascending: true }),
          );
        },
      },
      {
        key: "audit_logs",
        fn: () =>
          fetchAll(admin.from("audit_logs").select("*").eq("organization_id", workspaceId).order("created_at", { ascending: true })),
      },
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
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="compliance-export-${timestamp}.json"`,
    );
    res.json(data);
  }),
);

router.get(
  "/exports",
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("compliance_exports")
      .select("id, type, date_from, date_to, row_count, status, error_msg, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw new InternalServerError(error.message);
    res.json({ exports: data ?? [] });
  }),
);

router.get(
  "/exports/:id/download",
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("compliance_exports")
      .select("csv_content, type, date_from, date_to, status")
      .eq("id", req.params.id)
      .single();

    if (error || !data) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Export not found" } });
      return;
    }
    if (data.status !== "completed" || !data.csv_content) {
      res
        .status(400)
        .json({ error: { code: "BAD_REQUEST", message: `Export status: ${data.status}` } });
      return;
    }

    const dateFrom = data.date_from as string;
    const dateTo = data.date_to as string;
    const filename = `compliance-${data.type as string}-${dateFrom.slice(0, 10)}-${dateTo.slice(0, 10)}.csv`;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(data.csv_content);
  }),
);

export default router;
