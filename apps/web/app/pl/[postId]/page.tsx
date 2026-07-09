"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Message } from "@chat/db";

export default function PermalinkPage() {
  const params = useParams<{ postId: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.postId) return;
    api
      .get<{ message: Message }>(`/messages/${params.postId}`)
      .then((res) => {
        const msg = res.message;
        router.replace(`/messages/${msg.channel_id}?highlight=${msg.id}`);
      })
      .catch(() => {
        setError("Message not found or you don't have access to it.");
      });
  }, [params?.postId, router]);

  if (error) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center"
        style={{ backgroundColor: "var(--center-channel-bg)" }}
      >
        <h1 className="text-xl font-semibold" style={{ color: "var(--center-channel-color)" }}>
          Message not found
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {error}
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ backgroundColor: "var(--center-channel-bg)" }}
    >
      <div
        className="h-8 w-8 animate-spin rounded-full border-2"
        style={{
          borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
          borderTopColor: "var(--button-bg)",
        }}
      />
    </div>
  );
}
