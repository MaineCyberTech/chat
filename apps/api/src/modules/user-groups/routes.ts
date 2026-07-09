import { Router, type Request, type Response } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { BadRequestError, InternalServerError } from "../../lib/app-error.js";

const router = Router();
router.use(authenticate);

// GET /v1/groups?workspace_id=xxx - list groups with member counts
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const workspaceId = req.query.workspace_id as string;
    if (!workspaceId) {
      throw new BadRequestError("workspace_id required");
    }
    const { data: membership } = await req
      .supabase!.from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", req.userId)
      .maybeSingle();
    if (!membership) {
      res
        .status(403)
        .json({ error: { code: "FORBIDDEN", message: "Not a member of this workspace" } });
      return;
    }
    (req as Request & { workspaceRole?: string }).workspaceRole = membership.role;
    const { data, error } = await req
      .supabase!.from("user_groups")
      .select("*, user_group_members(count)")
      .eq("workspace_id", workspaceId)
      .order("name");
    if (error) {
      throw new InternalServerError(error.message);
    }
    res.json({ groups: data });
  }),
);

// POST /v1/groups
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { workspace_id, name, description, member_ids } = req.body;
    if (!workspace_id || !name) {
      throw new BadRequestError("workspace_id and name required");
    }
    const { data: membership } = await req
      .supabase!.from("workspace_members")
      .select("role")
      .eq("workspace_id", workspace_id)
      .eq("user_id", req.userId)
      .maybeSingle();
    if (!membership) {
      res
        .status(403)
        .json({ error: { code: "FORBIDDEN", message: "Not a member of this workspace" } });
      return;
    }
    (req as Request & { workspaceRole?: string }).workspaceRole = membership.role;
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
      throw new InternalServerError(gErr.message);
    }

    if (member_ids && Array.isArray(member_ids) && member_ids.length > 0) {
      const members = member_ids.map((uid: string) => ({ group_id: group.id, user_id: uid }));
      await req.supabase!.from("user_group_members").insert(members);
    }

    res.status(201).json({ group });
  }),
);

// PATCH /v1/groups/:id
router.patch(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
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
      throw new InternalServerError(error.message);
    }
    res.json({ group: data });
  }),
);

// DELETE /v1/groups/:id
router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    // Verify workspace membership before allowing group deletion
    const { data: group } = await req
      .supabase!.from("user_groups")
      .select("workspace_id")
      .eq("id", req.params.id)
      .single();
    if (group) {
      const { data: membership } = await req
        .supabase!.from("workspace_members")
        .select("role")
        .eq("workspace_id", group.workspace_id)
        .eq("user_id", req.userId)
        .maybeSingle();
      if (!membership) {
        res
          .status(403)
          .json({ error: { code: "FORBIDDEN", message: "Not a member of this workspace" } });
        return;
      }
    }
    const { error } = await req
      .supabase!.from("user_groups")
      .delete()
      .eq("id", req.params.id)
      .eq("created_by", req.userId);
    if (error) {
      throw new InternalServerError(error.message);
    }
    res.json({ success: true });
  }),
);

// GET /v1/groups/:id/members - list members of a group
router.get(
  "/:id/members",
  asyncHandler(async (req: Request, res: Response) => {
    const { data, error } = await req
      .supabase!.from("user_group_members")
      .select("*, users!inner(email, display_name)")
      .eq("group_id", req.params.id);
    if (error) {
      throw new InternalServerError(error.message);
    }
    res.json({ members: data });
  }),
);

// POST /v1/groups/:id/members - add members to group
router.post(
  "/:id/members",
  asyncHandler(async (req: Request, res: Response) => {
    const { user_ids } = req.body;
    if (!Array.isArray(user_ids)) {
      throw new BadRequestError("user_ids array required");
    }
    const members = user_ids.map((uid: string) => ({ group_id: req.params.id, user_id: uid }));
    const { data, error } = await req.supabase!.from("user_group_members").insert(members).select();
    if (error) {
      throw new InternalServerError(error.message);
    }
    res.status(201).json({ members: data });
  }),
);

// DELETE /v1/groups/:id/members/:userId - remove member
router.delete(
  "/:id/members/:userId",
  asyncHandler(async (req: Request, res: Response) => {
    const { error } = await req
      .supabase!.from("user_group_members")
      .delete()
      .eq("group_id", req.params.id)
      .eq("user_id", req.params.userId);
    if (error) {
      throw new InternalServerError(error.message);
    }
    res.json({ success: true });
  }),
);

export default router;
