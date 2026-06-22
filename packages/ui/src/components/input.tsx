import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = "", id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[var(--color-foreground-primary)]"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`rounded-lg border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-3 py-2 text-base text-[var(--color-input-fg)] transition-colors placeholder:text-[var(--color-input-placeholder)] focus:border-[var(--color-input-border-focus)] focus:ring-2 focus:ring-[var(--color-input-focus-ring)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${error ? "border-[var(--color-input-border-error)] focus:border-[var(--color-input-border-error)] focus:ring-[var(--color-input-focus-ring)]" : ""} ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-[var(--color-input-error-fg)]">{error}</p>}
    </div>
  );
}
