"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@chat/ui";
import { X, Search, Check, UserPlus, Trash2, Users, AlertTriangle } from "lucide-react";
import { UserPickerModal } from "./user-picker-modal";

interface Group {
  id: string;
  workspace_id: string;
  name: string;
  display_name?: string;
  description: string;
  created_by: string;
  created_at: string;
  user_group_members: { count: number }[];
}

interface MemberInfo {
  user_id: string;
  display_name: string;
  email: string;
}

interface User {
  id: string;
  display_name: string;
}

type ModalMode =
  | "create"
  | "edit"
  | "delete"
  | "add-members"
  | "remove-member"
  | "detail";

interface Props {
  mode: ModalMode;
  group: Group | null;
  workspaceId: string;
  members: MemberInfo[];
  onClose: () => void;
  onSaved: () => void;
}

export function GroupModal({ mode, group, workspaceId, members, onClose, onSaved }: Props) {
  const { addToast } = useToast();
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [groupMembers, setGroupMembers] = useState<MemberInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "edit" && group) {
      setGroupName(group.display_name ?? group.name);
      setGroupDesc(group.description ?? "");
    }
    if (mode === "detail" && group) {
      api
        .get<{ members: MemberInfo[] }>(`/groups/${group.id}/members`)
        .then((res) => setGroupMembers(res.members))
        .catch(() => setGroupMembers([]));
    }
    if (mode === "create") {
      setGroupName("");
      setGroupDesc("");
      setSelectedMemberIds(new Set());
    }
  }, [mode, group]);

  function toggleMember(userId: string) {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  async function handleCreate() {
    if (!groupName.trim() || !workspaceId) return;
    setLoading(true);
    try {
      const res = await api.post<{ group: Group }>("/groups", {
        workspace_id: workspaceId,
        name: groupName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, ""),
        description: groupDesc.trim(),
        member_ids: Array.from(selectedMemberIds),
      });
      addToast({ title: "Group created", variant: "success", duration: 2000 });
      onSaved();
    } catch {
      addToast({ title: "Failed to create group", variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit() {
    if (!group || !groupName.trim()) return;
    setLoading(true);
    try {
      await api.patch(`/groups/${group.id}`, {
        name: groupName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, ""),
        description: groupDesc.trim(),
      });
      addToast({ title: "Group updated", variant: "success", duration: 2000 });
      onSaved();
    } catch {
      addToast({ title: "Failed to update group", variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!group) return;
    setLoading(true);
    try {
      await api.delete(`/groups/${group.id}`);
      addToast({ title: "Group deleted", variant: "success", duration: 2000 });
      onSaved();
    } catch {
      addToast({ title: "Failed to delete group", variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMembers() {
    if (!group || selectedMemberIds.size === 0) return;
    setLoading(true);
    try {
      await api.post(`/groups/${group.id}/members`, {
        user_ids: Array.from(selectedMemberIds),
      });
      addToast({ title: "Members added", variant: "success", duration: 2000 });
      onSaved();
    } catch {
      addToast({ title: "Failed to add members", variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!group) return;
    setLoading(true);
    setRemovingUserId(userId);
    try {
      await api.delete(`/groups/${group.id}/members/${userId}`);
      addToast({ title: "Member removed", variant: "success", duration: 2000 });
      onSaved();
    } catch {
      addToast({ title: "Failed to remove member", variant: "error" });
    } finally {
      setLoading(false);
      setRemovingUserId(null);
    }
  }

  const users: User[] = members.map((m) => ({
    id: m.user_id,
    display_name: m.display_name || m.email?.split("@")[0] || m.user_id.slice(0, 8),
  }));

  const existingIds = new Set(groupMembers.map((m) => m.user_id));

  if (mode === "add-members") {
    const availableUsers = users.filter((u) => !existingIds.has(u.id));
    return (
      <UserPickerModal
        users={availableUsers}
        selectedIds={selectedMemberIds}
        onToggle={toggleMember}
        onCancel={onClose}
        onSubmit={handleAddMembers}
        submitLabel={loading ? "Adding..." : `Add members (${selectedMemberIds.size})`}
        submitDisabled={selectedMemberIds.size === 0 || loading}
        title={`Add members to @${group?.name}`}
        description="Search and select users to add to this group."
      />
    );
  }

  const userMap = new Map(users.map((u) => [u.id, u.display_name]));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-[var(--center-channel-bg)] p-4 shadow-[var(--elevation-5)]"
        style={{ color: "var(--center-channel-color)" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`${mode} group`}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            {mode === "create" && "Create Group"}
            {mode === "edit" && "Edit Group"}
            {mode === "delete" && "Delete Group"}
            {mode === "detail" && `@${group?.name}`}
            {mode === "remove-member" && "Remove member"}
          </h2>
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
            style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        {/* Create / Edit form */}
        {(mode === "create" || mode === "edit") && (
          <div className="space-y-3">
            <div>
              <label
                className="mb-1 block text-xs font-medium"
                style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}
              >
                Name
              </label>
              <input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Group name"
                className="w-full rounded border bg-transparent px-2 py-1.5 text-sm focus:outline-none"
                style={{
                  borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                  color: "var(--center-channel-color)",
                }}
                aria-label="Group name"
              />
            </div>
            <div>
              <label
                className="mb-1 block text-xs font-medium"
                style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}
              >
                Description
              </label>
              <textarea
                value={groupDesc}
                onChange={(e) => setGroupDesc(e.target.value)}
                placeholder="Brief description (optional)"
                rows={2}
                className="w-full rounded border bg-transparent px-2 py-1.5 text-sm focus:outline-none"
                style={{
                  borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                  color: "var(--center-channel-color)",
                }}
                aria-label="Group description"
              />
            </div>

            {mode === "create" && (
              <div>
                <label
                  className="mb-1 block text-xs font-medium"
                  style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}
                >
                  Add members ({selectedMemberIds.size})
                </label>
                <div
                  className="max-h-40 space-y-0.5 overflow-y-auto rounded border p-1"
                  style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)" }}
                >
                  {users.length === 0 && (
                    <p className="px-2 py-1 text-xs" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>
                      No members available
                    </p>
                  )}
                  {users.map((u) => {
                    const isSel = selectedMemberIds.has(u.id);
                    return (
                      <button
                        key={u.id}
                        onClick={() => toggleMember(u.id)}
                        className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
                        style={{ color: "var(--center-channel-color)" }}
                      >
                        <span
                          className="flex h-5 w-5 items-center justify-center rounded text-xs"
                          style={{
                            background: isSel ? "var(--button-bg)" : "rgba(var(--center-channel-color-rgb), 0.16)",
                            color: "#fff",
                          }}
                        >
                          {isSel ? <Check size={10} /> : null}
                        </span>
                        <span>{u.display_name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              onClick={mode === "create" ? handleCreate : handleEdit}
              disabled={!groupName.trim() || loading}
              className="w-full rounded-md py-1.5 text-xs font-medium text-white disabled:opacity-50"
              style={{ background: "var(--button-bg)" }}
            >
              {loading
                ? "Saving..."
                : mode === "create"
                  ? "Create Group"
                  : "Save Changes"}
            </button>
          </div>
        )}

        {/* Delete confirmation */}
        {mode === "delete" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-md p-3" style={{ background: "rgba(var(--dnd-indicator-rgb), 0.08)" }}>
              <AlertTriangle size={20} style={{ color: "var(--dnd-indicator)" }} />
              <div>
                <p className="text-sm font-medium">Delete @{group?.name}?</p>
                <p className="text-xs" style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}>
                  This will permanently remove this group and all member associations.
                  Members will no longer be mentionable as @{group?.name}. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-md py-1.5 text-xs font-medium"
                style={{
                  background: "rgba(var(--center-channel-color-rgb), 0.08)",
                  color: "var(--center-channel-color)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 rounded-md py-1.5 text-xs font-medium text-white disabled:opacity-50"
                style={{ background: "var(--dnd-indicator)" }}
              >
                {loading ? "Deleting..." : "Delete group"}
              </button>
            </div>
          </div>
        )}

        {/* Group detail */}
        {mode === "detail" && (
          <div className="space-y-3">
            <div>
              <p className="text-xs" style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}>
                Description
              </p>
              <p className="text-sm">{group?.description || "No description"}</p>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <p className="text-xs font-medium" style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}>
                  Members ({groupMembers.length})
                </p>
                <button
                  onClick={() => {
                    onClose();
                    setTimeout(() => {
                      window.dispatchEvent(
                        new CustomEvent("chat:group-add-members", { detail: { groupId: group?.id } }),
                      );
                    }, 0);
                  }}
                  className="flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
                  style={{ color: "var(--button-bg)" }}
                >
                  <UserPlus size={12} /> Add
                </button>
              </div>
              <div className="max-h-48 space-y-0.5 overflow-y-auto rounded border p-1"
                style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)" }}
              >
                {groupMembers.length === 0 && (
                  <p className="px-2 py-2 text-xs" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>
                    No members
                  </p>
                )}
                {groupMembers.map((gm) => (
                  <div
                    key={gm.user_id}
                    className="flex items-center gap-2 rounded px-2 py-1.5 text-sm"
                  >
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white"
                      style={{ background: "var(--button-bg)" }}
                    >
                      {(gm.display_name ?? gm.email ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <span className="flex-1">{gm.display_name || gm.email?.split("@")[0]}</span>
                    <button
                      onClick={() => handleRemoveMember(gm.user_id)}
                      disabled={loading && removingUserId === gm.user_id}
                      className="flex h-6 w-6 items-center justify-center rounded hover:bg-[rgba(var(--dnd-indicator-rgb),0.08)]"
                      style={{ color: "var(--dnd-indicator)" }}
                      aria-label={`Remove ${gm.display_name}`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full rounded-md py-1.5 text-xs font-medium"
              style={{
                background: "rgba(var(--center-channel-color-rgb), 0.08)",
                color: "var(--center-channel-color)",
              }}
            >
              Close
            </button>
          </div>
        )}

        {/* Remove member confirmation */}
        {mode === "remove-member" && removingUserId && (
          <div className="space-y-4">
            <p className="text-sm">
              Remove <strong>{userMap.get(removingUserId) ?? removingUserId.slice(0, 8)}</strong> from @{group?.name}?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setRemovingUserId(null)}
                className="flex-1 rounded-md py-1.5 text-xs font-medium"
                style={{
                  background: "rgba(var(--center-channel-color-rgb), 0.08)",
                  color: "var(--center-channel-color)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemoveMember(removingUserId)}
                disabled={loading}
                className="flex-1 rounded-md py-1.5 text-xs font-medium text-white disabled:opacity-50"
                style={{ background: "var(--dnd-indicator)" }}
              >
                {loading ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
