"use client";

import React, { useState, useRef } from "react";
import { Avatar } from "@chat/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth/auth-context";

export function AvatarUpload() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await api.post<{ uploadUrl: string; publicUrl: string }>("/auth/avatar", {
        contentType: file.type,
      });
      await fetch(res.uploadUrl, { method: "PUT", body: file });
      setAvatarUrl(res.publicUrl);
    } catch {
      // Upload failed silently
    } finally {
      setUploading(false);
      setOpen(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="focus:outline-none" aria-label="Profile settings">
        <Avatar
          src={avatarUrl}
          fallback={user?.email ?? "?"}
          size="sm"
        />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
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
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {uploading ? "Uploading..." : "Upload photo"}
          </button>
        </div>
      )}
    </div>
  );
}