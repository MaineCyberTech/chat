"use client";

import { useEffect, useState, useCallback } from "react";
import { getSocket } from "@/lib/socket";

export type PresenceStatus = "online" | "away" | "dnd" | "offline";

const store = {
  map: new Map<string, PresenceStatus>(),
  listeners: new Set<() => void>(),
  initialized: false,
};

function notify() {
  store.listeners.forEach((fn) => fn());
}

function initSocket() {
  if (store.initialized) return;
  store.initialized = true;
  getSocket()
    .then((socket) => {
      socket.on(
        "presence:update",
        (data: { userId: string; status: PresenceStatus; total?: number }) => {
          if (data.status === "offline") {
            store.map.delete(data.userId);
          } else {
            store.map.set(data.userId, data.status);
          }
          notify();
        },
      );
    })
    .catch(() => {});
}

export function usePresence() {
  const [, setTick] = useState(0);

  useEffect(() => {
    initSocket();
    const fn = () => setTick((t) => t + 1);
    store.listeners.add(fn);
    return () => {
      store.listeners.delete(fn);
    };
  }, []);

  const getStatus = useCallback((userId: string): PresenceStatus => {
    return store.map.get(userId) ?? "offline";
  }, []);

  return { presence: store.map, getStatus };
}

export function statusColor(status: PresenceStatus): string {
  switch (status) {
    case "online":
      return "var(--online-indicator)";
    case "away":
      return "var(--away-indicator)";
    case "dnd":
      return "var(--dnd-indicator)";
    default:
      return "rgba(255,255,255,0.3)";
  }
}

export function statusClass(status: PresenceStatus): string {
  switch (status) {
    case "online":
      return "status-pill--online";
    case "away":
      return "status-pill--away";
    case "dnd":
      return "status-pill--dnd";
    default:
      return "status-pill--offline";
  }
}
