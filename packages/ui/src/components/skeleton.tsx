import React from "react";

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-200 dark:bg-gray-800 ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}

export function SkeletonLine({ width = "100%" }: { width?: string }) {
  return <Skeleton className="h-4" style={{ width }} />;
}

export function SkeletonCircle({ size = 36 }: { size?: number }) {
  return <Skeleton className="rounded-full" style={{ width: size, height: size }} />;
}
