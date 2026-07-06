"use client";

import React, { useEffect } from "react";

export function DeleteDialog({
  deleteConfirmId,
  deleteError,
  onClose,
  onConfirm,
  dialogRef,
}: {
  deleteConfirmId: string;
  deleteError: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  dialogRef: React.RefObject<HTMLDivElement | null>;
}) {
  useEffect(() => {
    if (!deleteConfirmId || !dialogRef.current) return;
    const container = dialogRef.current;
    function handleTab(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const focusable = container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", handleTab);
    container.querySelector<HTMLElement>("button")?.focus();
    return () => document.removeEventListener("keydown", handleTab);
  }, [deleteConfirmId, dialogRef]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <div
        ref={dialogRef}
        className="mx-4 max-w-sm rounded-lg p-6"
        style={{ background: "var(--center-channel-bg)", boxShadow: "var(--elevation-5)" }}
        role="dialog"
        aria-labelledby="delete-dialog-title"
        aria-modal="true"
      >
        <h2
          id="delete-dialog-title"
          className="text-lg font-semibold"
          style={{ color: "var(--center-channel-color)" }}
        >
          Delete message?
        </h2>
        <p
          className="mt-2 text-sm"
          style={{ color: "rgba(var(--center-channel-color-rgb), 0.72)" }}
        >
          This action cannot be undone.
        </p>
        {deleteError && (
          <p className="mt-2 text-xs" style={{ color: "var(--error-text)" }} role="alert">
            {deleteError}
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm font-medium"
            style={{
              borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
              color: "var(--center-channel-color)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ background: "var(--dnd-indicator)" }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
