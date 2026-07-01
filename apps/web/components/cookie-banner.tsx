"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@chat/ui";
import { api } from "@/lib/api";

const COOKIE_CONSENT_KEY = "cookie-consent-given";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const given = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!given) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  async function acceptAll() {
    try {
      await api.post("/consent", { consent_type: "cookies", granted: true });
      await api.post("/consent", { consent_type: "analytics", granted: true });
    } catch {
      // Consent recording is best-effort
    }
    localStorage.setItem(COOKIE_CONSENT_KEY, "true");
    setVisible(false);
  }

  function acceptEssential() {
    try {
      api.post("/consent", { consent_type: "cookies", granted: true }).catch(() => {});
    } catch {
      // best-effort
    }
    localStorage.setItem(COOKIE_CONSENT_KEY, "true");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed right-0 bottom-0 left-0 z-50 border-t border-[var(--color-border-primary)] bg-[var(--color-background-primary)] p-4 shadow-[var(--shadow-xl)]"
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-4xl flex-col items-start gap-3 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm text-[var(--color-foreground-secondary)]">
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
