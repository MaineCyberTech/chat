/**
 * Channels API Client
 */

import { SDKClient } from "./client.js";
import type {
  Channel,
  CreateChannelInput,
  UpdateChannelInput,
  ChannelMember,
  AddChannelMemberInput,
} from "./types.js";

export class ChannelsClient {
  constructor(private client: SDKClient) {}

  async listByWorkspace(workspaceId: string): Promise<Channel[]> {
    const response = await this.client.get<{ channels: Channel[] }>(
      `/workspaces/${workspaceId}/channels`,
    );
    return response.channels;
  }

  async get(id: string): Promise<Channel> {
    const response = await this.client.get<{ channel: Channel }>(`/channels/${id}`);
    return response.channel;
  }

  async create(input: CreateChannelInput): Promise<Channel> {
    const response = await this.client.post<{ channel: Channel }>(
      `/workspaces/${input.workspace_id}/channels`,
      input,
    );
    return response.channel;
  }

  async update(id: string, input: UpdateChannelInput): Promise<Channel> {
    const response = await this.client.patch<{ channel: Channel }>(`/channels/${id}`, input);
    return response.channel;
  }

  async remove(id: string): Promise<void> {
    await this.client.delete(`/channels/${id}`);
  }

  // Members
  async listMembers(channelId: string): Promise<ChannelMember[]> {
    const response = await this.client.get<{ members: ChannelMember[] }>(
      `/channels/${channelId}/members`,
    );
    return response.members;
  }

  async addMember(channelId: string, input: AddChannelMemberInput): Promise<void> {
    await this.client.post(`/channels/${channelId}/members`, input);
  }

  async removeMember(channelId: string, userId: string): Promise<void> {
    await this.client.delete(`/channels/${channelId}/members/${userId}`);
  }
}
