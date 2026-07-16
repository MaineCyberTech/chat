import { Worker, Job, Queue } from "bullmq";
import { loadEnv } from "@chat/config/env-schema.js";
import { logger } from "@chat/config/logger.js";
import { createSupabaseClient } from "../lib/supabase.js";

export interface ComplianceExportJobData {
  type: "messages" | "audit_logs" | "channels" | "users";
  dateFrom: string;
  dateTo: string;
  exportId: string;
}

function escapeCsv(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function rowsToCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const header = columns.join(",");
  const body = rows.map((row) => columns.map((c) => escapeCsv(row[c])).join(","));
  return [header, ...body].join("\n");
}

async function exportMessages(
  supabase: ReturnType<typeof createSupabaseClient>,
  dateFrom: string,
  dateTo: string,
): Promise<{ csv: string; count: number }> {
  const columns = [
    "id",
    "channel_id",
    "user_id",
    "content",
    "created_at",
    "is_pinned",
    "parent_id",
  ];
  const { data, error } = await supabase
    .from("messages")
    .select(columns.join(","))
    .gte("created_at", dateFrom)
    .lt("created_at", dateTo)
    .order("created_at", { ascending: true });

  if (error) {
    logger.error({ error }, "Compliance export: failed to query messages");
    return { csv: "", count: 0 };
  }

  const count = data?.length ?? 0;
  const csv = rowsToCsv(data as unknown as Record<string, unknown>[], columns);
  return { csv, count };
}

async function exportAuditLogs(
  supabase: ReturnType<typeof createSupabaseClient>,
  dateFrom: string,
  dateTo: string,
): Promise<{ csv: string; count: number }> {
  const columns = [
    "id",
    "actor_user_id",
    "action",
    "entity_type",
    "entity_id",
    "created_at",
    "metadata",
  ];
  const { data, error } = await supabase
    .from("audit_logs")
    .select(columns.join(","))
    .gte("created_at", dateFrom)
    .lt("created_at", dateTo)
    .order("created_at", { ascending: true });

  if (error) {
    logger.error({ error }, "Compliance export: failed to query audit logs");
    return { csv: "", count: 0 };
  }

  const count = data?.length ?? 0;
  const csv = rowsToCsv(
    (data as unknown as Record<string, unknown>[]).map((r) => ({
      ...r,
      metadata: JSON.stringify(r.metadata ?? {}),
    })),
    columns,
  );
  return { csv, count };
}

async function exportChannels(
  supabase: ReturnType<typeof createSupabaseClient>,
  dateFrom: string,
  dateTo: string,
): Promise<{ csv: string; count: number }> {
  const columns = [
    "id",
    "workspace_id",
    "name",
    "slug",
    "channel_type",
    "is_private",
    "created_at",
  ];
  const { data, error } = await supabase
    .from("channels")
    .select(columns.join(","))
    .gte("created_at", dateFrom)
    .lt("created_at", dateTo)
    .order("created_at", { ascending: true });

  if (error) {
    logger.error({ error }, "Compliance export: failed to query channels");
    return { csv: "", count: 0 };
  }

  const count = data?.length ?? 0;
  const csv = rowsToCsv(data as unknown as Record<string, unknown>[], columns);
  return { csv, count };
}

async function exportUsers(
  supabase: ReturnType<typeof createSupabaseClient>,
  dateFrom: string,
  dateTo: string,
): Promise<{ csv: string; count: number }> {
  const columns = ["id", "email", "display_name", "created_at"];
  const { data, error } = await supabase
    .from("users")
    .select(columns.join(","))
    .gte("created_at", dateFrom)
    .lt("created_at", dateTo)
    .order("created_at", { ascending: true });

  if (error) {
    logger.error({ error }, "Compliance export: failed to query users");
    return { csv: "", count: 0 };
  }

  const count = data?.length ?? 0;
  const csv = rowsToCsv(data as unknown as Record<string, unknown>[], columns);
  return { csv, count };
}

export const complianceExportQueue = new Queue<ComplianceExportJobData>("compliance-export", {
  connection: { url: loadEnv().REDIS_URL! },
  defaultJobOptions: {
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 86400 },
  },
});

export function registerComplianceExportProcessor() {
  const env = loadEnv();
  if (!env.REDIS_URL) throw new Error("Redis URL not configured");
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
  }

  const supabase = createSupabaseClient();

  const worker = new Worker<ComplianceExportJobData>(
    "compliance-export",
    async (job: Job<ComplianceExportJobData>) => {
      const signal = AbortSignal.timeout(60000);
      const { type, dateFrom, dateTo, exportId } = job.data;

      logger.info({ type, dateFrom, dateTo, exportId }, "Processing compliance export");

      const work = async () => {
        let result: { csv: string; count: number };

        try {
          switch (type) {
            case "messages":
              result = await exportMessages(supabase, dateFrom, dateTo);
              break;
            case "audit_logs":
              result = await exportAuditLogs(supabase, dateFrom, dateTo);
              break;
            case "channels":
              result = await exportChannels(supabase, dateFrom, dateTo);
              break;
            case "users":
              result = await exportUsers(supabase, dateFrom, dateTo);
              break;
            default:
              throw new Error(`Unknown export type: ${type}`);
          }

          const { error: updateError } = await supabase
            .from("compliance_exports")
            .update({
              status: "completed",
              row_count: result.count,
              csv_content: result.csv,
            })
            .eq("id", exportId);

          if (updateError) {
            logger.error({ exportId, error: updateError }, "Failed to update export record");
          }

          logger.info(
            { type, dateFrom, dateTo, count: result.count },
            "Compliance export completed",
          );
          return { status: "completed", type, count: result.count };
        } catch (err) {
          const msg = String(err);
          await supabase
            .from("compliance_exports")
            .update({ status: "failed", error_msg: msg })
            .eq("id", exportId);
          throw err;
        }
      };

      return await Promise.race([
        work(),
        new Promise<never>((_, reject) => {
          signal.addEventListener("abort", () => reject(new Error("Job timed out after 60s")), {
            once: true,
          });
        }),
      ]);
    },
    {
      connection: { url: env.REDIS_URL },
      concurrency: 1,
    },
  );

  worker.on("completed", (job) => {
    logger.debug({ jobId: job.id, type: job.data.type }, "Compliance export job completed");
  });

  worker.on("failed", (job, err) => {
    logger.error(
      { jobId: job?.id, type: job?.data.type, error: String(err) },
      "Compliance export job failed",
    );
  });

  logger.info("Compliance export processor registered");
  return worker;
}
