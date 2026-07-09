"use client";

import React from "react";
import { Dialog, Button, ScreenReaderOnly } from "@chat/ui";

export function DeleteDialog({
  deleteConfirmId,
  deleteError,
  onClose,
  onConfirm,
}: {
  deleteConfirmId: string;
  deleteError: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  dialogRef?: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <Dialog open={!!deleteConfirmId} onClose={onClose} title="Delete message?">
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        <ScreenReaderOnly>Warning: </ScreenReaderOnly>
        This action cannot be undone.
      </p>
      {deleteError && (
        <p className="mt-2 text-xs text-[var(--error-text)]" role="alert">
          {deleteError}
        </p>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm}>Delete</Button>
      </div>
    </Dialog>
  );
}
