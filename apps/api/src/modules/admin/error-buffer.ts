import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";

const MAX_ENTRIES = 200;

export interface ErrorEntry {
  level: "error" | "warn";
  message: string;
  requestId?: string;
  path?: string;
  code?: string;
  statusCode?: number;
  timestamp: string;
}

const buffer: ErrorEntry[] = [];

/**
 * Optional durable backing store. When `ERROR_LOG_FILE` is set the buffer is
 * also appended to (newline-delimited JSON) and rehydrated from it on startup,
 * so /admin/logs survives restarts instead of being lost with the process
 * (OBS-P2-003). Mount the path on a persistent volume in production.
 */
function logFilePath(): string | undefined {
  const path = process.env.ERROR_LOG_FILE?.trim();
  return path ? path : undefined;
}

/** Redact email-like PII before it is buffered or written to disk. */
function redactPii(text: string): string {
  return text.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[EMAIL]");
}

/** Rehydrate the in-memory buffer from `ERROR_LOG_FILE` (no-op when unset). */
export function initErrorLog(): void {
  const path = logFilePath();
  if (!path || !existsSync(path)) return;
  try {
    const entries = readFileSync(path, "utf8")
      .split("\n")
      .filter((line) => line.trim() !== "")
      .slice(-MAX_ENTRIES)
      .map((line) => JSON.parse(line) as ErrorEntry)
      .filter((entry) => entry && typeof entry.message === "string");
    buffer.length = 0;
    buffer.push(...entries.reverse());
  } catch {
    // Corrupt or unreadable log: start from an empty buffer rather than crash.
  }
}

export function pushError(entry: ErrorEntry) {
  const safeEntry: ErrorEntry = { ...entry, message: redactPii(entry.message) };
  buffer.unshift(safeEntry);
  if (buffer.length > MAX_ENTRIES) buffer.pop();

  const path = logFilePath();
  if (!path) return;
  try {
    mkdirSync(dirname(path), { recursive: true });
    appendFileSync(path, JSON.stringify(safeEntry) + "\n", { mode: 0o600 });
  } catch {
    // Best effort: a logging failure must never break request handling.
  }
}

export function getErrors(limit = 100, level?: string): ErrorEntry[] {
  let result = buffer;
  if (level) result = result.filter((e) => e.level === level);
  return result.slice(0, limit);
}

/** Reset the in-memory buffer (used by tests). */
export function clearErrors() {
  buffer.length = 0;
}
