import { Router, type Request, type Response } from "express";
import { authenticate } from "../../middleware/authenticate.js";

const router = Router();
router.use(authenticate);

// GET /v1/groups?workspace_id=xxx - list groups with member counts
router.get("/", async (req: Request, res: Response) => {
  const workspaceId = req.query.workspace_id as string;
  if (!workspaceId) {
    res.status(400).json({ error: "workspace_id required" });
    return;
  }
  const { data, error } = await req
    .supabase!.from("user_groups")
    .select("*, user_group_members(count)")
    .eq("workspace_id", workspaceId)
    .order("name");
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ groups: data });
});

// POST /v1/groups
router.post("/", async (req: Request, res: Response) => {
  const { workspace_id, name, description, member_ids } = req.body;
  if (!workspace_id || !name) {
    res.status(400).json({ error: "workspace_id and name required" });
    return;
  }
  const { data: group, error: gErr } = await req
    .supabase!.from("user_groups")
    .insert({
      workspace_id,
      name,
      display_name: name,
      description: description ?? "",
      created_by: req.userId,
    })
    .select()
    .single();
  if (gErr) {
    res.status(500).json({ error: gErr.message });
    return;
  }

  if (member_ids && Array.isArray(member_ids) && member_ids.length > 0) {
    const members = member_ids.map((uid: string) => ({ group_id: group.id, user_id: uid }));
    await req.supabase!.from("user_group_members").insert(members);
  }

  res.status(201).json({ group });
});

// PATCH /v1/groups/:id
router.patch("/:id", async (req: Request, res: Response) => {
  const { name, description } = req.body;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  const { data, error } = await req
    .supabase!.from("user_groups")
    .update(updates)
    .eq("id", req.params.id)
    .eq("created_by", req.userId)
    .select()
    .single();
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ group: data });
});

// DELETE /v1/groups/:id
router.delete("/:id", async (req: Request, res: Response) => {
  const { error } = await req
    .supabase!.from("user_groups")
    .delete()
    .eq("id", req.params.id)
    .eq("created_by", req.userId);
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ success: true });
});

// GET /v1/groups/:id/members - list members of a group
router.get("/:id/members", async (req: Request, res: Response) => {
  const { data, error } = await req
    .supabase!.from("user_group_members")
    .select("*, users!inner(email, display_name)")
    .eq("group_id", req.params.id);
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ members: data });
});

// POST /v1/groups/:id/members - add members to group
router.post("/:id/members", async (req: Request, res: Response) => {
  const { user_ids } = req.body;
  if (!Array.isArray(user_ids)) {
    res.status(400).json({ error: "user_ids array required" });
    return;
  }
  const members = user_ids.map((uid: string) => ({ group_id: req.params.id, user_id: uid }));
  const { data, error } = await req.supabase!.from("user_group_members").insert(members).select();
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(201).json({ members: data });
});

// DELETE /v1/groups/:id/members/:userId - remove member
router.delete("/:id/members/:userId", async (req: Request, res: Response) => {
  const { error } = await req
    .supabase!.from("user_group_members")
    .delete()
    .eq("group_id", req.params.id)
    .eq("user_id", req.params.userId);
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ success: true });
});

export default router;
