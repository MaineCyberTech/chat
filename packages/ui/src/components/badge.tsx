import React from "react";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
}

const variantClasses: Record<string, string> = {
  default: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  success: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  danger: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
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
