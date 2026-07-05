"use client";

import { useEffect, useState, useCallback } from "react";
import { LiveKitRoom, VideoConference, ControlBar } from "@livekit/components-react";
import "@livekit/components-styles";
import { api } from "@/lib/api";

interface Props {
  roomName: string;
  onLeave: () => void;
}

export function MediaRoom({ roomName, onLeave }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [wsUrl, setWsUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ token: string; wsUrl: string; roomName: string }>(
        `/livekit/token?room=${encodeURIComponent(roomName)}`,
      )
      .then((res) => {
        setToken(res.token);
        setWsUrl(res.wsUrl);
      })
      .catch(() => setError("Failed to connect to media server"));
  }, [roomName]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-8">
        <p className="text-sm" style={{ color: "var(--dnd-indicator)" }}>
          {error}
        </p>
        <button
          onClick={onLeave}
          className="rounded px-4 py-2 text-sm text-white"
          style={{ backgroundColor: "var(--button-bg)" }}
        >
          Close
        </button>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex items-center justify-center p-8">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
          style={{
            borderColor: "rgba(var(--center-channel-color-rgb), 0.56)",
            borderTopColor: "transparent",
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: "var(--center-channel-bg)" }}
    >
      <LiveKitRoom
        token={token}
        serverUrl={wsUrl}
        connect={true}
        video={true}
        audio={true}
        onDisconnected={onLeave}
        className="flex flex-1 flex-col"
      >
        <VideoConference />
        <ControlBar variation="minimal" />
        <button
          onClick={onLeave}
          className="absolute top-4 right-4 z-50 rounded-full px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          style={{ backgroundColor: "var(--dnd-indicator)" }}
        >
          Leave Call
        </button>
      </LiveKitRoom>
    </div>
  );
}

export function useMediaRoom() {
  const [activeRoom, setActiveRoom] = useState<string | null>(null);

  const startCall = useCallback((channelId: string) => {
    setActiveRoom(channelId);
  }, []);

  const endCall = useCallback(() => {
    setActiveRoom(null);
  }, []);

  return { activeRoom, startCall, endCall };
}
