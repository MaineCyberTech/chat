/**
 * SDK Client - Base HTTP client with authentication
 */

import type { ApiError } from "./types.js";

export interface SDKConfig {
  baseUrl: string;
  getAccessToken?: () => string | Promise<string>;
}

export class SDKClient {
  private baseUrl: string;
  private getAccessToken: () => string | Promise<string>;

  constructor(config: SDKConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.getAccessToken = config.getAccessToken ?? (() => "");
  }

  private async request<T>(method: string, path: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAccessToken();
    const headers = new Headers(options.headers);
    headers.set("Content-Type", "application/json");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${this.baseUrl}/v1${path}`, {
      ...options,
      method,
      headers,
    });

    if (!response.ok) {
      let errorData: ApiError | undefined;
      try {
        errorData = await response.json();
      } catch {
        // Ignore parse errors
      }
      const error = new Error(errorData?.error?.message ?? `HTTP ${response.status}`) as Error & {
        status: number;
        code?: string;
      };
      error.status = response.status;
      error.code = errorData?.error?.code;
      throw error;
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  get<T>(path: string, init?: RequestInit): Promise<T> {
    return this.request<T>("GET", path, init);
  }

  post<T>(path: string, body: unknown, init?: RequestInit): Promise<T> {
    return this.request<T>("POST", path, {
      ...init,
      body: JSON.stringify(body),
    });
  }

  patch<T>(path: string, body: unknown, init?: RequestInit): Promise<T> {
    return this.request<T>("PATCH", path, {
      ...init,
      body: JSON.stringify(body),
    });
  }

  delete<T>(path: string, init?: RequestInit): Promise<T> {
    return this.request<T>("DELETE", path, init);
  }
}

export function createClient(config: SDKConfig): SDKClient {
  return new SDKClient(config);
}
