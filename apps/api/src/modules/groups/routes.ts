import { Router, type Request, type Response, type NextFunction } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireWorkspaceMembership } from "../../middleware/require-membership.js";
import { validateUuidParam } from "../../middleware/validate-uuid.js";
import { asyncHandler } from "../../lib/async-handler.js";
import {
  BadRequestError,
  InternalServerError,
  ForbiddenError,
  NotFoundError,
} from "../../lib/app-error.js";

async function requireGroupAccess(req: Request, _res: Response, next: NextFunction) {
  const { data: group } = await req
    .supabase!.from("user_groups")
    .select("workspace_id")
    .eq("id", req.params.id as string)
    .single();

  if (!group) throw new NotFoundError("Group not found");

  const { data: member } = await req
    .supabase!.from("workspace_members")
    .select("role")
    .eq("workspace_id", group.workspace_id)
    .eq("user_id", req.userId)
    .single();

  if (!member) throw new ForbiddenError("Not a member of this workspace");
  next();
}

const router = Router();
router.use(authenticate);

router.get(
  "/workspaces/:workspaceId/groups",
  validateUuidParam("workspaceId"),
  requireWorkspaceMembership("workspaceId"),
  asyncHandler(async (req, res) => {
    const { data } = await req
      .supabase!.from("user_groups")
      .select("*, user_group_members!inner(user_id, users!inner(email, display_name))")
      .eq("workspace_id", req.params.workspaceId as string)
      .order("display_name", { ascending: true });
    res.json({ groups: data ?? [] });
  }),
);

router.post(
  "/workspaces/:workspaceId/groups",
  validateUuidParam("workspaceId"),
  requireWorkspaceMembership("workspaceId"),
  asyncHandler(async (req, res) => {
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
  }),
);

router.post(
  "/groups/:id/members",
  validateUuidParam("id"),
  requireGroupAccess,
  asyncHandler(async (req, res) => {
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
  }),
);

router.delete(
  "/groups/:id/members/:userId",
  validateUuidParam("id"),
  validateUuidParam("userId"),
  requireGroupAccess,
  asyncHandler(async (req, res) => {
    const { error } = await req
      .supabase!.from("user_group_members")
      .delete()
      .eq("group_id", req.params.id as string)
      .eq("user_id", req.params.userId as string);
    if (error) {
      throw new InternalServerError(error.message);
    }
    res.status(204).send();
  }),
);

router.delete(
  "/groups/:id",
  validateUuidParam("id"),
  requireGroupAccess,
  asyncHandler(async (req, res) => {
    const { error } = await req
      .supabase!.from("user_groups")
      .delete()
      .eq("id", req.params.id as string);
    if (error) {
      throw new InternalServerError(error.message);
    }
    res.status(204).send();
  }),
);

export default router;
