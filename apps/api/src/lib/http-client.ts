import { executeWithCircuitBreaker, type CircuitBreakerOptions } from "./circuit-breaker.js";

export interface HttpClientConfig {
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  circuitBreakerName?: string;
  circuitBreakerOptions?: CircuitBreakerOptions;
}

export interface FetchOptions extends RequestInit {
  timeout?: number;
}

const defaultConfig: HttpClientConfig = {
  timeout: 10_000,
  maxRetries: 3,
  retryDelay: 1_000,
  circuitBreakerName: "http-client",
};

export class HttpClient {
  private readonly config: HttpClientConfig;

  constructor(config: Partial<HttpClientConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  async fetch(url: string, options: FetchOptions = {}): Promise<Response> {
    const { timeout = this.config.timeout, ...fetchOptions } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const finalOptions: RequestInit = {
      ...fetchOptions,
      signal: controller.signal,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const response = await executeWithCircuitBreaker(
          this.config.circuitBreakerName!,
          async () => fetch(url, finalOptions),
          [],
          this.config.circuitBreakerOptions,
        );
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error instanceof Error ? error : new Error(String(error));

        if (error instanceof Error && error.name === "AbortError") {
          throw new Error(`Request timeout after ${timeout}ms`);
        }

        if (attempt < this.config.maxRetries) {
          await this.sleep(this.config.retryDelay * (attempt + 1));
        }
      }
    }

    throw lastError ?? new Error("Request failed");
  }

  async get(url: string, options: FetchOptions = {}): Promise<Response> {
    return this.fetch(url, { ...options, method: "GET" });
  }

  async post(url: string, body: unknown, options: FetchOptions = {}): Promise<Response> {
    return this.fetch(url, {
      ...options,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: JSON.stringify(body),
    });
  }

  async put(url: string, body: unknown, options: FetchOptions = {}): Promise<Response> {
    return this.fetch(url, {
      ...options,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: JSON.stringify(body),
    });
  }

  async patch(url: string, body: unknown, options: FetchOptions = {}): Promise<Response> {
    return this.fetch(url, {
      ...options,
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: JSON.stringify(body),
    });
  }

  async delete(url: string, options: FetchOptions = {}): Promise<Response> {
    return this.fetch(url, { ...options, method: "DELETE" });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export function createHttpClient(config?: Partial<HttpClientConfig>): HttpClient {
  return new HttpClient(config);
}

export const httpClient = createHttpClient();
