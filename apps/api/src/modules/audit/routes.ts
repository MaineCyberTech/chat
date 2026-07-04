import { Router, type Request, type Response } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateUuidParam } from "../../middleware/validate-uuid.js";
import type { SupabaseClient } from "@supabase/supabase-js";

const router = Router();
router.use(authenticate);

async function queryAuditLogs(
  supabase: SupabaseClient,
  query: {
    workspaceId?: string;
    actorUserId?: string;
    action?: string;
    entityType?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  },
) {
  let dbQuery = supabase
    .from("audit_logs")
    .select("*", { count: "exact" });

  if (query.workspaceId) {
    dbQuery = dbQuery.eq("organization_id", query.workspaceId);
  }
  if (query.actorUserId) {
    dbQuery = dbQuery.eq("actor_user_id", query.actorUserId);
  }
  if (query.action) {
    dbQuery = dbQuery.eq("action", query.action);
  }
  if (query.entityType) {
    dbQuery = dbQuery.eq("entity_type", query.entityType);
  }
  if (query.dateFrom) {
    dbQuery = dbQuery.gte("created_at", query.dateFrom);
  }
  if (query.dateTo) {
    dbQuery = dbQuery.lte("created_at", query.dateTo);
  }

  dbQuery = dbQuery
    .order("created_at", { ascending: false })
    .limit(query.limit ?? 50)
    .range(query.offset ?? 0, (query.offset ?? 0) + (query.limit ?? 50) - 1);

  return dbQuery;
}

router.get("/audit/logs", async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const { workspaceId, actorUserId, action, entityType, dateFrom, dateTo, limit, offset } = req.query;

  if (!supabase) {
    res.status(500).json({ error: { code: "AUTH_ERROR", message: "Auth context missing" } });
    return;
  }

  const { data, error, count } = await queryAuditLogs(supabase, {
    workspaceId: workspaceId as string | undefined,
    actorUserId: actorUserId as string | undefined,
    action: action as string | undefined,
    entityType: entityType as string | undefined,
    dateFrom: dateFrom as string | undefined,
    dateTo: dateTo as string | undefined,
    limit: limit ? parseInt(limit as string, 10) : 50,
    offset: offset ? parseInt(offset as string, 10) : 0,
  });

  if (error) {
    res.status(500).json({ error: { code: "QUERY_FAILED", message: error.message } });
    return;
  }

  res.json({ logs: data ?? [], total: count ?? 0 });
});

router.get("/audit/logs/:id", validateUuidParam("id"), async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  if (!supabase) {
    res.status(500).json({ error: { code: "AUTH_ERROR", message: "Auth context missing" } });
    return;
  }

  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("id", req.params.id as string)
    .single();

  if (error || !data) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Audit log not found" } });
    return;
  }

  res.json({ log: data });
});

export default router;
