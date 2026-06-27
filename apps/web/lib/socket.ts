import { io, Socket } from "socket.io-client";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

let socket: Socket | null = null;

export async function getSocket(): Promise<Socket> {
  if (socket?.connected) return socket;

  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) throw new Error("Not authenticated");

  // Clean up existing socket and all its listeners before reconnecting
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  socket = io(API_BASE, {
    auth: { token },
    path: "/v1/socket.io",
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
    reconnectionAttempts: Infinity,
    randomizationFactor: 0.5,
    timeout: 20000,
    autoConnect: false,
  });

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket!.off("connect", onConnect);
      socket!.off("connect_error", onError);
      socket!.close();
      reject(new Error("Connection timeout"));
    }, 15000);

    const onConnect = () => {
      clearTimeout(timeout);
      resolve(socket!);
    };
    const onError = (err: Error) => {
      clearTimeout(timeout);
      reject(new Error(err.message));
    };
    socket!.on("connect", onConnect);
    socket!.on("connect_error", onError);
    socket!.connect();
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
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
