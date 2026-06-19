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
    return <p className="px-2 text-sm text-gray-500">No workspaces yet</p>;
  }

  return (
    <ul className="space-y-0.5">
      {workspaces.map((ws) => (
        <li key={ws.id}>
          <Link
            href={`/${ws.slug}`}
            className={`block rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${
              activeSlug === ws.slug
                ? "bg-gray-100 font-medium dark:bg-gray-800"
                : "text-gray-700 dark:text-gray-300"
            }`}
          >
            # {ws.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
