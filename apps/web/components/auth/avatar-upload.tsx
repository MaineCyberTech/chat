"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { Avatar } from "@chat/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth/auth-context";

export function AvatarUpload() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview URL
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
    setUploadError("");

    setUploading(true);
    try {
      const res = await api.post<{ uploadUrl: string; publicUrl: string }>("/auth/avatar", {
        contentType: file.type,
      });
      await fetch(res.uploadUrl, { method: "PUT", body: file });
      setAvatarUrl(res.publicUrl);
    } catch {
      setUploadError("Failed to upload. Please try again.");
    } finally {
      setUploading(false);
      setOpen(false);
      if (fileRef.current) fileRef.current.value = "";
      // Clean up preview after a delay so user can see it
      setTimeout(() => {
        URL.revokeObjectURL(preview);
        setPreviewUrl(null);
      }, 2000);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-lg focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:outline-none"
        aria-label="Profile settings"
      >
        <Avatar src={avatarUrl} fallback={user?.email ?? "?"} size="sm" />
      </button>
      {open && (
        <div className="absolute top-full right-0 z-50 mt-1 w-56 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-dialog-bg)] py-1 shadow-[var(--shadow-xl)]">
          {previewUrl && (
            <div className="border-b border-[var(--color-border-primary)] px-4 py-2">
              <p className="mb-1 text-xs text-[var(--color-foreground-tertiary)]">Preview</p>
              <Image
                src={previewUrl}
                alt="Preview of uploaded avatar"
                width={64}
                height={64}
                className="mx-auto rounded-full object-cover"
              />
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[var(--color-foreground-primary)] transition-colors hover:bg-[var(--color-background-tertiary)] disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload photo"}
          </button>
          {uploadError && (
            <p className="px-4 py-1 text-xs text-[var(--color-status-danger-fg)]" role="alert">
              {uploadError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
