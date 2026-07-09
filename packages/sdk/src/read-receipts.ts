import { SDKClient } from "./client.js";

export interface MessageReader {
  user_id: string;
  read_at: string;
}

export interface UnreadCountItem {
  channelId: string;
  count: number;
  lastMessageAt: string | null;
}

export class ReadReceiptsClient {
  constructor(private client: SDKClient) {}

  async markChannelRead(channelId: string): Promise<void> {
    await this.client.post(`/channels/${channelId}/read`, {});
  }

  async getLastViewed(channelId: string): Promise<string> {
    const res = await this.client.get<{ lastViewed: string }>(`/channels/${channelId}/last-viewed`);
    return res.lastViewed;
  }

  async markMessageRead(messageId: string, channelId: string): Promise<void> {
    await this.client.post(`/messages/${messageId}/read`, { channelId });
  }

  async getMessageReaders(messageId: string): Promise<MessageReader[]> {
    const res = await this.client.get<{ readers: MessageReader[] }>(
      `/messages/${messageId}/readers`,
    );
    return res.readers;
  }

  async getUnreadCounts(channelIds: string[]): Promise<UnreadCountItem[]> {
    const res = await this.client.get<{ counts: UnreadCountItem[] }>(
      `/unread/counts?channel_ids=${channelIds.join(",")}`,
    );
    return res.counts;
  }
}
