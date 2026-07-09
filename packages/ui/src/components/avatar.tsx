import React, { useState } from "react";

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses: Record<string, string> = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-12 w-12 text-base",
};

export function Avatar({ src, alt = "", fallback, size = "md" }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const classes = `inline-flex shrink-0 items-center justify-center rounded-full font-medium
    bg-[var(--color-avatar-bg)]
    text-[var(--color-avatar-fg)]
    ${sizeClasses[size]}`;

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${classes} object-cover`}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
      />
    );
  }

  const initials = (fallback ?? alt)
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return <span className={classes}>{initials || "?"}</span>;
}
