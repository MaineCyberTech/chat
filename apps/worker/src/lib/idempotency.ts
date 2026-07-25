import { createHash } from "node:crypto";
import { logger } from "@chat/config/logger.js";
import { createRedisClient } from "./redis.js";

const IDEMPOTENCY_TTL_SECONDS = 86400;
const IDEMPOTENCY_PREFIX = "idempotency:";

function buildKey(prefix: string, payload: string): string {
  const hash = createHash("sha256").update(payload).digest("hex").slice(0, 32);
  return `${IDEMPOTENCY_PREFIX}${prefix}:${hash}`;
}

export async function isDuplicate(prefix: string, payload: string): Promise<boolean> {
  const redis = createRedisClient();
  if (!redis) return false;

  try {
    const key = buildKey(prefix, payload);
    const result = await redis.set(key, "1", "EX", IDEMPOTENCY_TTL_SECONDS, "NX");
    return result === null;
  } catch (err) {
    logger.warn({ prefix, error: String(err) }, "Idempotency check failed, allowing message");
    return false;
  }
}

export async function markProcessed(prefix: string, payload: string): Promise<void> {
  const redis = createRedisClient();
  if (!redis) return;

  try {
    const key = buildKey(prefix, payload);
    await redis.setex(key, IDEMPOTENCY_TTL_SECONDS, "1");
  } catch (err) {
    logger.warn({ prefix, error: String(err) }, "Failed to mark idempotency key");
  }
}
