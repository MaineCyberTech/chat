"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import { Dialog, Button, Input } from "@chat/ui";

interface Props {
  workspaceId: string;
  onCreated: () => void;
}

export function CreateChannelDialog({ workspaceId, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");

    try {
      await api.post(`/workspaces/${workspaceId}/channels`, {
        name: name.trim(),
        topic: topic.trim() || undefined,
      });
      setName("");
      setTopic("");
      setOpen(false);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create channel");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-md px-3 py-1 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
      >
        <span className="text-lg leading-none">+</span> Add channel
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Create Channel">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="general"
            error={error}
            autoFocus
          />
          <Input
            label="Topic (optional)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="What's this channel about?"
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
