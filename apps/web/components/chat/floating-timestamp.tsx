"use client";

import React, { useEffect, useState } from "react";

interface Props {
  containerRef: React.RefObject<HTMLDivElement | null>;
  messageElements: React.RefObject<Map<string, HTMLDivElement>>;
  visibleMessageIds: string[];
}

function formatFloatingTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: "long" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function FloatingTimestamp({ containerRef }: Props) {
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const messages = container.querySelectorAll("[data-message-id]");
      if (messages.length === 0) {
        setVisible(false);
        return;
      }

      let topmostMessage: Element | null = null;
      let topmostTop = Infinity;

      messages.forEach((msg: Element) => {
        const rect = msg.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const relativeTop = rect.top - containerRect.top;

        if (relativeTop >= -rect.height * 0.5 && relativeTop < topmostTop) {
          topmostTop = relativeTop;
          topmostMessage = msg;
        }
      });

      if (topmostMessage) {
        const dateStr = (topmostMessage as Element).getAttribute("data-timestamp");
        if (dateStr) {
          setTimestamp(formatFloatingTime(dateStr));
          setVisible(true);
        }
      } else {
        setVisible(false);
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => container.removeEventListener("scroll", handleScroll);
  }, [containerRef]);

  if (!visible || !timestamp) return null;

  return (
    <div className="pointer-events-none fixed top-0 left-1/2 z-50 -translate-x-1/2 px-3 py-1">
      <div className="rounded-full bg-[var(--color-background-elevated)] px-3 py-1 text-xs font-medium text-[var(--color-foreground-muted)] shadow-sm ring-1 ring-[var(--color-border)] backdrop-blur-sm transition-opacity">
        {timestamp}
      </div>
    </div>
  );
}
