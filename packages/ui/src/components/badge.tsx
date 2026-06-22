import React from "react";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
}

const variantClasses: Record<string, string> = {
  default: "bg-[var(--color-badge-default-bg)] text-[var(--color-badge-default-fg)]",
  success: "bg-[var(--color-badge-success-bg)] text-[var(--color-badge-success-fg)]",
  warning: "bg-[var(--color-badge-warning-bg)] text-[var(--color-badge-warning-fg)]",
  danger: "bg-[var(--color-badge-danger-bg)] text-[var(--color-badge-danger-fg)]",
};

export function Badge({ children, variant = "default" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}
