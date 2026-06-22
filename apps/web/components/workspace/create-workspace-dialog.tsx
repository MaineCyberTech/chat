"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Dialog, Button, Input } from "@chat/ui";

interface Props {
  onCreated?: () => void;
  children?: React.ReactNode;
}

export function CreateWorkspaceDialog({ onCreated, children }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await api.post<{ workspace: { slug: string } }>("/workspaces", {
        name: name.trim(),
      });
      setName("");
      setOpen(false);
      if (onCreated) {
        onCreated();
      } else if (res.workspace?.slug) {
        router.push(`/${res.workspace.slug}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create workspace");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {children ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setOpen(true)}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpen(true)}
        >
          {children}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm text-[var(--color-foreground-tertiary)] transition-colors hover:bg-[var(--color-background-tertiary)] hover:text-[var(--color-foreground-primary)]"
        >
          <span className="text-lg leading-none">+</span> Add workspace
        </button>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title="Create Workspace">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My team"
            error={error}
            autoFocus
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
