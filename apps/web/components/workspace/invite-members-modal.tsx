"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth/auth-context";
import { useToast } from "@chat/ui";
import { X, Search, Plus, UserCheck } from "lucide-react";

interface MemberInfo {
  user_id: string;
  display_name: string;
  email: string;
}

interface Props {
  workspaceId: string;
  onClose: () => void;
}

export function InviteMembersModal({ workspaceId, onClose }: Props) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MemberInfo[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [allMembers, setAllMembers] = useState<MemberInfo[]>([]);

  useEffect(() => {
    api
      .get<{ members: { user_id: string; display_name: string; email: string }[] }>(
        `/workspaces/${workspaceId}/members`,
      )
      .then((res) => {
        setAllMembers(
          res.members
            .filter((m) => m.user_id !== user?.id)
            .map((m) => ({
              user_id: m.user_id,
              display_name: m.display_name,
              email: m.email,
            })),
        );
      })
      .catch(() => {});
  }, [workspaceId, user]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(allMembers.slice(0, 20));
      return;
    }
    const q = query.toLowerCase();
    setResults(
      allMembers
        .filter(
          (m) => m.display_name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q),
        )
        .slice(0, 20),
    );
  }, [query, allMembers]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleInvite() {
    if (selected.size === 0) return;
    setSending(true);
    try {
      const promises = Array.from(selected).map((uid) =>
        api.post(`/workspaces/${workspaceId}/members`, {
          userId: uid,
          role: "member",
        }),
      );
      await Promise.all(promises);
      addToast({
        title: `Invited ${selected.size} member${selected.size > 1 ? "s" : ""}`,
        variant: "success",
      });
      onClose();
    } catch {
      addToast({ title: "Failed to invite members", variant: "error" });
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-dialog-overlay)] p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-sm flex-col rounded-lg bg-[var(--color-dialog-bg)] shadow-[var(--shadow-xl)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Invite members"
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border-primary)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--color-foreground-primary)]">
            Invite Members
          </h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded text-[var(--color-foreground-tertiary)] hover:bg-[var(--color-background-tertiary)]"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
        <div className="relative border-b border-[var(--color-border-primary)] px-3 py-2">
          <Search
            size={14}
            className="absolute top-1/2 left-5 -translate-y-1/2 text-[var(--color-foreground-tertiary)]"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search members..."
            className="w-full rounded-md border border-[var(--color-input-border)] bg-[var(--color-input-bg)] py-1.5 pr-2 pl-7 text-sm text-[var(--color-input-fg)] placeholder:text-[var(--color-input-placeholder)] focus:border-[var(--color-input-border-focus)] focus:ring-2 focus:ring-[var(--color-input-focus-ring)] focus:outline-none"
            aria-label="Search members"
          />
        </div>
        <div className="max-h-56 overflow-y-auto p-1">
          {results.length === 0 && (
            <p className="px-3 py-4 text-center text-xs text-[var(--color-foreground-tertiary)]">
              No members found
            </p>
          )}
          {results.map((m) => {
            const isSelected = selected.has(m.user_id);
            return (
              <button
                key={m.user_id}
                onClick={() => toggle(m.user_id)}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm ${
                  isSelected
                    ? "bg-[var(--color-brand-primary-light)]"
                    : "hover:bg-[var(--color-background-tertiary)]"
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                    isSelected
                      ? "bg-[var(--color-brand-primary)] text-white"
                      : "bg-[var(--color-avatar-bg)] text-[var(--color-avatar-fg)]"
                  }`}
                >
                  {isSelected ? (
                    <UserCheck size={14} />
                  ) : (
                    (m.display_name ?? m.email).charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[var(--color-foreground-primary)]">
                    {m.display_name ?? m.email.split("@")[0]}
                  </p>
                  <p className="truncate text-xs text-[var(--color-foreground-tertiary)]">
                    {m.email}
                  </p>
                </div>
                {isSelected ? (
                  <X size={14} className="shrink-0 text-[var(--color-brand-primary)]" />
                ) : (
                  <Plus size={14} className="shrink-0 text-[var(--color-foreground-tertiary)]" />
                )}
              </button>
            );
          })}
        </div>
        <div className="border-t border-[var(--color-border-primary)] px-4 py-3">
          <button
            onClick={handleInvite}
            disabled={selected.size === 0 || sending}
            className={`w-full rounded-lg px-4 py-2 text-sm font-medium text-white ${
              selected.size === 0 || sending
                ? "cursor-not-allowed bg-[var(--color-background-tertiary)] text-[var(--color-foreground-tertiary)]"
                : "bg-[var(--color-brand-primary)] hover:opacity-90"
            }`}
          >
            {sending
              ? "Inviting..."
              : `Add to workspace${selected.size > 1 ? ` (${selected.size})` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
