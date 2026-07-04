"use client";

import React, { useState, useMemo } from "react";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import { Check, Copy } from "lucide-react";

interface Props {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language }: Props) {
  const [copied, setCopied] = useState(false);

  const highlighted = useMemo(() => {
    if (language && hljs.getLanguage(language)) {
      return hljs.highlight(code, { language }).value;
    }
    return hljs.highlightAuto(code).value;
  }, [code, language]);

  const detectedLang = useMemo(() => {
    if (language && hljs.getLanguage(language)) return language;
    return hljs.highlightAuto(code).language ?? "text";
  }, [code, language]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative my-2 overflow-hidden rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-code-bg,#1e1e2e)]">
      <div className="flex items-center justify-between border-b border-[var(--color-border-primary)] bg-[var(--color-background-tertiary)] px-3 py-1.5">
        <span className="text-xs font-medium text-[var(--color-foreground-tertiary)]">
          {detectedLang}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-[var(--color-foreground-tertiary)] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[var(--color-foreground-primary)] focus-visible:opacity-100"
          aria-label="Copy code"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="overflow-x-auto p-3 text-sm leading-relaxed">
        <code className="hljs" dangerouslySetInnerHTML={{ __html: highlighted }} />
      </div>
    </div>
  );
}
