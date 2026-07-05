import { Router, type Request, type Response } from "express";
import type { SupabaseClient } from "@supabase/supabase-js";
import { authenticate as requireAuth } from "../../middleware/authenticate.js";
import { validateUuidParam } from "../../middleware/validate-uuid.js";

const router = Router();

// GET /v1/sidebar-categories?workspace_id=xxx - list categories with channel assignments
router.get("/", requireAuth, async (req: Request, res: Response) => {
  const workspaceId = req.query.workspace_id as string;
  if (!workspaceId) return res.status(400).json({ error: "workspace_id required" });

  const supabase = req.supabase as SupabaseClient;

  const { data: categories, error: catErr } = await supabase
    .from("sidebar_categories")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("user_id", req.userId)
    .order("sort_order");

  if (catErr) return res.status(500).json({ error: catErr.message });

  const categoryIds = categories.map((c) => c.id);

  const { data: assignments, error: asgnErr } = await supabase
    .from("sidebar_channel_assignments")
    .select("*")
    .in(
      "category_id",
      categoryIds.length > 0 ? categoryIds : ["00000000-0000-0000-0000-000000000000"],
    )
    .order("sort_order");

  if (asgnErr) return res.status(500).json({ error: asgnErr.message });

  const grouped = categories.map((cat) => ({
    ...cat,
    channels: (assignments ?? []).filter((a) => a.category_id === cat.id).map((a) => a.channel_id),
  }));

  res.json({ categories: grouped });
});

// POST /v1/sidebar-categories - create a category
router.post("/", requireAuth, async (req: Request, res: Response) => {
  const { workspace_id, name } = req.body;
  if (!workspace_id || !name)
    return res.status(400).json({ error: "workspace_id and name required" });

  const supabase = req.supabase as SupabaseClient;

  const { data: existing } = await supabase
    .from("sidebar_categories")
    .select("sort_order")
    .eq("workspace_id", workspace_id)
    .eq("user_id", req.userId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  const { data, error } = await supabase
    .from("sidebar_categories")
    .insert({ workspace_id, user_id: req.userId, name, sort_order: nextOrder })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ category: data });
});

// PATCH /v1/sidebar-categories/:id - rename
router.patch("/:id", requireAuth, validateUuidParam("id"), async (req: Request, res: Response) => {
  const { name, sort_order } = req.body;
  const supabase = req.supabase as SupabaseClient;

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (sort_order !== undefined) updates.sort_order = sort_order;

  const { data, error } = await supabase
    .from("sidebar_categories")
    .update(updates)
    .eq("id", req.params.id)
    .eq("user_id", req.userId)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ category: data });
});

// DELETE /v1/sidebar-categories/:id
router.delete("/:id", requireAuth, validateUuidParam("id"), async (req: Request, res: Response) => {
  const supabase = req.supabase as SupabaseClient;

  const { error } = await supabase
    .from("sidebar_categories")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.userId);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// POST /v1/sidebar-categories/:id/assignments - add channel to category
router.post(
  "/:id/assignments",
  requireAuth,
  validateUuidParam("id"),
  async (req: Request, res: Response) => {
    const { channel_id } = req.body;
    if (!channel_id) return res.status(400).json({ error: "channel_id required" });

    const supabase = req.supabase as SupabaseClient;

    const { data: cat } = await supabase
      .from("sidebar_categories")
      .select("id")
      .eq("id", req.params.id)
      .eq("user_id", req.userId)
      .single();

    if (!cat) return res.status(404).json({ error: "Category not found" });

    const { data: existing } = await supabase
      .from("sidebar_channel_assignments")
      .select("sort_order")
      .eq("category_id", req.params.id)
      .order("sort_order", { ascending: false })
      .limit(1);

    const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

    const { data, error } = await supabase
      .from("sidebar_channel_assignments")
      .insert({ category_id: req.params.id, channel_id, sort_order: nextOrder })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ assignment: data });
  },
);

// DELETE /v1/sidebar-categories/:id/assignments/:channelId - remove channel from category
router.delete(
  "/:id/assignments/:channelId",
  requireAuth,
  validateUuidParam("id"),
  validateUuidParam("channelId"),
  async (req: Request, res: Response) => {
    const supabase = req.supabase as SupabaseClient;

    const { error } = await supabase
      .from("sidebar_channel_assignments")
      .delete()
      .eq("category_id", req.params.id)
      .eq("channel_id", req.params.channelId);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  },
);

// PATCH /v1/sidebar-categories/reorder - reorder all categories
router.patch("/reorder", requireAuth, async (req: Request, res: Response) => {
  const { categoryIds } = req.body as { categoryIds: string[] };
  if (!Array.isArray(categoryIds))
    return res.status(400).json({ error: "categoryIds array required" });

  const supabase = req.supabase as SupabaseClient;
  const errors: string[] = [];

  for (let i = 0; i < categoryIds.length; i++) {
    const { error } = await supabase
      .from("sidebar_categories")
      .update({ sort_order: i })
      .eq("id", categoryIds[i])
      .eq("user_id", req.userId);
    if (error) errors.push(error.message);
  }

  if (errors.length > 0) return res.status(500).json({ error: errors.join("; ") });
  res.json({ success: true });
});

// PATCH /v1/sidebar-categories/:id/assignments/reorder - reorder channels in a category
router.patch(
  "/:id/assignments/reorder",
  requireAuth,
  validateUuidParam("id"),
  async (req: Request, res: Response) => {
    const { channelIds } = req.body as { channelIds: string[] };
    if (!Array.isArray(channelIds))
      return res.status(400).json({ error: "channelIds array required" });

    const supabase = req.supabase as SupabaseClient;
    const errors: string[] = [];

    for (let i = 0; i < channelIds.length; i++) {
      const { error } = await supabase
        .from("sidebar_channel_assignments")
        .update({ sort_order: i })
        .eq("category_id", req.params.id)
        .eq("channel_id", channelIds[i]);
      if (error) errors.push(error.message);
    }

    if (errors.length > 0) return res.status(500).json({ error: errors.join("; ") });
    res.json({ success: true });
  },
);

export default router;
