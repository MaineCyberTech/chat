import { Router, type Request, type Response } from "express";
import { getSupabaseAdmin } from "../../lib/supabase.js";
import { authenticate } from "../../middleware/authenticate.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendExportResponse, type CsvColumn } from "../../lib/csv.js";
import { requireAdmin } from "../../middleware/require-admin.js";

const router = Router();

const workspaceColumns: CsvColumn[] = [
  { key: "id", label: "id" },
  { key: "name", label: "name" },
  { key: "slug", label: "slug" },
  { key: "created_at", label: "created_at" },
];

const userColumns: CsvColumn[] = [
  { key: "id", label: "id" },
  { key: "email", label: "email" },
  { key: "display_name", label: "display_name" },
  { key: "created_at", label: "created_at" },
];

const channelColumns: CsvColumn[] = [
  { key: "id", label: "id" },
  { key: "name", label: "name" },
  { key: "slug", label: "slug" },
  { key: "workspace_id", label: "workspace_id" },
  { key: "channel_type", label: "channel_type" },
  { key: "created_at", label: "created_at" },
];

const messageColumns: CsvColumn[] = [
  { key: "id", label: "id" },
  { key: "channel_id", label: "channel_id" },
  { key: "user_id", label: "user_id" },
  { key: "content", label: "content" },
  { key: "created_at", label: "created_at" },
];

router.get(
  "/admin/export/workspaces",
  authenticate,
  requireAdmin(),
  asyncHandler(async (_req: Request, res: Response) => {
    const admin = getSupabaseAdmin();
    const { data } = await admin
      .from("workspaces")
      .select("id, name, slug, created_at")
      .order("created_at", { ascending: true });
    sendExportResponse(res, data ?? [], workspaceColumns, "workspaces");
  }),
);

router.get(
  "/admin/export/users",
  authenticate,
  requireAdmin(),
  asyncHandler(async (_req: Request, res: Response) => {
    const admin = getSupabaseAdmin();
    const { data } = await admin
      .from("users")
      .select("id, email, display_name, created_at")
      .order("created_at", { ascending: true });
    sendExportResponse(res, data ?? [], userColumns, "users");
  }),
);

router.get(
  "/admin/export/channels",
  authenticate,
  requireAdmin(),
  asyncHandler(async (_req: Request, res: Response) => {
    const admin = getSupabaseAdmin();
    const { data } = await admin
      .from("channels")
      .select("id, name, slug, workspace_id, channel_type, created_at")
      .order("created_at", { ascending: true });
    sendExportResponse(res, data ?? [], channelColumns, "channels");
  }),
);

router.get(
  "/admin/export/messages",
  authenticate,
  requireAdmin(),
  asyncHandler(async (_req: Request, res: Response) => {
    const admin = getSupabaseAdmin();
    const { data } = await admin
      .from("messages")
      .select("id, channel_id, user_id, content, created_at")
      .order("created_at", { ascending: true });
    sendExportResponse(res, data ?? [], messageColumns, "messages");
  }),
);

export default router;
