"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import { Dialog, Button, Input, useToast } from "@chat/ui";

interface Props {
  workspaceId: string;
  onCreated: () => void;
}

export function CreateChannelDialog({ workspaceId, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [triggerHovered, setTriggerHovered] = useState(false);
  const { addToast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");

    try {
      await api.post(`/workspaces/${workspaceId}/channels`, {
        name: name.trim(),
        topic: topic.trim() || undefined,
        is_read_only: isReadOnly,
      });
      setName("");
      setTopic("");
      setOpen(false);
      addToast({
        title: "Channel created",
        description: `#${name.trim()} has been created.`,
        variant: "success",
      });
      onCreated();
    } catch {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-md px-3 py-1 text-sm transition-colors"
        style={{
          color: triggerHovered
            ? "var(--center-channel-color)"
            : "rgba(var(--center-channel-color-rgb), 0.56)",
          backgroundColor: triggerHovered
            ? "rgba(var(--center-channel-color-rgb), 0.08)"
            : undefined,
        }}
        onMouseEnter={() => setTriggerHovered(true)}
        onMouseLeave={() => setTriggerHovered(false)}
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
          />
          <Input
            label="Topic (optional)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="What's this channel about?"
          />
          <label
            className="flex items-center gap-2 text-xs"
            style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}
          >
            <input
              type="checkbox"
              checked={isReadOnly}
              onChange={(e) => setIsReadOnly(e.target.checked)}
              className="rounded"
              style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)" }}
            />
            Read-only channel (only admins can post)
          </label>
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
