import { Router, type Request, type Response } from "express";
import { getSupabaseAdmin } from "../../lib/supabase.js";
import { authenticate } from "../../middleware/authenticate.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendExportResponse, type CsvColumn } from "../../lib/csv.js";
import { ForbiddenError } from "../../lib/app-error.js";

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
  asyncHandler(async (req, res) => {
    const supabase = req.supabase;
    if (!supabase) throw new ForbiddenError("Auth context missing");

    const { data: adminRows, error: adminErr } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", req.userId)
      .in("role", ["owner", "admin"]);
    if (adminErr || !adminRows || adminRows.length === 0) {
      throw new ForbiddenError("Admin access required");
    }
    const workspaceIds = adminRows.map((r: { workspace_id: string }) => r.workspace_id);

    const admin = getSupabaseAdmin();
    const { data } = await admin
      .from("workspaces")
      .select("id, name, slug, created_at")
      .in("id", workspaceIds)
      .order("created_at", { ascending: true });
    sendExportResponse(res, data ?? [], workspaceColumns, "workspaces");
  }),
);

router.get(
  "/admin/export/users",
  authenticate,
  asyncHandler(async (req, res) => {
    const supabase = req.supabase;
    if (!supabase) throw new ForbiddenError("Auth context missing");

    const { data: adminRows, error: adminErr } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", req.userId)
      .in("role", ["owner", "admin"]);
    if (adminErr || !adminRows || adminRows.length === 0) {
      throw new ForbiddenError("Admin access required");
    }
    const workspaceIds = adminRows.map((r: { workspace_id: string }) => r.workspace_id);

    const admin = getSupabaseAdmin();
    const { data: members } = await admin
      .from("workspace_members")
      .select("user_id")
      .in("workspace_id", workspaceIds);
    const userIds = [...new Set((members ?? []).map((m: { user_id: string }) => m.user_id))];

    if (userIds.length === 0) {
      sendExportResponse(res, [], userColumns, "users");
      return;
    }

    const { data } = await admin
      .from("users")
      .select("id, email, display_name, created_at")
      .in("id", userIds)
      .order("created_at", { ascending: true });
    sendExportResponse(res, data ?? [], userColumns, "users");
  }),
);

router.get(
  "/admin/export/channels",
  authenticate,
  asyncHandler(async (req, res) => {
    const supabase = req.supabase;
    if (!supabase) throw new ForbiddenError("Auth context missing");

    const { data: adminRows, error: adminErr } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", req.userId)
      .in("role", ["owner", "admin"]);
    if (adminErr || !adminRows || adminRows.length === 0) {
      throw new ForbiddenError("Admin access required");
    }
    const workspaceIds = adminRows.map((r: { workspace_id: string }) => r.workspace_id);

    const admin = getSupabaseAdmin();
    const { data } = await admin
      .from("channels")
      .select("id, name, slug, workspace_id, channel_type, created_at")
      .in("workspace_id", workspaceIds)
      .order("created_at", { ascending: true });
    sendExportResponse(res, data ?? [], channelColumns, "channels");
  }),
);

router.get(
  "/admin/export/messages",
  authenticate,
  asyncHandler(async (req, res) => {
    const supabase = req.supabase;
    if (!supabase) throw new ForbiddenError("Auth context missing");

    const { data: adminRows, error: adminErr } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", req.userId)
      .in("role", ["owner", "admin"]);
    if (adminErr || !adminRows || adminRows.length === 0) {
      throw new ForbiddenError("Admin access required");
    }
    const workspaceIds = adminRows.map((r: { workspace_id: string }) => r.workspace_id);

    const admin = getSupabaseAdmin();
    const { data: channels } = await admin
      .from("channels")
      .select("id")
      .in("workspace_id", workspaceIds);
    const channelIds = (channels ?? []).map((c: { id: string }) => c.id);

    if (channelIds.length === 0) {
      sendExportResponse(res, [], messageColumns, "messages");
      return;
    }

    const { data } = await admin
      .from("messages")
      .select("id, channel_id, user_id, content, created_at")
      .in("channel_id", channelIds)
      .order("created_at", { ascending: true });
    sendExportResponse(res, data ?? [], messageColumns, "messages");
  }),
);

export default router;
