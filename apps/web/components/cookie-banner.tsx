"use client";

import React, { useEffect, useState, useRef } from "react";
import { Button } from "@chat/ui";
import { api } from "@/lib/api";

const COOKIE_CONSENT_KEY = "cookie-consent-given";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dnt =
      typeof navigator !== "undefined" &&
      (navigator.doNotTrack === "1" ||
        (navigator as unknown as Record<string, string>).msDoNotTrack === "1");
    if (dnt) {
      void acceptEssential();
      return;
    }
    const given = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!given) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  async function acceptAll() {
    try {
      await api.post("/consent/log", { consent_type: "cookies", granted: true });
      await api.post("/consent/log", { consent_type: "analytics", granted: true });
    } catch {
      console.warn("Consent recording failed");
      // Consent recording is best-effort
    }
    localStorage.setItem(COOKIE_CONSENT_KEY, "true");
    setVisible(false);
  }

  async function acceptEssential() {
    try {
      await api.post("/consent/log", { consent_type: "cookies", granted: true });
    } catch {
      console.warn("Essential consent recording failed");
      // best-effort
    }
    localStorage.setItem(COOKIE_CONSENT_KEY, "true");
    setVisible(false);
  }

  useEffect(() => {
    if (!visible) return;
    const el = bannerRef.current;
    if (!el) return;
    const prevFocus = document.activeElement as HTMLElement;
    const focusable = el.querySelectorAll<HTMLElement>("button, [tabindex]:not([tabindex='-1'])");
    if (focusable.length > 0) focusable[0]?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      e.preventDefault();
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) last?.focus();
      else if (!e.shiftKey && document.activeElement === last) first?.focus();
    };
    el.addEventListener("keydown", handler);
    return () => {
      el.removeEventListener("keydown", handler);
      prevFocus?.focus();
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      ref={bannerRef}
      className="fixed right-0 bottom-0 left-0 z-50 border-t p-4 shadow-[var(--shadow-xl)]"
      role="dialog"
      aria-modal="true"
      aria-label="Cookie consent"
      aria-live="polite"
      style={{
        borderColor: "rgba(var(--center-channel-color-rgb), 0.16)",
        backgroundColor: "var(--center-channel-bg)",
      }}
    >
      <div className="mx-auto flex max-w-4xl flex-col items-start gap-3 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          This site uses cookies for authentication and analytics. By continuing, you agree to our
          use of cookies.
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="ghost" size="sm" onClick={acceptEssential}>
            Essential only
          </Button>
          <Button variant="primary" size="sm" onClick={acceptAll}>
            Accept all
          </Button>
        </div>
      </div>
    </div>
  );
}
