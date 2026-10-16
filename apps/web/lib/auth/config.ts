/**
 * API base URL resolution.
 *
 * Kept in its own module so both lib/api.ts and lib/auth/client.ts can import it
 * without creating a circular dependency between them.
 */
export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "";
}
