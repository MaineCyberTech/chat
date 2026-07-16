"use client";

import { t } from "@/lib/i18n";

interface Props {
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}

export function PaginationBar({ currentPage, totalPages, onPrev, onNext }: Props) {
  return (
    <div className="mt-4 flex items-center justify-between">
      <button
        onClick={onPrev}
        disabled={currentPage <= 1}
        className="rounded-md px-3 py-1 text-xs transition-colors disabled:cursor-not-allowed"
        style={{
          color: currentPage <= 1 ? "var(--text-tertiary)" : "var(--button-bg)",
        }}
      >
        {t("admin.previous", "Previous")}
      </button>
      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
        {t("admin.page", { current: currentPage, total: totalPages })}
      </span>
      <button
        onClick={onNext}
        disabled={currentPage >= totalPages}
        className="rounded-md px-3 py-1 text-xs transition-colors disabled:cursor-not-allowed"
        style={{
          color: currentPage >= totalPages ? "var(--text-tertiary)" : "var(--button-bg)",
        }}
      >
        {t("admin.next", "Next")}
      </button>
    </div>
  );
}
