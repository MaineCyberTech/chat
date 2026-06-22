import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const variantClasses = {
    primary:
      "bg-[var(--color-button-primary-bg)] text-[var(--color-button-primary-fg)] hover:bg-[var(--color-button-primary-bg-hover)] active:bg-[var(--color-button-primary-bg-active)] border border-[var(--color-button-primary-border)] focus-visible:ring-[var(--color-button-primary-focus-ring)]",
    secondary:
      "bg-[var(--color-button-secondary-bg)] text-[var(--color-button-secondary-fg)] hover:bg-[var(--color-button-secondary-bg-hover)] active:bg-[var(--color-button-secondary-bg-active)] border border-[var(--color-button-secondary-border)] focus-visible:ring-[var(--color-button-secondary-focus-ring)]",
    ghost:
      "bg-[var(--color-button-ghost-bg)] text-[var(--color-button-ghost-fg)] hover:bg-[var(--color-button-ghost-bg-hover)] active:bg-[var(--color-button-ghost-bg-active)] border border-[var(--color-button-ghost-border)] focus-visible:ring-[var(--color-button-ghost-focus-ring)]",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const classes = [
    "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    className,
  ].join(" ");

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
