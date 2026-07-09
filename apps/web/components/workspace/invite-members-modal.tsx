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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-sm flex-col rounded-lg bg-[var(--center-channel-bg)] shadow-[var(--elevation-4)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Invite members"
      >
        <div
          className="flex items-center justify-between border-b px-4 py-3"
          style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)" }}
        >
          <h2 className="text-sm font-semibold text-[var(--center-channel-color)]">
            Invite Members
          </h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
            style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
        <div
          className="relative border-b px-3 py-2"
          style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)" }}
        >
          <Search
            size={14}
            className="absolute top-1/2 left-5 -translate-y-1/2"
            style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search members..."
            className="w-full rounded-md border bg-[var(--center-channel-bg)] py-1.5 pr-2 pl-7 text-sm text-[var(--center-channel-color)] placeholder:text-[rgba(var(--center-channel-color-rgb),0.56)] focus:border-[var(--button-bg)] focus:ring-2 focus:ring-[rgba(var(--button-bg-rgb),0.24)] focus:outline-none"
            style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)" }}
            aria-label="Search members"
          />
        </div>
        <div className="max-h-56 overflow-y-auto p-1">
          {results.length === 0 && (
            <p
              className="px-3 py-4 text-center text-xs"
              style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
            >
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
                  isSelected ? "" : "hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
                }`}
                style={
                  isSelected ? { backgroundColor: "rgba(var(--button-bg-rgb), 0.12)" } : undefined
                }
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                    isSelected
                      ? "text-white"
                      : "bg-[var(--color-avatar-bg)] text-[var(--color-avatar-fg)]"
                  }`}
                  style={isSelected ? { backgroundColor: "var(--button-bg)" } : undefined}
                >
                  {isSelected ? (
                    <UserCheck size={14} />
                  ) : (
                    (m.display_name ?? m.email).charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[var(--center-channel-color)]">
                    {m.display_name ?? m.email.split("@")[0]}
                  </p>
                  <p
                    className="truncate text-xs"
                    style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
                  >
                    {m.email}
                  </p>
                </div>
                {isSelected ? (
                  <X size={14} className="shrink-0" style={{ color: "var(--button-bg)" }} />
                ) : (
                  <Plus
                    size={14}
                    className="shrink-0"
                    style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
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
          <button
            onClick={handleInvite}
            disabled={selected.size === 0 || sending}
            className={`w-full rounded-lg px-4 py-2 text-sm font-medium text-white ${
              selected.size === 0 || sending ? "cursor-not-allowed" : "hover:opacity-90"
            }`}
            style={
              selected.size === 0 || sending
                ? {
                    backgroundColor: "rgba(var(--center-channel-color-rgb), 0.08)",
                    color: "rgba(var(--center-channel-color-rgb), 0.56)",
                  }
                : { backgroundColor: "var(--button-bg)" }
            }
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
