"use client";

import { useEffect } from "react";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    import("@/lib/i18n").then(({ setLocale }) => {
      const lang = document.documentElement.lang || "en";
      const locale = lang === "pt-BR" ? "pt-BR" : lang.slice(0, 2);
      setLocale(locale as never);
    });
  }, []);
  return <>{children}</>;
}
