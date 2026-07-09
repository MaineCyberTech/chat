import React from "react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-20 ${className}`}>
      {icon && (
        <div
          className="mb-3 flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: "rgba(var(--center-channel-color-rgb), 0.06)" }}
        >
          {icon}
        </div>
      )}
      {title && (
        <p className="text-sm font-medium" style={{ color: "var(--center-channel-color)" }}>
          {title}
        </p>
      )}
      <p
        className={`text-center text-sm ${title ? "mt-1" : ""}`}
        style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
      >
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
