import { BadRequestError } from "./app-error.js";

export function parsePaginationParams(
  limitStr: string | undefined,
  offsetStr: string | undefined,
  defaultLimit = 20,
  maxLimit = 100,
): { limit: number; offset: number } {
  const limit = limitStr !== undefined ? parseInt(limitStr, 10) : defaultLimit;
  const offset = offsetStr !== undefined ? parseInt(offsetStr, 10) : 0;

  if (isNaN(limit) || limit < 1) {
    throw new BadRequestError("limit must be a positive integer");
  }
  if (isNaN(offset) || offset < 0) {
    throw new BadRequestError("offset must be a non-negative integer");
  }

  return { limit: Math.min(limit, maxLimit), offset };
}
