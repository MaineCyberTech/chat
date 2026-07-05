import { Router, type Request, type Response } from "express";
import { getSupabaseAdmin } from "../../lib/supabase";
import { authenticate } from "../../middleware/authenticate";

const router = Router();

router.get("/stats", authenticate, async (_req: Request, res: Response) => {
  try {
    const admin = getSupabaseAdmin();
    const [{ count: users }, { count: workspaces }, { count: channels }, { count: messages }] =
      await Promise.all([
        admin.from("users").select("*", { count: "exact", head: true }),
        admin.from("workspaces").select("*", { count: "exact", head: true }),
        admin.from("channels").select("*", { count: "exact", head: true }),
        admin.from("messages").select("*", { count: "exact", head: true }),
      ]);
    res.json({ stats: { users, workspaces, channels, messages } });
  } catch {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

router.get("/users", authenticate, async (req: Request, res: Response) => {
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
  if (error) return res.status(500).json({ error: error.message });
  res.json({ users: data, total: count ?? 0, page, limit });
});

router.get("/channels", authenticate, async (req: Request, res: Response) => {
  const admin = getSupabaseAdmin();
  const page = parseInt(req.query.page as string) || 0;
  const limit = 20;
  const { data, error, count } = await admin
    .from("channels")
    .select("*, workspaces!inner(name, slug)", { count: "exact" })
    .range(page * limit, (page + 1) * limit - 1)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ channels: data, total: count ?? 0, page, limit });
});

router.get("/workspaces", authenticate, async (_req: Request, res: Response) => {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("workspaces")
    .select("*, workspace_members(count)")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ workspaces: data });
});

router.get("/integrations", authenticate, async (_req: Request, res: Response) => {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("webhook_endpoints")
    .select("*, workspaces(name, slug)")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ integrations: data });
});

export default router;
