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
        // Redirect to the channel, the channel page will scroll to the message
        router.replace(`/messages/${msg.channel_id}?highlight=${msg.id}`);
      })
      .catch(() => {
        setError("Message not found or you don't have access to it.");
      });
  }, [params?.postId, router]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--color-background-primary)] p-8 text-center">
        <h1 className="text-xl font-semibold text-[var(--color-foreground-primary)]">Message not found</h1>
        <p className="text-sm text-[var(--color-foreground-secondary)]">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background-primary)]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-border-primary)] border-t-[var(--color-brand-primary)]" />
    </div>
  );
}
