import { getSupabase, getSupabaseAdmin } from "../../lib/supabase.js";
import { logger } from "../../lib/logger.js";

interface WebhookEndpoint {
  id: string;
  workspace_id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  is_active: boolean;
}

export class WebhookService {
  async getChannelWorkspaceId(channelId: string): Promise<string | null> {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("channels")
      .select("workspace_id")
      .eq("id", channelId)
      .single();
    return (data?.workspace_id as string) ?? null;
  }

  async listByWorkspace(workspaceId: string): Promise<WebhookEndpoint[]> {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("webhook_endpoints")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true });
    return (data ?? []) as WebhookEndpoint[];
  }

  async getById(id: string): Promise<WebhookEndpoint | null> {
    const supabase = getSupabase();
    const { data } = await supabase.from("webhook_endpoints").select("*").eq("id", id).single();
    return data as WebhookEndpoint | null;
  }

  async create(input: {
    workspace_id: string;
    name: string;
    url: string;
    secret?: string;
    events: string[];
    created_by: string;
  }): Promise<WebhookEndpoint | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("webhook_endpoints")
      .insert({
        workspace_id: input.workspace_id,
        name: input.name,
        url: input.url,
        secret: input.secret ?? "",
        events: input.events,
        created_by: input.created_by,
      })
      .select("*")
      .single();
    if (error) {
      logger.error("webhook create failed", { error });
      return null;
    }
    return data as WebhookEndpoint;
  }

  async update(id: string, input: Partial<WebhookEndpoint>): Promise<WebhookEndpoint | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("webhook_endpoints")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();
    if (error) return null;
    return data as WebhookEndpoint;
  }

  async remove(id: string): Promise<boolean> {
    const supabase = getSupabase();
    const { error } = await supabase.from("webhook_endpoints").delete().eq("id", id);
    return !error;
  }

  async triggerEvent(event: string, workspaceId: string, payload: Record<string, unknown>) {
    const supabase = getSupabase();
    const { data: endpoints } = await supabase
      .from("webhook_endpoints")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("is_active", true)
      .contains("events", [event]);

    if (!endpoints || endpoints.length === 0) return;

    const admin = getSupabaseAdmin();
    for (const endpoint of endpoints as WebhookEndpoint[]) {
      this.deliver(admin, endpoint, event, payload).catch((err) =>
        logger.error("webhook delivery failed", { webhookId: endpoint.id, error: String(err) }),
      );
    }
  }

  private async deliver(
    admin: ReturnType<typeof getSupabaseAdmin>,
    endpoint: WebhookEndpoint,
    event: string,
    payload: Record<string, unknown>,
  ) {
    const start = Date.now();
    let status = "success";
    let responseStatus: number | null = null;
    let responseBody: string | null = null;
    let error: string | null = null;

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (endpoint.secret) {
        headers["X-Webhook-Signature"] = endpoint.secret;
      }

      const res = await fetch(endpoint.url, {
        method: "POST",
        headers,
        body: JSON.stringify({ event, ...payload }),
        signal: AbortSignal.timeout(10000),
      });

      responseStatus = res.status;
      responseBody = await res.text().catch(() => null);

      if (res.status >= 200 && res.status < 300) {
        await admin
          .from("webhook_endpoints")
          .update({ last_success_at: new Date().toISOString() })
          .eq("id", endpoint.id);
      } else {
        status = "failed";
        error = `HTTP ${res.status}`;
        await admin
          .from("webhook_endpoints")
          .update({ last_failure_at: new Date().toISOString(), last_error: error })
          .eq("id", endpoint.id);
      }
    } catch (err) {
      status = "failed";
      error = err instanceof Error ? err.message : String(err);
      await admin
        .from("webhook_endpoints")
        .update({ last_failure_at: new Date().toISOString(), last_error: error })
        .eq("id", endpoint.id);
    }

    await admin.from("webhook_deliveries").insert({
      webhook_id: endpoint.id,
      event,
      status,
      request_body: payload,
      response_status: responseStatus,
      response_body: responseBody,
      error,
      duration_ms: Date.now() - start,
    });
  }
}

export const webhookService = new WebhookService();
