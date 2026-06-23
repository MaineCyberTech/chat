import { getSupabaseAdmin } from "../lib/supabase.js";
import { logger } from "../lib/logger.js";

type AuditEventInput = {
  organizationId?: string | null;
  actorUserId?: string | null;
  actorType?: "user" | "system";
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
};

// In-memory queue for failed audit events (use Redis in production)
const auditQueue: Array<{ input: AuditEventInput; retries: number }> = [];
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;
let isProcessing = false;

async function processQueue() {
  if (isProcessing || auditQueue.length === 0) return;
  isProcessing = true;

  while (auditQueue.length > 0) {
    const item = auditQueue.shift();
    if (!item) continue;

    try {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase.from("audit_logs").insert({
        organization_id: item.input.organizationId ?? null,
        actor_user_id: item.input.actorUserId ?? null,
        actor_type: item.input.actorType ?? "user",
        action: item.input.action,
        entity_type: item.input.entityType,
        entity_id: item.input.entityId ?? null,
        metadata: item.input.metadata ?? {},
      });

      if (error) {
        throw new Error(error.message);
      }
      logger.debug("audit log retried successfully", { action: item.input.action });
    } catch (err) {
      if (item.retries < MAX_RETRIES) {
        auditQueue.push({ input: item.input, retries: item.retries + 1 });
        logger.warn("audit log retry scheduled", {
          action: item.input.action,
          retries: item.retries + 1,
        });
        // Wait before next retry
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      } else {
        logger.error("audit log permanently failed after max retries", {
          action: item.input.action,
          error: String(err),
        });
      }
    }
  }

  isProcessing = false;
}

export async function logAuditEvent(input: AuditEventInput) {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("audit_logs").insert({
      organization_id: input.organizationId ?? null,
      actor_user_id: input.actorUserId ?? null,
      actor_type: input.actorType ?? "user",
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      metadata: input.metadata ?? {},
    });

    if (error) {
      logger.error("audit log insert failed", { error });
      throw error;
    }
  } catch (err) {
    logger.error("audit log insert failed, queuing for retry", { error: String(err) });
    auditQueue.push({ input, retries: 0 });
    processQueue().catch(() => {});
  }
}
