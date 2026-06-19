import { Server as HttpServer } from "node:http";
import { Server as SocketServer } from "socket.io";
import { logger } from "./logger.js";

let io: SocketServer | null = null;
const onlineUsers = new Map<string, Set<string>>();

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
    }
  }
}

interface AuthenticatedSocket {
  userId: string;
}

export function initSocket(httpServer: HttpServer, corsOrigin: string): SocketServer {
  io = new SocketServer(httpServer, {
    cors: { origin: corsOrigin, credentials: true },
    transports: ["websocket", "polling"],
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token as string;
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

      (socket as unknown as AuthenticatedSocket).userId = data.user.id;
      next();
    } catch {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const userId = (socket as unknown as AuthenticatedSocket).userId;
    logger.info("Socket connected", { userId });

    // Track online users globally: userId -> Set of socketIds
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socket.id);

    // Broadcast updated online count to all connected sockets
    io!.emit("presence:update", {
      userId,
      online: Array.from(onlineUsers.keys()),
      total: onlineUsers.size,
    });

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

      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          io!.emit("presence:update", {
            userId,
            online: Array.from(onlineUsers.keys()),
            total: onlineUsers.size,
          });
        }
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

export function getOnlineUsers(): string[] {
  return Array.from(onlineUsers.keys());
}
