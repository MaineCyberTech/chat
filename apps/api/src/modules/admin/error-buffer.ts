const MAX_ENTRIES = 200;

interface ErrorEntry {
  level: "error" | "warn";
  message: string;
  requestId?: string;
  path?: string;
  code?: string;
  statusCode?: number;
  timestamp: string;
}

const buffer: ErrorEntry[] = [];

export function pushError(entry: ErrorEntry) {
  buffer.unshift(entry);
  if (buffer.length > MAX_ENTRIES) buffer.pop();
}

export function getErrors(limit = 100, level?: string): ErrorEntry[] {
  let result = buffer;
  if (level) result = result.filter((e) => e.level === level);
  return result.slice(0, limit);
}
