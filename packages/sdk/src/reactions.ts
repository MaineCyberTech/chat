/**
 * Reactions API Client
 */

import { SDKClient } from "./client.js";
import type { Reaction, AddReactionInput } from "./types.js";

export class ReactionsClient {
  constructor(private client: SDKClient) {}

  async list(messageId: string): Promise<Reaction[]> {
    const response = await this.client.get<{ reactions: Reaction[] }>(
      `/messages/${messageId}/reactions`,
    );
    return response.reactions;
  }

  async add(messageId: string, input: AddReactionInput): Promise<Reaction> {
    const response = await this.client.post<{ reaction: Reaction }>(
      `/messages/${messageId}/reactions`,
      input,
    );
    return response.reaction;
  }

  async remove(messageId: string, emoji: string): Promise<void> {
    await this.client.delete(`/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);
  }
}
