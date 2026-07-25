import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireWorkspaceMembership } from "../../middleware/require-membership.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { BadRequestError, InternalServerError } from "../../lib/app-error.js";

const router = Router();
router.use(authenticate);

router.get(
  "/workspaces/:workspaceId/emoji",
  requireWorkspaceMembership("workspaceId"),
  asyncHandler(async (req, res) => {
    const { data } = await req
      .supabase!.from("custom_emoji")
      .select("*")
      .eq("workspace_id", req.params.workspaceId as string)
      .order("name", { ascending: true });
    res.json({ emoji: data ?? [] });
  }),
);

router.post(
  "/workspaces/:workspaceId/emoji",
  requireWorkspaceMembership("workspaceId"),
  asyncHandler(async (req, res) => {
    const { name, imageUrl } = req.body;
    if (!name || !imageUrl) {
      throw new BadRequestError("name and imageUrl required");
    }
    const { data, error } = await req
      .supabase!.from("custom_emoji")
      .insert({
        workspace_id: req.params.workspaceId as string,
        name: name.toLowerCase().replace(/[^a-z0-9_-]/g, ""),
        image_url: imageUrl,
        created_by: req.userId,
      })
      .select("*")
      .single();
    if (error) {
      throw new InternalServerError(error.message);
    }
    res.status(201).json({ emoji: data });
  }),
);

router.delete(
  "/emoji/:id",
  asyncHandler(async (req, res) => {
    const { data: emoji, error: fetchError } = await req
      .supabase!.from("custom_emoji")
      .select("workspace_id")
      .eq("id", req.params.id as string)
      .single();
    if (fetchError || !emoji) {
      throw new BadRequestError("Emoji not found");
    }

    const { data: membership, error: memError } = await req
      .supabase!.from("workspace_members")
      .select("role")
      .eq("workspace_id", emoji.workspace_id)
      .eq("user_id", req.userId)
      .single();
    if (memError || !membership) {
      throw new BadRequestError("Not a member of this workspace");
    }

    const { error } = await req
      .supabase!.from("custom_emoji")
      .delete()
      .eq("id", req.params.id as string);
    if (error) {
      throw new InternalServerError(error.message);
    }
    res.status(204).send();
  }),
);

export default router;
