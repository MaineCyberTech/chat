/**
 * Webhooks API Client
 */

import { SDKClient } from "./client.js";
import type {
  WebhookEndpoint,
  CreateWebhookInput,
  UpdateWebhookInput,
  WebhookDelivery,
} from "./types.js";

export class WebhooksClient {
  constructor(private client: SDKClient) {}

  async listByWorkspace(workspaceId: string): Promise<WebhookEndpoint[]> {
    const response = await this.client.get<{ endpoints: WebhookEndpoint[] }>(
      `/workspaces/${workspaceId}/webhooks`,
    );
    return response.endpoints;
  }

  async get(id: string): Promise<WebhookEndpoint> {
    const response = await this.client.get<{ endpoint: WebhookEndpoint }>(`/webhooks/${id}`);
    return response.endpoint;
  }

  async create(input: CreateWebhookInput): Promise<WebhookEndpoint> {
    const response = await this.client.post<{ endpoint: WebhookEndpoint }>(
      `/workspaces/${input.workspace_id}/webhooks`,
      input,
    );
    return response.endpoint;
  }

  async update(id: string, input: UpdateWebhookInput): Promise<WebhookEndpoint> {
    const response = await this.client.patch<{ endpoint: WebhookEndpoint }>(
      `/webhooks/${id}`,
      input,
    );
    return response.endpoint;
  }

  async remove(id: string): Promise<void> {
    await this.client.delete(`/webhooks/${id}`);
  }

  async test(
    id: string,
  ): Promise<{ ok: boolean; status: number; error?: string; duration_ms: number }> {
    const response = await this.client.post<{
      ok: boolean;
      status: number;
      error?: string;
      duration_ms: number;
    }>(`/webhooks/${id}/test`, {});
    return response;
  }

  async listDeliveries(
    webhookId: string,
    page = 1,
    limit = 20,
  ): Promise<{
    items: WebhookDelivery[];
    total: number;
    page: number;
    limit: number;
  }> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    const response = await this.client.get<{
      items: WebhookDelivery[];
      total: number;
      page: number;
      limit: number;
    }>(`/webhooks/${webhookId}/deliveries?${params.toString()}`);
    return response;
  }
}
