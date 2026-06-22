"use client";

import React, { useState } from "react";

export interface SidebarGroupProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function SidebarGroup({ title, children, defaultOpen = true }: SidebarGroupProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="py-1">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1 px-3 py-1 text-xs font-semibold tracking-wider text-[var(--color-sidebar-title-fg)] transition-colors hover:text-[var(--color-sidebar-title-fg-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:outline-none"
      >
        <span className={`transition-transform duration-200 ${open ? "rotate-90" : ""}`}>▸</span>
        {title}
      </button>
      {open && <div className="mt-1">{children}</div>}
    </div>
  );
}
