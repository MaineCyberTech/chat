/**
 * Messages API Client
 */

import { SDKClient } from "./client.js";
import type {
  Message,
  CreateMessageInput,
  UpdateMessageInput,
  SearchMessagesInput,
  ListMessagesResult,
} from "./types.js";

export class MessagesClient {
  constructor(private client: SDKClient) {}

  async listByChannel(
    channelId: string,
    limit = 50,
    cursor?: string,
    idempotencyKey?: string,
  ): Promise<ListMessagesResult> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set("cursor", cursor);

    const response = await this.client.get<{ messages: Message[]; nextCursor?: string }>(
      `/channels/${channelId}/messages?${params.toString()}`,
      { headers },
    );
    return { messages: response.messages, nextCursor: response.nextCursor };
  }

  async search(input: SearchMessagesInput): Promise<Message[]> {
    const params = new URLSearchParams({
      q: input.q,
      limit: String(input.limit ?? 20),
    });
    const response = await this.client.get<{ messages: Message[] }>(
      `/messages/search?${params.toString()}`,
    );
    return response.messages;
  }

  async get(id: string): Promise<Message> {
    const response = await this.client.get<{ message: Message }>(`/messages/${id}`);
    return response.message;
  }

  async create(
    input: CreateMessageInput,
    idempotencyKey?: string,
  ): Promise<{ message: Message; idempotent?: boolean }> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

    const response = await this.client.post<{ message: Message; idempotent?: boolean }>(
      `/channels/${input.channel_id}/messages`,
      { content: input.content, parent_id: input.parent_id },
      { headers },
    );
    return response;
  }

  async update(id: string, input: UpdateMessageInput): Promise<Message> {
    const response = await this.client.patch<{ message: Message }>(`/messages/${id}`, input);
    return response.message;
  }

  async remove(id: string): Promise<void> {
    await this.client.delete(`/messages/${id}`);
  }

  // File uploads
  async createUploadUrl(
    fileName: string,
  ): Promise<{ uploadUrl: string; filePath: string; publicUrl: string }> {
    const response = await this.client.post<{
      uploadUrl: string;
      filePath: string;
      publicUrl: string;
    }>("/messages/upload", { fileName });
    return response;
  }
}
