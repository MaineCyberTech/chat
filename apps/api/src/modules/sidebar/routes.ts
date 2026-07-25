import { Router, type Request, type Response } from "express";
import type { SupabaseClient } from "@supabase/supabase-js";
import { authenticate as requireAuth } from "../../middleware/authenticate.js";
import { validateUuidParam } from "../../middleware/validate-uuid.js";
import { asyncHandler } from "../../lib/async-handler.js";
import {
  BadRequestError,
  NotFoundError,
  InternalServerError,
  ForbiddenError,
} from "../../lib/app-error.js";
import {
  createSidebarCategorySchema,
  updateSidebarCategorySchema,
  addSidebarAssignmentSchema,
  reorderSidebarCategoriesSchema,
  reorderSidebarAssignmentsSchema,
} from "../../config/validators.js";

const router = Router();
router.use(requireAuth);

async function requireWorkspaceMembershipInline(
  supabase: SupabaseClient,
  workspaceId: string,
  userId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .single();
  if (error || !data) {
    throw new ForbiddenError("Not a member of this workspace");
  }
}

async function checkCategoryOwnership(
  supabase: SupabaseClient,
  categoryId: string,
  userId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("sidebar_categories")
    .select("workspace_id")
    .eq("id", categoryId)
    .eq("user_id", userId)
    .single();
  if (error || !data) throw new NotFoundError("Category not found");
  return data.workspace_id as string;
}

// GET /v1/sidebar-categories?workspace_id=xxx - list categories with channel assignments
router.get(
  "/",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const workspaceId = req.query.workspace_id as string;
    if (!workspaceId) throw new BadRequestError("workspace_id required");

    const supabase = req.supabase as SupabaseClient;
    await requireWorkspaceMembershipInline(supabase, workspaceId, req.userId!);

    const { data: categories, error: catErr } = await supabase
      .from("sidebar_categories")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("user_id", req.userId)
      .order("sort_order");

    if (catErr) throw new InternalServerError(catErr.message);

    const categoryIds = categories.map((c) => c.id);

    const { data: assignments, error: asgnErr } = await supabase
      .from("sidebar_channel_assignments")
      .select("*")
      .in(
        "category_id",
        categoryIds.length > 0 ? categoryIds : ["00000000-0000-0000-0000-000000000000"],
      )
      .order("sort_order");

    if (asgnErr) throw new InternalServerError(asgnErr.message);

    const grouped = categories.map((cat) => ({
      ...cat,
      channels: (assignments ?? [])
        .filter((a) => a.category_id === cat.id)
        .map((a) => a.channel_id),
    }));

    res.json({ categories: grouped });
  }),
);

// POST /v1/sidebar-categories - create a category
router.post(
  "/",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = createSidebarCategorySchema.safeParse(req.body);
    if (!parsed.success) throw new BadRequestError(parsed.error.issues[0].message);

    const { workspace_id, name } = parsed.data;
    const supabase = req.supabase as SupabaseClient;
    await requireWorkspaceMembershipInline(supabase, workspace_id, req.userId!);

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

    if (error) throw new InternalServerError(error.message);
    res.status(201).json({ category: data });
  }),
);

// PATCH /v1/sidebar-categories/:id - rename
router.patch(
  "/:id",
  requireAuth,
  validateUuidParam("id"),
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = updateSidebarCategorySchema.safeParse(req.body);
    if (!parsed.success) throw new BadRequestError(parsed.error.issues[0].message);

    const supabase = req.supabase as SupabaseClient;
    const workspaceId = await checkCategoryOwnership(
      supabase,
      req.params.id as string,
      req.userId!,
    );
    await requireWorkspaceMembershipInline(supabase, workspaceId, req.userId!);

    const updates: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.sort_order !== undefined) updates.sort_order = parsed.data.sort_order;

    const { data, error } = await supabase
      .from("sidebar_categories")
      .update(updates)
      .eq("id", req.params.id)
      .eq("user_id", req.userId)
      .select()
      .single();

    if (error) throw new InternalServerError(error.message);
    res.json({ category: data });
  }),
);

