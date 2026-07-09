"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import type { Workspace } from "@chat/db";

export function TeamSidebar() {
  const pathname = usePathname();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const currentSlug = pathname?.split("/")[1];

  useEffect(() => {
    api
      .get<{ workspaces: Workspace[] }>("/workspaces")
      .then((res) => setWorkspaces(res.workspaces))
      .catch(() => {});
  }, []);

  return (
    <div
      className="flex flex-col items-center gap-1 py-2"
      style={{
        width: 65,
        minWidth: 65,
        background: "var(--sidebar-team-background, #0b428c)",
        height: "100%",
        overflowY: "auto",
      }}
    >
      {workspaces.map((ws) => {
        const isActive = ws.slug === currentSlug;
        return (
          <Link
            key={ws.id}
            href={`/${ws.slug}`}
            className="flex items-center justify-center rounded-lg transition-all hover:opacity-80"
            style={{
              width: 44,
              height: 44,
              background: isActive ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)",
              border: isActive ? "2px solid rgba(255,255,255,0.5)" : "2px solid transparent",
            }}
            title={ws.name}
          >
            <span className="text-sm font-bold text-white select-none">
              {ws.name.charAt(0).toUpperCase()}
            </span>
          </Link>
        );
      })}
      {workspaces.length === 0 && (
        <div
          className="flex items-center justify-center rounded-lg"
          style={{ width: 44, height: 44, background: "rgba(255,255,255,0.05)" }}
          title="No workspaces"
        >
          <span className="text-xs text-white/40">-</span>
        </div>
      )}
    </div>
  );
}
