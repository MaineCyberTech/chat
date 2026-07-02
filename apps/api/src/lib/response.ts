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
