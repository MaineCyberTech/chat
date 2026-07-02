import { type Request, type Response, type NextFunction } from "express";
import Redis from "ioredis";
import { loadEnv } from "../config/env.js";
import { logger } from "../lib/logger.js";

interface CacheEntry {
  data: unknown;
  expires: number;
}

class CacheBackend {
  private redis: Redis | null = null;
  private memoryCache = new Map<string, { data: unknown; expires: number }>();
  private useRedis = false;

  async initialize() {
    const env = loadEnv();
    if (env.REDIS_URL) {
      try {
        this.redis = new Redis(env.REDIS_URL);
        await this.redis.ping();
        this.useRedis = true;
        logger.info("Redis cache connected");
      } catch (err) {
        logger.warn("Failed to connect to Redis, falling back to in-memory cache", { err });
      }
    }
  }

  async get(key: string): Promise<CacheEntry | null> {
    if (this.useRedis && this.redis) {
      try {
        const data = await this.redis.get(key);
        if (data) {
          return JSON.parse(data);
        }
        return null;
      } catch {
        // Fall through to memory cache on Redis error
      }
    }
    const entry = this.memoryCache.get(key);
    if (entry && entry.expires > Date.now()) {
      return entry;
    }
    if (entry) {
      this.memoryCache.delete(key);
    }
    return null;
  }

  async set(key: string, data: unknown, ttlSeconds: number): Promise<void> {
    const expires = Date.now() + ttlSeconds * 1000;
    const entry = { data, expires };

    if (this.useRedis && this.redis) {
      try {
        await this.redis.setex(key, ttlSeconds, JSON.stringify({ data, expires }));
        return;
      } catch {
        // Fall through to memory cache on Redis error
      }
    }
    this.memoryCache.set(key, entry);
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.memoryCache.clear();
      if (this.useRedis && this.redis) {
        this.redis.flushdb().catch(() => {});
      }
      return;
    }

    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(pattern)) {
        this.memoryCache.delete(key);
      }
    }
    if (this.useRedis && this.redis) {
      this.redis
        .keys(`${pattern}*`)
        .then((keys: string[]) => {
          if (keys.length) this.redis!.del(...keys);
        })
        .catch(() => {});
    }
  }

  shutdown(): void {
    if (this.redis) {
      this.redis.quit().catch(() => {});
    }
  }
}

const cacheBackend = new CacheBackend();

export async function initializeCache(): Promise<void> {
  await cacheBackend.initialize();
}

export function shutdownCache(): void {
  cacheBackend.shutdown();
}

function buildCacheKey(req: Request): string {
  const baseKey = `${req.path}:${JSON.stringify(req.query)}`;
  const userId = (req as Request & { userId?: string }).userId;
  if (userId) {
    return `user=${userId}:${baseKey}`;
  }
  return baseKey;
}

export function responseCache(ttlSeconds = 60) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") {
      return next();
    }

    const key = buildCacheKey(req);
    const entry = await cacheBackend.get(key);

    if (entry && entry.expires > Date.now()) {
      res.setHeader("X-Cache", "HIT");
      return res.json(entry.data);
    }

    const originalJson = res.json.bind(res);
    res.json = ((data: unknown) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheBackend.set(key, data, ttlSeconds);
      }
      res.setHeader("X-Cache", "MISS");
      return originalJson(data);
    }) as typeof res.json;
    next();
  };
}

export function invalidateCache(pattern?: string): void {
  cacheBackend.invalidate(pattern);
}
