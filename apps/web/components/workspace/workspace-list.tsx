"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Skeleton } from "@chat/ui";
import type { Workspace } from "@chat/db";

export function WorkspaceList({ activeSlug }: { activeSlug?: string }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ workspaces: Workspace[] }>("/workspaces")
      .then((res) => setWorkspaces(res.workspaces))
      .catch(() => setWorkspaces([]))
      .finally(() => setLoading(false));
  }, []);

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
    return (
      <p className="px-2 text-sm text-[var(--color-foreground-tertiary)]">No workspaces yet</p>
    );
  }

  return (
    <ul className="space-y-0.5" role="listbox" aria-label="Workspaces">
      {workspaces.map((ws) => (
        <li key={ws.id} role="option" aria-selected={activeSlug === ws.slug}>
          <Link
            href={`/${ws.slug}`}
            className={`block rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-[var(--color-background-tertiary)] ${
              activeSlug === ws.slug
                ? "bg-[var(--color-background-tertiary)] font-medium"
                : "text-[var(--color-foreground-primary)]"
            }`}
          >
            # {ws.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
