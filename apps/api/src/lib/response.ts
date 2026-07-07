/**
 * API response conventions:
 *
 * SUCCESS (idempotent reads / collection results):
 *   { data: T }
 *   Example: { data: { workspaces: [...] } }
 *
 * SUCCESS (single resource creation):
 *   { data: { workspace: {...} } }
 *   Use a key matching the resource name.
 *
 * ERROR:
 *   { error: { code: string, message: string, details?: unknown } }
 *   Returned by AppError.toJSON() / errorResponse().
 *
 * Deprecated envelope format (do NOT use in new routes):
 *   { success: true, data: T }
 *   { success: false, error: { code, message, status } }
 *   The `failure()` helper below is only retained for backwards compat.
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    status: number;
    details?: Record<string, unknown>;
  };
}

export function success<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

export function failure(
  code: string,
  message: string,
  status: number,
  details?: Record<string, unknown>,
): ApiResponse {
  return {
    success: false,
    error: { code, message, status, ...(details && { details }) },
  };
}
