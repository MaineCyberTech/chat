"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import { Dialog, Button, Input, useToast } from "@chat/ui";

interface Channel {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  workspaceId: string;
  onCreated: (channel: Channel) => void;
}

const tempId = () => `temp_ch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

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

    const optimistic: Channel = {
      id: tempId(),
      name: name.trim(),
      slug: name.trim().toLowerCase().replace(/\s+/g, "-"),
    };
    const originalName = name.trim();

    onCreated(optimistic);

    try {
      const res = await api.post<{ channel: Channel }>(`/workspaces/${workspaceId}/channels`, {
        name: originalName,
        topic: topic.trim() || undefined,
        is_read_only: isReadOnly,
      });
      setName("");
      setTopic("");
      setOpen(false);
      addToast({
        title: "Channel created",
        description: `#${originalName} has been created.`,
        variant: "success",
      });
      onCreated(res.channel);
    } catch {
      console.warn("Failed to create channel");
      setError("Failed to create channel. Please try again.");
      addToast({
        title: "Failed to create channel",
        description: `#${originalName} could not be created.`,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-md px-3 py-1 text-sm transition-colors"
        style={{
          color: triggerHovered ? "var(--center-channel-color)" : "var(--text-tertiary)",
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
            style={{ color: "var(--text-secondary)" }}
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
