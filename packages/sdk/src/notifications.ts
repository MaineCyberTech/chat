/**
 * Notifications API Client
 */

import { SDKClient } from "./client.js";
import type { Notification, ListNotificationsParams } from "./types.js";

export class NotificationsClient {
  constructor(private client: SDKClient) {}

  async list(
    input: ListNotificationsParams = {},
  ): Promise<{ items: Notification[]; nextCursor?: string }> {
    const searchParams = new URLSearchParams();
    if (input.limit) searchParams.set("limit", String(input.limit));
    if (input.cursor) searchParams.set("cursor", input.cursor);
    if (input.unreadOnly) searchParams.set("unread", "true");

    const response = await this.client.get<{ items: Notification[]; nextCursor?: string }>(
      `/notifications?${searchParams.toString()}`,
    );
    return response;
  }

  async markRead(id: string): Promise<void> {
    await this.client.post(`/notifications/${id}/read`, {});
  }

  async markAllRead(): Promise<void> {
    await this.client.post("/notifications/read-all", {});
  }

  async getUnreadCount(): Promise<{ count: number }> {
    const response = await this.client.get<{ count: number }>("/notifications/unread-count");
    return response;
  }
}
