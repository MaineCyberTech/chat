"use client";

import { ExternalLink } from "lucide-react";

function extractDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

interface Props {
  href: string;
  children: React.ReactNode;
  linkColor: string;
}

export function LinkPreview({ href, children, linkColor }: Props) {
  if (!href) return <>{children}</>;
  const domain = extractDomain(href);
  const isMedia = /\.(png|jpg|jpeg|gif|webp|svg|bmp|mp4|webm|ogg|mov|mp3|wav)(\?.*)?$/i.test(href);
  if (isMedia) return <>{children}</>;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group my-1.5 inline-flex max-w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
      style={{
        borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
        color: linkColor,
        backgroundColor: "transparent",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(var(--center-channel-color-rgb), 0.06)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      <span
        className="flex shrink-0 items-center justify-center rounded-md border p-1.5"
        style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.12)" }}
      >
        <ExternalLink size={14} className="opacity-60" />
      </span>
      <span className="min-w-0 flex-1 truncate">
        <span className="block truncate text-xs font-medium opacity-50">{domain}</span>
        <span className="block truncate">{children}</span>
      </span>
    </a>
  );
}
