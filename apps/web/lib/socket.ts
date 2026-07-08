import { io, Socket, ManagerOptions, SocketOptions } from "socket.io-client";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const MAX_RECONNECT_ATTEMPTS = 20;
const RECONNECT_BASE_DELAY = 1000;
const RECONNECT_MAX_DELAY = 30000;
const CONNECTION_TIMEOUT = 10000;
const HEALTH_CHECK_INTERVAL = 25000;
const HEALTH_CHECK_TIMEOUT = 10000;

let socket: Socket | null = null;
let healthCheckTimer: ReturnType<typeof setInterval> | null = null;
let reconnectAttempts = 0;

function startHealthCheck(s: Socket) {
  stopHealthCheck();
  healthCheckTimer = setInterval(() => {
    if (!s.connected) return;
    const timedOut = setTimeout(() => {
      logger.warn("Health check pong timeout — disconnecting");
      s.disconnect();
    }, HEALTH_CHECK_TIMEOUT);
    s.emit("ping", () => {
      clearTimeout(timedOut);
    });
  }, HEALTH_CHECK_INTERVAL);
}

function stopHealthCheck() {
  if (healthCheckTimer) {
    clearInterval(healthCheckTimer);
    healthCheckTimer = null;
  }
}

const logger = {
  warn: (...args: unknown[]) => {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[socket]", ...args);
    }
  },
};

export async function getSocket(): Promise<Socket> {
  if (socket?.connected) return socket;

  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) throw new Error("Not authenticated");

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  reconnectAttempts = 0;

  socket = io(API_BASE, {
    auth: { token },
    transports: ["websocket"],
    reconnection: true,
    reconnectionDelay: RECONNECT_BASE_DELAY,
    reconnectionDelayMax: RECONNECT_MAX_DELAY,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    randomizationFactor: 0.2,
    timeout: CONNECTION_TIMEOUT,
  } as Partial<ManagerOptions & SocketOptions>);

  socket.io.on("reconnect_attempt", () => {
    reconnectAttempts++;
    const baseDelay = Math.min(RECONNECT_BASE_DELAY * Math.pow(2, reconnectAttempts - 1), RECONNECT_MAX_DELAY);
    const jitter = baseDelay * (0.8 + Math.random() * 0.4);
    logger.warn(`Reconnect attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} (base: ${baseDelay}ms, jittered: ${Math.round(jitter)}ms)`);
  });

  socket.io.on("reconnect_failed", () => {
    logger.warn(`Max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached — giving up`);
    stopHealthCheck();
  });

  socket.on("connect", () => {
    reconnectAttempts = 0;
    startHealthCheck(socket!);
  });

  socket.on("disconnect", (reason) => {
    logger.warn(`Disconnected: ${reason}`);
    if (reason === "io server disconnect") {
      stopHealthCheck();
    }
  });

  return new Promise((resolve, reject) => {
    const onConnect = () => {
      socket!.off("connect", onConnect);
      socket!.off("connect_error", onError);
      resolve(socket!);
    };
    const onError = (err: Error) => {
      socket!.off("connect", onConnect);
      socket!.off("connect_error", onError);
      reject(new Error(err.message));
    };
    socket!.on("connect", onConnect);
    socket!.on("connect_error", onError);
    setTimeout(() => {
      socket!.off("connect", onConnect);
      socket!.off("connect_error", onError);
      reject(new Error("Connection timeout"));
    }, CONNECTION_TIMEOUT);
  });
}

export function onReconnect(callback: () => void) {
  if (socket) {
    socket.on("connect", callback);
  }
}

export function offReconnect(callback: () => void) {
  if (socket) {
    socket.off("connect", callback);
  }
}

export function disconnectSocket() {
  stopHealthCheck();
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
