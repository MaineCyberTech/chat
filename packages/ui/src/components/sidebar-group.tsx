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
        className="flex w-full items-center gap-1 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <span className={`transition-transform ${open ? "rotate-90" : ""}`}>▸</span>
        {title}
      </button>
      {open && <div className="mt-1">{children}</div>}
    </div>
  );
}
