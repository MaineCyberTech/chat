"use client";

import React, { useState, useRef, useEffect } from "react";
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
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

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
        className="rounded-lg focus-visible:ring-2 focus-visible:ring-[rgba(var(--button-bg-rgb),0.24)] focus-visible:outline-none"
        aria-label="Profile settings"
      >
        <Avatar src={avatarUrl} fallback={user?.email ?? "?"} size="sm" />
      </button>
      {open && (
        <div
          ref={menuRef}
          className="absolute top-full right-0 z-50 mt-1 w-56 max-w-[calc(100vw-1rem)] rounded-lg border bg-[var(--center-channel-bg)] py-1 shadow-[var(--elevation-4)]"
          style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)" }}
        >
          {previewUrl && (
            <div
              className="border-b px-4 py-2"
              style={{ borderColor: "rgba(var(--center-channel-color-rgb), 0.16)" }}
            >
              <p
                className="mb-1 text-xs"
                style={{ color: "var(--text-tertiary)" }}
              >
                Preview
              </p>
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
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[var(--center-channel-color)] transition-colors hover:bg-[rgba(var(--center-channel-color-rgb),0.08)] disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload photo"}
          </button>
          {uploadError && (
            <p className="px-4 py-1 text-xs" style={{ color: "var(--dnd-indicator)" }} role="alert">
              {uploadError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
