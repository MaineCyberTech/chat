import { io, Socket } from "socket.io-client";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

let socketInstance: Socket | null = null;
let connectPromise: Promise<Socket> | null = null;
let refCount = 0;

export async function acquireSocket(): Promise<Socket> {
  refCount++;
  if (socketInstance?.connected) return socketInstance;
  if (connectPromise) return connectPromise;

  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    refCount--;
    throw new Error("Not authenticated");
  }

  connectPromise = new Promise<Socket>((resolve, reject) => {
    const s = io(API_BASE, {
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

    const timeout = setTimeout(() => {
      s.off("connect", onConnect);
      s.off("connect_error", onError);
      s.close();
      connectPromise = null;
      reject(new Error("Connection timeout"));
    }, 15000);

    const onConnect = () => {
      clearTimeout(timeout);
      socketInstance = s;
      connectPromise = null;
      resolve(s);
    };
    const onError = (err: Error) => {
      clearTimeout(timeout);
      connectPromise = null;
      reject(new Error(err.message));
    };
    s.on("connect", onConnect);
    s.on("connect_error", onError);
    s.connect();
  });

  return connectPromise;
}

export function releaseSocket(): void {
  refCount = Math.max(0, refCount - 1);
  if (refCount === 0 && socketInstance) {
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
    connectPromise = null;
  }
}

export async function getSocket(): Promise<Socket> {
  return acquireSocket();
}

export function onReconnect(callback: () => void) {
  if (socketInstance) {
    socketInstance.on("connect", callback);
  }
}

export function offReconnect(callback: () => void) {
  if (socketInstance) {
    socketInstance.off("connect", callback);
  }
}

export function disconnectSocket() {
  refCount = 0;
  if (socketInstance) {
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
    connectPromise = null;
  }
}
