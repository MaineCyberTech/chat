/**
 * Preferences API Client
 */

import { SDKClient } from "./client.js";
import type { UserPreferences } from "./types.js";

export class PreferencesClient {
  constructor(private client: SDKClient) {}

  async get(): Promise<UserPreferences> {
    const response = await this.client.get<{ preferences: UserPreferences }>("/auth/preferences");
    return response.preferences;
  }

  async update(input: Partial<UserPreferences>): Promise<UserPreferences> {
    const response = await this.client.patch<{ preferences: UserPreferences }>(
      "/auth/preferences",
      input,
    );
    return response.preferences;
  }
}
