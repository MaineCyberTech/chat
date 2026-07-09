"use client";

import React, { useState } from "react";
import { EmptyState } from "@chat/ui";
import { X, Search, Check, UserPlus } from "lucide-react";

interface User {
  id: string;
  display_name: string;
}

interface Props {
  users: User[];
  selectedIds: Set<string>;
  onToggle: (userId: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
  title?: string;
  description?: string;
}

export function UserPickerModal({
  users,
  selectedIds,
  onToggle,
  onCancel,
  onSubmit,
  submitLabel = "Submit",
  submitDisabled = false,
  title = "Select users",
  description,
}: Props) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? users.filter(
        (u) => u.display_name?.toLowerCase().includes(query.toLowerCase()) ?? u.id.includes(query),
      )
    : users;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
    >
      <div
        className="flex w-full max-w-sm flex-col rounded-lg bg-[var(--center-channel-bg)] shadow-[var(--elevation-4)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={title}
      >
        <div
          className="flex items-center justify-between border-b px-4 py-3"
          style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)" }}
        >
          <h2 className="text-sm font-semibold" style={{ color: "var(--center-channel-color)" }}>
            {title}
          </h2>
          <button
            onClick={onCancel}
            className="flex h-7 w-7 items-center justify-center rounded hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
            style={{ color: "var(--text-tertiary)" }}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        {description && (
          <p className="px-4 pt-2 text-xs" style={{ color: "var(--text-secondary)" }}>
            {description}
          </p>
        )}

        {selectedIds.size > 0 && (
          <div
            className="flex flex-wrap gap-1 border-b px-3 py-2"
            style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)" }}
          >
            {Array.from(selectedIds).map((uid) => {
              const u = users.find((x) => x.id === uid);
              return (
                <span
                  key={uid}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    background: "rgba(var(--button-bg-rgb), 0.12)",
                    color: "var(--button-bg)",
                  }}
                >
                  {u?.display_name ?? uid.slice(0, 8)}
                  <button
                    onClick={() => onToggle(uid)}
                    className="ml-0.5 hover:opacity-70"
                    aria-label={`Remove ${u?.display_name ?? uid}`}
                  >
                    <X size={10} />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        <div
          className="relative border-b px-3 py-2"
          style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)" }}
        >
          <Search
            size={14}
            className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2"
            style={{ color: "var(--text-tertiary)" }}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full rounded-md border bg-[var(--center-channel-bg)] py-1.5 pr-2 pl-7 text-sm text-[var(--center-channel-color)] placeholder:text-[rgba(var(--center-channel-color-rgb),0.56)] focus:border-[var(--button-bg)] focus:ring-2 focus:ring-[rgba(var(--button-bg-rgb),0.24)] focus:outline-none"
            style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)" }}
            aria-label="Search users"
          />
        </div>

        <div className="max-h-56 overflow-y-auto p-1">
          {filtered.length === 0 && <EmptyState description="No users found" className="!py-0" />}
          {filtered.map((u) => {
            const isSelected = selectedIds.has(u.id);
            return (
              <button
                key={u.id}
                onClick={() => onToggle(u.id)}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm ${
                  isSelected ? "" : "hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
                }`}
                style={
                  isSelected ? { backgroundColor: "rgba(var(--button-bg-rgb), 0.12)" } : undefined
                }
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium"
                  style={
                    isSelected
                      ? { backgroundColor: "var(--button-bg)", color: "var(--button-color)" }
                      : {
                          backgroundColor: "var(--color-avatar-bg, #e8e8e8)",
                          color: "var(--color-avatar-fg, #333)",
                        }
                  }
                >
                  {isSelected ? (
                    <Check size={14} />
                  ) : (
                    (u.display_name ?? u.id).charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate font-medium"
                    style={{ color: "var(--center-channel-color)" }}
                  >
                    {u.display_name ?? u.id.slice(0, 8)}
                  </p>
                </div>
                {isSelected ? (
                  <X size={14} className="shrink-0" style={{ color: "var(--button-bg)" }} />
                ) : (
                  <UserPlus
                    size={14}
                    className="shrink-0"
                    style={{ color: "var(--text-tertiary)" }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div
          className="border-t px-4 py-3"
          style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)" }}
        >
          <div className="mb-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
            {selectedIds.size > 0
              ? `${selectedIds.size} user${selectedIds.size > 1 ? "s" : ""} selected`
              : "No users selected"}
          </div>
          <button
            onClick={onSubmit}
            disabled={submitDisabled}
            className="w-full rounded-lg px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed"
            style={
              submitDisabled
                ? {
                    backgroundColor: "rgba(var(--center-channel-color-rgb), 0.08)",
                    color: "var(--text-tertiary)",
                  }
                : { backgroundColor: "var(--button-bg)" }
            }
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
