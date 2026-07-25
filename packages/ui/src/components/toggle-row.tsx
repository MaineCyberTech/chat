import React from "react";

export interface ToggleRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
}

export function ToggleRow({ label, description, checked, onChange, disabled, id }: ToggleRowProps) {
  const toggleId = id || `toggle-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="flex-1">
        <label
          htmlFor={toggleId}
          className="text-sm font-medium"
          style={{ color: "var(--center-channel-color)" }}
        >
          {label}
        </label>
        {description && (
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>
            {description}
          </p>
        )}
      </div>
      <button
        id={toggleId}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
          disabled ? "cursor-not-allowed opacity-50" : ""
        }`}
        style={{
          backgroundColor: checked
            ? "var(--button-bg)"
            : "rgba(var(--center-channel-color-rgb), 0.16)",
        }}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          } mt-0.5`}
        />
      </button>
    </div>
  );
}
