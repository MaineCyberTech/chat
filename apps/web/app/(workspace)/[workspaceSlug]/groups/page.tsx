"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth/auth-context";
import { Skeleton } from "@chat/ui";
import { Users, Plus, Pencil, Trash2, X, Check } from "lucide-react";

interface Group {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
  user_group_members: { count: number }[];
}

interface WorkspaceMember {
  user_id: string;
  display_name: string;
  email: string;
}

export default function UserGroupsPage() {
  const { user } = useAuth();
  const params = useParams<{ workspaceSlug: string }>();
  const workspaceSlug = params?.workspaceSlug ?? "";
  const [groups, setGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [workspaceId, setWorkspaceId] = useState("");

  useEffect(() => {
    if (!user || !workspaceSlug) return;
    api
      .get<{ workspaces: { id: string; slug: string }[] }>("/workspaces")
      .then((res) => {
        const ws = res.workspaces.find((w) => w.slug === workspaceSlug);
        if (!ws) return;
        setWorkspaceId(ws.id);
        Promise.all([
          api.get<{ groups: Group[] }>(`/groups?workspace_id=${ws.id}`),
          api.get<{ members: WorkspaceMember[] }>(`/workspaces/${ws.id}/members`),
        ])
          .then(([gRes, mRes]) => {
            setGroups(gRes.groups);
            setMembers(mRes.members);
          })
          .catch((e) => setError(e instanceof Error ? e.message : "Failed to load groups"))
          .finally(() => setLoading(false));
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load workspace");
        setLoading(false);
      });
  }, [user, workspaceSlug]);

  function openCreate() {
    setEditingGroup(null);
    setGroupName("");
    setGroupDesc("");
    setSelectedMembers(new Set());
    setShowModal(true);
  }

  function openEdit(g: Group) {
    setEditingGroup(g);
    setGroupName(g.name);
    setGroupDesc(g.description);
    api
      .get<{ members: { user_id: string }[] }>(`/groups/${g.id}/members`)
      .then((res) => {
        setSelectedMembers(new Set(res.members.map((m) => m.user_id)));
      })
      .catch(() => setSelectedMembers(new Set()));
    setShowModal(true);
  }

  async function saveGroup() {
    if (!groupName.trim() || !workspaceId) return;
    try {
      if (editingGroup) {
        await api.patch(`/groups/${editingGroup.id}`, {
          name: groupName.trim(),
          description: groupDesc.trim(),
        });
        setGroups((prev) =>
          prev.map((g) =>
            g.id === editingGroup.id
              ? { ...g, name: groupName.trim(), description: groupDesc.trim() }
              : g,
          ),
        );
      } else {
        const res = await api.post<{ group: Group }>("/groups", {
          workspace_id: workspaceId,
          name: groupName.trim(),
          description: groupDesc.trim(),
          member_ids: Array.from(selectedMembers),
        });
        setGroups((prev) => [
          ...prev,
          { ...res.group, user_group_members: [{ count: selectedMembers.size }] },
        ]);
      }
      setShowModal(false);
    } catch {
      console.warn("Failed to save group");
    }
  }

  async function deleteGroup(id: string) {
    if (!confirm("Delete this group?")) return;
    try {
      await api.delete(`/groups/${id}`);
      setGroups((prev) => prev.filter((g) => g.id !== id));
    } catch {
      console.warn("Failed to delete group");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border p-3" style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)" }}>
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center p-6">
        <p className="mb-3 text-sm" style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}>{error}</p>
        <button
          onClick={() => { setError(null); setLoading(true); window.location.reload(); }}
          className="rounded-md px-4 py-2 text-xs font-medium text-white"
          style={{ background: "var(--button-bg)" }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "var(--center-channel-color)" }}>
          <Users size={24} className="mr-2 inline" />
          User Groups
        </h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-white"
          style={{ background: "var(--button-bg)" }}
        >
          <Plus size={14} /> New Group
        </button>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm" style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}>
          No groups yet. Create groups to mention multiple people at once with @groupname.
        </p>
      ) : (
        <div className="space-y-2">
          {groups.map((g) => (
            <div
              key={g.id}
              className="flex items-center gap-3 rounded-lg border p-3"
              style={{
                borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                background: "var(--center-channel-bg)",
              }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ background: "var(--button-bg)" }}
              >
                {g.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <code
                    className="rounded px-1.5 py-0.5 text-sm font-medium"
                    style={{
                      background: "rgba(var(--button-bg-rgb), 0.12)",
                      color: "var(--button-bg)",
                    }}
                  >
                    @{g.name}
                  </code>
                  <span
                    className="text-xs"
                    style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
                  >
                    {g.user_group_members?.[0]?.count ?? 0} members
                  </span>
                </div>
                {g.description && (
                  <p
                    className="mt-0.5 text-xs"
                    style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}
                  >
                    {g.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => openEdit(g)}
                className="flex h-7 w-7 items-center justify-center rounded hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
                style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
                aria-label="Edit group"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => deleteGroup(g.id)}
                className="flex h-7 w-7 items-center justify-center rounded hover:bg-[rgba(var(--dnd-indicator-rgb),0.08)]"
                style={{ color: "var(--dnd-indicator)" }}
                aria-label="Delete group"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-md rounded-lg p-4 shadow-[var(--elevation-5)]"
            style={{ background: "var(--center-channel-bg)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2
                className="text-sm font-semibold"
                style={{ color: "var(--center-channel-color)" }}
              >
                {editingGroup ? "Edit Group" : "Create Group"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="flex h-6 w-6 items-center justify-center rounded hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label
                  className="mb-1 block text-xs font-medium"
                  style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}
                >
                  Name
                </label>
                <div
                  className="flex items-center gap-1 rounded border px-2 py-1"
                  style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)" }}
                >
                  <span className="text-xs font-medium" style={{ color: "var(--button-bg)" }}>
                    @
                  </span>
                  <input
                    value={groupName}
                    onChange={(e) =>
                      setGroupName(e.target.value.replace(/[^a-z0-9_-]/gi, "").toLowerCase())
                    }
                    placeholder="group-name"
                    className="flex-1 bg-transparent text-sm focus:outline-none"
                    style={{ color: "var(--center-channel-color)" }}
                    aria-label="Group name"
                  />
                </div>
              </div>
              <div>
                <label
                  className="mb-1 block text-xs font-medium"
                  style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}
                >
                  Description
                </label>
                <input
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  placeholder="Brief description"
                  className="w-full rounded border px-2 py-1 text-sm focus:outline-none"
                  style={{
                    borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
                    background: "transparent",
                    color: "var(--center-channel-color)",
                  }}
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-xs font-medium"
                  style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}
                >
                  Members ({selectedMembers.size})
                </label>
                <div
                  className="max-h-40 space-y-0.5 overflow-y-auto rounded border p-1"
                  style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)" }}
                >
                  {members.map((m) => (
                    <button
                      key={m.user_id}
                      onClick={() => {
                        const next = new Set(selectedMembers);
                        if (next.has(m.user_id)) next.delete(m.user_id);
                        else next.add(m.user_id);
                        setSelectedMembers(next);
                      }}
                      className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
                      style={{ color: "var(--center-channel-color)" }}
                    >
                      <span
                        className="flex h-5 w-5 items-center justify-center rounded text-xs"
                        style={{
                          background: selectedMembers.has(m.user_id)
                            ? "var(--button-bg)"
                            : "rgba(var(--center-channel-color-rgb), 0.16)",
                          color: "#fff",
                        }}
                      >
                        {selectedMembers.has(m.user_id) ? <Check size={10} /> : null}
                      </span>
                      <span>{m.display_name || m.email.split("@")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={saveGroup}
                disabled={!groupName.trim()}
                className="w-full rounded-md py-1.5 text-xs font-medium text-white disabled:opacity-50"
                style={{ background: "var(--button-bg)" }}
              >
                {editingGroup ? "Save Changes" : "Create Group"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
