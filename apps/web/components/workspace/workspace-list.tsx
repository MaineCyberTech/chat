"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { EmptyState, Skeleton, useToast } from "@chat/ui";
import { Trash2 } from "lucide-react";
import type { Workspace } from "@chat/db";

export function WorkspaceList({ activeSlug }: { activeSlug?: string }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    api
      .get<{ workspaces: Workspace[] }>("/workspaces")
      .then((res) => setWorkspaces(res.workspaces))
      .catch(() => setWorkspaces([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(workspaceId: string) {
    setDeleting(true);
    setDeleteError("");
    try {
      await api.delete(`/workspaces/${workspaceId}`);
      setWorkspaces((prev) => prev.filter((w) => w.id !== workspaceId));
      setDeleteConfirmId(null);
      addToast({ title: "Workspace deleted", variant: "success", duration: 3000 });
    } catch {
      setDeleteError("Failed to delete workspace.");
      addToast({ title: "Error", description: "Failed to delete workspace.", variant: "error" });
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-1 px-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-8 w-5/6" />
      </div>
    );
  }

  if (workspaces.length === 0) {
    return <EmptyState description="No workspaces yet" className="!py-0 px-2" />;
  }

  return (
    <>
      <ul className="space-y-0.5" role="listbox" aria-label="Workspaces">
        {workspaces.map((ws) => (
          <li key={ws.id} role="option" aria-selected={activeSlug === ws.slug}>
            <div className="group flex items-center">
              <Link
                href={`/${ws.slug}`}
                className={`block flex-1 rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-[rgba(var(--center-channel-color-rgb),0.08)] ${
                  activeSlug === ws.slug ? "font-medium" : "text-[var(--center-channel-color)]"
                }`}
                style={
                  activeSlug === ws.slug
                    ? { backgroundColor: "rgba(var(--center-channel-color-rgb), 0.08)" }
                    : undefined
                }
              >
                # {ws.name}
              </Link>
              <button
                onClick={() => setDeleteConfirmId(ws.id)}
                className="mr-1 flex h-6 w-6 items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
                aria-label={`Delete workspace ${ws.name}`}
              >
                <Trash2
                  size={12}
                  style={{ color: "var(--text-tertiary)" }}
                />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="w-full max-w-sm rounded-lg bg-[var(--center-channel-bg)] p-6 shadow-[var(--elevation-4)]"
            role="alertdialog"
            aria-label="Delete workspace"
          >
            <h3 className="text-sm font-semibold text-[var(--center-channel-color)]">
              Delete workspace?
            </h3>
            <p
              className="mt-1 text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              This will permanently delete the workspace and all its channels and messages. This
              cannot be undone.
            </p>
            {deleteError && (
              <p className="mt-2 text-xs" style={{ color: "var(--dnd-indicator)" }} role="alert">
                {deleteError}
              </p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setDeleteConfirmId(null);
                  setDeleteError("");
                }}
                className="rounded-md px-3 py-1.5 text-xs font-medium hover:bg-[rgba(var(--center-channel-color-rgb),0.08)]"
                style={{ color: "var(--text-secondary)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={deleting}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: "var(--dnd-indicator)" }}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
