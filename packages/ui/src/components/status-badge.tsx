import React from "react";

export type StatusValue = "online" | "away" | "dnd" | "offline";

export interface StatusBadgeProps {
  status: StatusValue;
  className?: string;
}

const statusLabels: Record<StatusValue, string> = {
  online: "Online",
  away: "Away",
  dnd: "Do not disturb",
  offline: "Offline",
};

const statusIndicatorVars: Record<StatusValue, string> = {
  online: "var(--online-indicator)",
  away: "var(--away-indicator)",
  dnd: "var(--dnd-indicator)",
  offline: "var(--offline-indicator)",
};

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  return (
    <span
      className={`status-pill status-pill--${status} ${className}`}
      role="status"
      aria-label={`Status: ${statusLabels[status]}`}
      style={{ background: statusIndicatorVars[status] }}
    />
  );
}
