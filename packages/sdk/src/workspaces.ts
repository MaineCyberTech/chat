/**
 * Workspaces API Client
 */

import { SDKClient } from "./client.js";
import type {
  Workspace,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  WorkspaceMember,
} from "./types.js";

export class WorkspacesClient {
  constructor(private client: SDKClient) {}

  async list(): Promise<Workspace[]> {
    const response = await this.client.get<{ workspaces: Workspace[] }>("/workspaces");
    return response.workspaces;
  }

  async get(id: string): Promise<Workspace> {
    const response = await this.client.get<{ workspace: Workspace }>(`/workspaces/${id}`);
    return response.workspace;
  }

  async create(input: CreateWorkspaceInput): Promise<Workspace> {
    const response = await this.client.post<{ workspace: Workspace }>("/workspaces", input);
    return response.workspace;
  }

  async update(id: string, input: UpdateWorkspaceInput): Promise<Workspace> {
    const response = await this.client.patch<{ workspace: Workspace }>(`/workspaces/${id}`, input);
    return response.workspace;
  }

  async remove(id: string): Promise<void> {
    await this.client.delete(`/workspaces/${id}`);
  }

  // Members
  async listMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const response = await this.client.get<{ members: WorkspaceMember[] }>(
      `/workspaces/${workspaceId}/members`,
    );
    return response.members;
  }

  async addMember(
    workspaceId: string,
    userId: string,
    role: "admin" | "member" = "member",
  ): Promise<void> {
    await this.client.post(`/workspaces/${workspaceId}/members`, { user_id: userId, role });
  }

  async removeMember(workspaceId: string, userId: string): Promise<void> {
    await this.client.delete(`/workspaces/${workspaceId}/members/${userId}`);
  }

  async updateMemberRole(
    workspaceId: string,
    userId: string,
    role: "admin" | "member",
  ): Promise<void> {
    await this.client.patch(`/workspaces/${workspaceId}/members/${userId}`, { role });
  }
}
