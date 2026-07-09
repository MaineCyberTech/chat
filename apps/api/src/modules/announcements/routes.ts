import { Router, type Router as RouterType } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateUuidParam } from "../../middleware/validate-uuid.js";
import { requireWorkspaceMembership, requireWorkspaceRole } from "../../middleware/require-membership.js";
import { getSupabase } from "../../lib/supabase.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { BadRequestError, NotFoundError, InternalServerError } from "../../lib/app-error.js";

const router: RouterType = Router();
router.use(authenticate);

router.get(
  "/workspaces/:workspaceId/announcements",
  validateUuidParam("workspaceId"),
  requireWorkspaceMembership("workspaceId"),
  asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("announcements")
      .select("id, title, body, created_by, created_at, updated_at")
      .eq("workspace_id", workspaceId)
      .eq("active", true)
      .order("created_at", { ascending: false });
    if (error) {
      throw new InternalServerError(error.message);
    }
    res.json({ announcements: data });
  }),
);

router.post(
  "/workspaces/:workspaceId/announcements",
  validateUuidParam("workspaceId"),
  requireWorkspaceMembership("workspaceId"),
  requireWorkspaceRole("admin"),
  asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;
    const { title, body } = req.body as { title?: string; body?: string };
    if (!title || !title.trim()) {
      throw new BadRequestError("Title is required");
    }
    if (!body || !body.trim()) {
      throw new BadRequestError("Body is required");
    }
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("announcements")
      .insert({
        workspace_id: workspaceId,
        title: title.trim(),
        body: body.trim(),
        created_by: req.userId,
      })
      .select("id, title, body, created_by, created_at, updated_at")
      .single();
    if (error) {
      throw new InternalServerError(error.message);
    }
    res.status(201).json({ announcement: data });
  }),
);

router.patch(
  "/workspaces/:workspaceId/announcements/:id/dismiss",
  validateUuidParam("workspaceId"),
  validateUuidParam("id"),
  requireWorkspaceMembership("workspaceId"),
  asyncHandler(async (req, res) => {
    const { workspaceId, id } = req.params;
    const supabase = getSupabase();
    const { data: existing, error: fetchError } = await supabase
      .from("announcements")
      .select("id, active")
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .single();
    if (fetchError || !existing) {
      throw new NotFoundError("Announcement not found");
    }
    const { data, error } = await supabase
      .from("announcements")
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .select("id, title, body, active, created_by, created_at, updated_at")
      .single();
    if (error) {
      throw new InternalServerError(error.message);
    }
    res.json({ announcement: data });
  }),
);

export default router;
