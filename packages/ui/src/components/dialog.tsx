"use client";

import React, { useEffect, useCallback, useRef } from "react";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

function useFocusTrap(containerRef: React.RefObject<HTMLDivElement | null>, isActive: boolean) {
  const hasOpened = useRef(false);

  useEffect(() => {
    if (!isActive || !containerRef.current) {
      hasOpened.current = false;
      return;
    }

    const container = containerRef.current;
    const focusableSelector =
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const focusableElements = container.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusableElements.length === 0) return;

      const first = focusableElements[0]!;
      const last = focusableElements[focusableElements.length - 1]!;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    if (!hasOpened.current) {
      hasOpened.current = true;
      const first = container.querySelector<HTMLElement>(focusableSelector);
      first?.focus();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isActive, containerRef]);
}

export function Dialog({ open, onClose, title, children }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onCloseRef.current();
  }, []);

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previousFocusRef.current?.focus();
    };
  }, [open, handleKeyDown]);

  useFocusTrap(dialogRef, open);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div className="fixed inset-0 bg-[var(--color-dialog-overlay)]" onClick={onClose} />
      <div
        ref={dialogRef}
        className="relative z-10 w-full max-w-sm rounded-xl bg-[var(--color-dialog-bg)] p-6 shadow-[var(--shadow-xl)]"
      >
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h2
              id="dialog-title"
              className="text-lg font-semibold text-[var(--color-foreground-primary)]"
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="rounded p-1 text-[var(--color-dialog-close-btn-fg)] transition-colors hover:bg-[var(--color-dialog-close-btn-bg-hover)] hover:text-[var(--color-dialog-close-btn-fg-hover)]"
              aria-label="Close dialog"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
