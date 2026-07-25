import React from "react";

export interface HighlightTextProps {
  text: string;
  query: string;
  className?: string;
}

export function HighlightText({ text, query, className = "" }: HighlightTextProps) {
  if (!query) return <span className={className}>{text}</span>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return (
    <span className={className}>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="rounded-sm bg-[var(--highlight-bg,rgba(255,255,0,0.3))]">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
}