// DELETE /v1/sidebar-categories/:id
router.delete(
  "/:id",
  requireAuth,
  validateUuidParam("id"),
  asyncHandler(async (req: Request, res: Response) => {
    const supabase = req.supabase as SupabaseClient;
    const workspaceId = await checkCategoryOwnership(
      supabase,
      req.params.id as string,
      req.userId!,
    );
    await requireWorkspaceMembershipInline(supabase, workspaceId, req.userId!);

    const { error } = await supabase
      .from("sidebar_categories")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.userId);

    if (error) throw new InternalServerError(error.message);
    res.json({ success: true });
  }),
);

// POST /v1/sidebar-categories/:id/assignments - add channel to category
router.post(
  "/:id/assignments",
  requireAuth,
  validateUuidParam("id"),
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = addSidebarAssignmentSchema.safeParse(req.body);
    if (!parsed.success) throw new BadRequestError(parsed.error.issues[0].message);

    const { channel_id } = parsed.data;
    const supabase = req.supabase as SupabaseClient;
    const workspaceId = await checkCategoryOwnership(
      supabase,
      req.params.id as string,
      req.userId!,
    );
    await requireWorkspaceMembershipInline(supabase, workspaceId, req.userId!);

    const { data: cat } = await supabase
      .from("sidebar_categories")
      .select("id")
      .eq("id", req.params.id)
      .eq("user_id", req.userId)
      .single();

    if (!cat) throw new NotFoundError("Category not found");

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

    if (error) throw new InternalServerError(error.message);
    res.status(201).json({ assignment: data });
  }),
);

// DELETE /v1/sidebar-categories/:id/assignments/:channelId - remove channel from category
router.delete(
  "/:id/assignments/:channelId",
  requireAuth,
  validateUuidParam("id"),
  validateUuidParam("channelId"),
  asyncHandler(async (req: Request, res: Response) => {
    const supabase = req.supabase as SupabaseClient;
    const workspaceId = await checkCategoryOwnership(
      supabase,
      req.params.id as string,
      req.userId!,
    );
    await requireWorkspaceMembershipInline(supabase, workspaceId, req.userId!);

    const { error } = await supabase
      .from("sidebar_channel_assignments")
      .delete()
      .eq("category_id", req.params.id)
      .eq("channel_id", req.params.channelId);

    if (error) throw new InternalServerError(error.message);
    res.json({ success: true });
  }),
);

// PATCH /v1/sidebar-categories/reorder - reorder all categories
router.patch(
  "/reorder",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = reorderSidebarCategoriesSchema.safeParse(req.body);
    if (!parsed.success) throw new BadRequestError(parsed.error.issues[0].message);

    const { categoryIds } = parsed.data;
    const supabase = req.supabase as SupabaseClient;

    const { data: firstCat } = await supabase
      .from("sidebar_categories")
      .select("workspace_id")
      .eq("id", categoryIds[0])
      .eq("user_id", req.userId)
      .single();
    if (!firstCat) throw new NotFoundError("Category not found");
    await requireWorkspaceMembershipInline(supabase, firstCat.workspace_id as string, req.userId!);

    const errs: string[] = [];

    for (let i = 0; i < categoryIds.length; i++) {
      const { error } = await supabase
        .from("sidebar_categories")
        .update({ sort_order: i })
        .eq("id", categoryIds[i])
        .eq("user_id", req.userId);
      if (error) errs.push(error.message);
    }

    if (errs.length > 0) throw new InternalServerError(errs.join("; "));
    res.json({ success: true });
  }),
);

// PATCH /v1/sidebar-categories/:id/assignments/reorder - reorder channels in a category
router.patch(
  "/:id/assignments/reorder",
  requireAuth,
  validateUuidParam("id"),
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = reorderSidebarAssignmentsSchema.safeParse(req.body);
    if (!parsed.success) throw new BadRequestError(parsed.error.issues[0].message);

    const { channelIds } = parsed.data;
    const supabase = req.supabase as SupabaseClient;
    const workspaceId = await checkCategoryOwnership(
      supabase,
      req.params.id as string,
      req.userId!,
    );
    await requireWorkspaceMembershipInline(supabase, workspaceId, req.userId!);
    const errs: string[] = [];

    for (let i = 0; i < channelIds.length; i++) {
      const { error } = await supabase
        .from("sidebar_channel_assignments")
        .update({ sort_order: i })
        .eq("category_id", req.params.id)
        .eq("channel_id", channelIds[i]);
      if (error) errs.push(error.message);
    }

    if (errs.length > 0) throw new InternalServerError(errs.join("; "));
    res.json({ success: true });
  }),
);

export default router;
