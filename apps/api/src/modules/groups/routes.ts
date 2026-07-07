import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { BadRequestError, InternalServerError } from "../../lib/app-error.js";

const router = Router();
router.use(authenticate);

router.get("/workspaces/:workspaceId/groups", asyncHandler(async (req, res) => {
  const { data } = await req
    .supabase!.from("user_groups")
    .select("*, user_group_members!inner(user_id, users!inner(email, display_name))")
    .eq("workspace_id", req.params.workspaceId as string)
    .order("display_name", { ascending: true });
  res.json({ groups: data ?? [] });
}));

router.post("/workspaces/:workspaceId/groups", asyncHandler(async (req, res) => {
  const { name, displayName, description, memberIds } = req.body;
  if (!name || !displayName) {
    throw new BadRequestError("name and displayName required");
  }
  const slug = name.toLowerCase().replace(/[^a-z0-9_-]/g, "");
  const { data: group, error } = await req
    .supabase!.from("user_groups")
    .insert({
      workspace_id: req.params.workspaceId as string,
      name: slug,
      display_name: displayName,
      description: description ?? null,
      created_by: req.userId,
    })
    .select("*")
    .single();
  if (error) {
    throw new InternalServerError(error.message);
  }
  if (memberIds?.length > 0) {
    await req
      .supabase!.from("user_group_members")
      .insert(memberIds.map((uid: string) => ({ group_id: group.id, user_id: uid })));
  }
  res.status(201).json({ group });
}));

router.post("/groups/:id/members", asyncHandler(async (req, res) => {
  const { userIds } = req.body;
  if (!userIds?.length) {
    throw new BadRequestError("userIds required");
  }
  const { error } = await req
    .supabase!.from("user_group_members")
    .insert(userIds.map((uid: string) => ({ group_id: req.params.id as string, user_id: uid })));
  if (error) {
    throw new InternalServerError(error.message);
  }
  res.status(201).json({ success: true });
}));

router.delete("/groups/:id/members/:userId", asyncHandler(async (req, res) => {
  const { error } = await req
    .supabase!.from("user_group_members")
    .delete()
    .eq("group_id", req.params.id as string)
    .eq("user_id", req.params.userId as string);
  if (error) {
    throw new InternalServerError(error.message);
  }
  res.status(204).send();
}));

router.delete("/groups/:id", asyncHandler(async (req, res) => {
  const { error } = await req
    .supabase!.from("user_groups")
    .delete()
    .eq("id", req.params.id as string);
  if (error) {
    throw new InternalServerError(error.message);
  }
  res.status(204).send();
}));

export default router;
