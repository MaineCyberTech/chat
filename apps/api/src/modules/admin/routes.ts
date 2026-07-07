import { Router, type Request, type Response } from "express";
import { getSupabaseAdmin } from "../../lib/supabase";
import { authenticate } from "../../middleware/authenticate";
import { logger } from "../../lib/logger";
import { asyncHandler } from "../../lib/async-handler";
import { InternalServerError } from "../../lib/app-error";

const router = Router();
const startTime = Date.now();

router.get("/stats", authenticate, asyncHandler(async (_req: Request, res: Response) => {
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

router.get("/users", authenticate, asyncHandler(async (req: Request, res: Response) => {
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

router.get("/channels", authenticate, asyncHandler(async (req: Request, res: Response) => {
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

router.get("/workspaces", authenticate, asyncHandler(async (_req: Request, res: Response) => {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("workspaces")
    .select("*, workspace_members(count)")
    .order("created_at", { ascending: false });
  if (error) throw new InternalServerError(error.message);
  res.json({ workspaces: data });
}));

router.get("/integrations", authenticate, asyncHandler(async (_req: Request, res: Response) => {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("webhook_endpoints")
    .select("*, workspaces(name, slug)")
    .order("created_at", { ascending: false });
  if (error) throw new InternalServerError(error.message);
  res.json({ integrations: data });
}));

router.get("/system", authenticate, asyncHandler(async (_req: Request, res: Response) => {
  let dbStatus = "unknown";
  let dbLatencyMs: number | undefined;
  try {
    const dbStart = Date.now();
    const admin = getSupabaseAdmin();
    const { error } = await admin.from("workspaces").select("id", { count: "exact", head: true });
    dbLatencyMs = Date.now() - dbStart;
    dbStatus = error ? "unreachable" : "connected";
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

export default router;
