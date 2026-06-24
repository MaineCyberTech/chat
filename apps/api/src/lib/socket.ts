import { Server as HttpServer } from "node:http";
import { Server as SocketServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import { logger } from "./logger.js";

let io: SocketServer | null = null;
let pubClient: Redis | null = null;
let subClient: Redis | null = null;

declare module "socket.io" {
  interface Socket {
    userId?: string;
  }
}

export function initSocket(
  httpServer: HttpServer,
  corsOrigin: string,
  redisUrl?: string,
): SocketServer {
  io = new SocketServer(httpServer, {
    cors: { origin: corsOrigin, credentials: true },
    transports: ["websocket", "polling"],
    // Reconnection/connection health settings
    pingInterval: 25000, // Send ping every 25s
    pingTimeout: 20000, // Wait 20s for pong before considering dead
    maxHttpBufferSize: 1e6, // 1MB max message size
    allowEIO3: true, // Support older clients
  });

  // Initialize Redis adapter if URL provided (for multi-instance deployments)
  if (redisUrl) {
    try {
      pubClient = new Redis(redisUrl, { maxRetriesPerRequest: 3 });
      subClient = pubClient.duplicate();

      pubClient.on("error", (err: Error) =>
        logger.error("Redis pub client error", { error: String(err) }),
      );
      subClient.on("error", (err: Error) =>
        logger.error("Redis sub client error", { error: String(err) }),
      );

      io.adapter(createAdapter(pubClient, subClient));
      logger.info("Socket.io Redis adapter initialized");
    } catch (err) {
      logger.warn("Failed to initialize Redis adapter, falling back to in-memory", {
        error: String(err),
      });
    }
  }

  io.use(async (socket, next) => {
    // Read token from Authorization header (more secure than query/auth)
    const authHeader = socket.handshake.headers?.authorization as string | undefined;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

    if (!token) {
      return next(new Error("Missing auth token"));
    }

    try {
      // Dynamic import to avoid circular dependency at module init
      const { getSupabase } = await import("./supabase.js");
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.getUser(token);

      if (error || !data.user) {
        return next(new Error("Invalid token"));
      }

      socket.userId = data.user.id;
      next();
    } catch {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;
    logger.info("Socket connected", { userId });

    socket.on("channel:join", (channelId: string) => {
      socket.join(`channel:${channelId}`);
      logger.debug("Socket joined channel", { userId, channelId });
    });

    socket.on("channel:leave", (channelId: string) => {
      socket.leave(`channel:${channelId}`);
    });

    socket.on("typing:start", (channelId: string) => {
      socket.to(`channel:${channelId}`).emit("typing:start", { userId, channelId });
    });

    socket.on("typing:stop", (channelId: string) => {
      socket.to(`channel:${channelId}`).emit("typing:stop", { userId, channelId });
    });

    socket.on("disconnect", () => {
      logger.debug("Socket disconnected", { userId });
    });
  });

  logger.info("Socket.io server initialized");
  return io;
}

export function getIO(): SocketServer {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initSocket() first.");
  }
  return io;
}

export async function shutdownSocket(): Promise<void> {
  if (pubClient) {
    await pubClient.quit();
    pubClient = null;
  }
  if (subClient) {
    await subClient.quit();
    subClient = null;
  }
  if (io) {
    await io.close();
    io = null;
  }
}

export function getOnlineUsers(): string[] {
  // In distributed mode, this would need Redis SCAN across instances
  // For now, return empty array - use presence events instead
  return [];
}
