"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth/auth-context";
import { Skeleton } from "@chat/ui";
import { Users, Plus, Pencil, Trash2, UserPlus, Eye } from "lucide-react";
import { GroupModal } from "@/components/groups/group-modal";

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
  const [workspaceId, setWorkspaceId] = useState("");

  const [modalMode, setModalMode] = useState<"create" | "edit" | "delete" | "add-members" | "detail" | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const fetchData = useCallback(async (wsId: string) => {
    try {
      const [gRes, mRes] = await Promise.all([
        api.get<{ groups: Group[] }>(`/groups?workspace_id=${wsId}`),
        api.get<{ members: WorkspaceMember[] }>(`/workspaces/${wsId}/members`),
      ]);
      setGroups(gRes.groups);
      setMembers(mRes.members);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load groups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user || !workspaceSlug) return;
    api
      .get<{ workspaces: { id: string; slug: string }[] }>("/workspaces")
      .then((res) => {
        const ws = res.workspaces.find((w) => w.slug === workspaceSlug);
        if (!ws) {
          setError("Workspace not found");
          setLoading(false);
          return;
        }
        setWorkspaceId(ws.id);
        fetchData(ws.id);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load workspace");
        setLoading(false);
      });
  }, [user, workspaceSlug, fetchData]);

  function openCreate() {
    setSelectedGroup(null);
    setModalMode("create");
  }

  function openEdit(g: Group) {
    setSelectedGroup(g);
    setModalMode("edit");
  }

  function openDelete(g: Group) {
    setSelectedGroup(g);
    setModalMode("delete");
  }

  function openAddMembers(g: Group) {
    setSelectedGroup(g);
    setModalMode("add-members");
  }

  function openDetail(g: Group) {
    setSelectedGroup(g);
    setModalMode("detail");
  }

  function handleSaved() {
    setModalMode(null);
    setSelectedGroup(null);
    if (workspaceId) fetchData(workspaceId);
  }

  // Listen for add-members event from detail modal
  useEffect(() => {
    function handler(e: CustomEvent) {
      const g = groups.find((grp) => grp.id === e.detail?.groupId);
      if (g) openAddMembers(g);
    }
    window.addEventListener("chat:group-add-members" as any, handler as any);
    return () => window.removeEventListener("chat:group-add-members" as any, handler as any);
  }, [groups]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border p-3"
              style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)" }}
            >
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
        <p className="mb-3 text-sm" style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}>
          {error}
        </p>
        <button
          onClick={() => {
            setError(null);
            setLoading(true);
            window.location.reload();
          }}
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
          <Plus size={14} /> Create Group
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
                onClick={() => openDetail(g)}
              >
                {g.name.charAt(0).toUpperCase()}
              </div>
              <div
                className="min-w-0 flex-1 cursor-pointer"
                onClick={() => openDetail(g)}
              >
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
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openDetail(g)}
                  className="flex h-7 w-7 items-center justify-center rounded hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
                  style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
                  aria-label="View group details"
                >
                  <Eye size={14} />
                </button>
                <button
                  onClick={() => openAddMembers(g)}
                  className="flex h-7 w-7 items-center justify-center rounded hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
                  style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
                  aria-label="Add members"
                >
                  <UserPlus size={14} />
                </button>
                <button
                  onClick={() => openEdit(g)}
                  className="flex h-7 w-7 items-center justify-center rounded hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
                  style={{ color: "rgba(var(--center-channel-color-rgb), 0.56)" }}
                  aria-label="Edit group"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => openDelete(g)}
                  className="flex h-7 w-7 items-center justify-center rounded hover:bg-[rgba(var(--dnd-indicator-rgb),0.08)]"
                  style={{ color: "var(--dnd-indicator)" }}
                  aria-label="Delete group"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalMode && (
        <GroupModal
          mode={modalMode}
          group={selectedGroup}
          workspaceId={workspaceId}
          members={members}
          onClose={() => {
            setModalMode(null);
            setSelectedGroup(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
