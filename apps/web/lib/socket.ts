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

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(API_BASE, {
    auth: { token },
    transports: ["websocket"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
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
    }, 10000);
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
