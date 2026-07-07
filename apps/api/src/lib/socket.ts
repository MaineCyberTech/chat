import { Server as HttpServer } from "node:http";
import { Server as SocketServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import { logger } from "./logger.js";
import { incrementWebsocketConnections } from "./metrics.js";

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
    path: "/v1/socket.io",
    cors: { origin: corsOrigin, credentials: true },
    transports: ["websocket", "polling"],
    // Reconnection/connection health settings
    pingInterval: 25000, // Send ping every 25s
    pingTimeout: 20000, // Wait 20s for pong before considering dead
    maxHttpBufferSize: 1e6, // 1MB max message size
    allowEIO3: false, // Only support EIO4 for security
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
    // Read token from socket handshake auth (supported in all browsers)
    // Alternatively from Authorization header for non-browser clients
    const token =
      (socket.handshake.auth?.token as string | undefined) ??
      (socket.handshake.headers?.authorization as string | undefined)?.replace("Bearer ", "");

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
    } catch (err) {
      logger.warn("Socket.io auth failed", { error: String(err) });
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;
    logger.info("Socket connected", { userId });
    incrementWebsocketConnections(1);

    // Update user presence to online
    (async () => {
      try {
        const { getSupabase } = await import("./supabase.js");
        const supabase = getSupabase();
        await supabase
          .from("user_presence")
          .upsert(
            { user_id: userId, status: "online", last_seen_at: new Date().toISOString() },
            { onConflict: "user_id" },
          );
        io!.emit("presence:update", { userId, status: "online" });
      } catch {
        logger.warn("Failed to update presence on connect");
      }
    })();

    socket.on("channel:join", async (channelId: string) => {
      try {
        const { getSupabase } = await import("./supabase.js");
        const supabase = getSupabase();
        const { data: channel, error } = await supabase
          .from("channels")
          .select("workspace_id, is_private")
          .eq("id", channelId)
          .single();
        if (error || !channel) {
          socket.emit("channel:join_error", { channelId, error: "Channel not found" });
          return;
        }

        const { data: member } = await supabase
          .from("workspace_members")
          .select("user_id")
          .eq("workspace_id", channel.workspace_id)
          .eq("user_id", userId)
          .single();
        if (!member) {
          socket.emit("channel:join_error", { channelId, error: "Not a workspace member" });
          return;
        }

        if (channel.is_private) {
          const { data: channelMember } = await supabase
            .from("channel_members")
            .select("user_id")
            .eq("channel_id", channelId)
            .eq("user_id", userId)
            .single();
          if (!channelMember) {
            socket.emit("channel:join_error", { channelId, error: "Not a member of this private channel" });
            return;
          }
        }

        socket.join(`channel:${channelId}`);

        // Notify channel of user joining
        socket.to(`channel:${channelId}`).emit("channel:user_joined", { userId });

        // Broadcast presence to workspace members in the channel
        socket.to(`channel:${channelId}`).emit("presence:update", {
          userId,
          status: "online",
          total: io!.sockets.adapter.rooms.get(`channel:${channelId}`)?.size ?? 0,
        });

        logger.debug("Socket joined channel", { userId, channelId });
      } catch {
        logger.warn("Socket channel:join failed", { userId, channelId });
      }
    });

    socket.on("channel:leave", (channelId: string) => {
      socket.leave(`channel:${channelId}`);
      socket.to(`channel:${channelId}`).emit("channel:user_left", { userId });
      socket.to(`channel:${channelId}`).emit("presence:update", {
        userId,
        status: "offline",
        total: io!.sockets.adapter.rooms.get(`channel:${channelId}`)?.size ?? 0,
      });
    });

    socket.on("presence:set", async (status: "online" | "away" | "dnd") => {
      try {
        const { getSupabase } = await import("./supabase.js");
        const supabase = getSupabase();
        await supabase.from("user_presence").upsert(
          {
            user_id: userId,
            status,
            last_seen_at: status === "online" ? new Date().toISOString() : undefined,
          },
          { onConflict: "user_id" },
        );

        // Broadcast status to all channels this user is in
        for (const room of socket.rooms) {
          if (room.startsWith("channel:")) {
            socket.to(room).emit("presence:update", { userId, status });
          }
        }
      } catch {
        logger.warn("Failed to set presence status");
      }
    });

    socket.on("typing:start", (channelId: string) => {
      socket.to(`channel:${channelId}`).emit("typing:start", { userId, channelId });
    });

    socket.on("typing:stop", (channelId: string) => {
      socket.to(`channel:${channelId}`).emit("typing:stop", { userId, channelId });
    });

    socket.on("disconnect", async () => {
      logger.debug("Socket disconnected", { userId });
      incrementWebsocketConnections(-1);

      // Update presence to offline
      try {
        const { getSupabase } = await import("./supabase.js");
        const supabase = getSupabase();
        await supabase
          .from("user_presence")
          .upsert(
            { user_id: userId, status: "offline", last_seen_at: new Date().toISOString() },
            { onConflict: "user_id" },
          );

        // Broadcast offline to all rooms
        for (const room of socket.rooms) {
          if (room.startsWith("channel:")) {
            socket.to(room).emit("presence:update", { userId, status: "offline" });
          }
        }
      } catch {
        logger.warn("Failed to update presence on disconnect");
      }
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
  if (!io) return [];
  const sockets = io.sockets.sockets;
  const userIds = new Set<string>();
  for (const socket of sockets.values()) {
    if (socket.userId) {
      userIds.add(socket.userId);
    }
  }
  return Array.from(userIds);
}
