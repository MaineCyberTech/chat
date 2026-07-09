import { type Response } from "express";

export interface CsvColumn {
  key: string;
  label?: string;
}

function escapeCsvValue(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function rowsToCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: CsvColumn[],
): string {
  const header = columns.map((c) => c.label ?? c.key).join(",");
  const body = rows.map((row) => columns.map((c) => escapeCsvValue(row[c.key])).join(","));
  return [header, ...body].join("\n");
}

export function formatExportFilename(prefix: string, ext: "csv" | "json"): string {
  return `${prefix}-export-${Date.now()}.${ext}`;
}

export function parseCsv<T extends Record<string, string>>(
  csv: string,
): { data: T[]; errors: string[] } {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return { data: [], errors: [] };
  const headers = parseCsvLine(lines[0]);
  const data: T[] = [];
  const errors: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length === 0) continue;
    if (values.length !== headers.length) {
      errors.push(
        `Row ${i}: column count mismatch (expected ${headers.length}, got ${values.length})`,
      );
      continue;
    }
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] ?? "";
    }
    data.push(row as unknown as T);
  }
  return { data, errors };
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export function sendExportResponse<T extends Record<string, unknown>>(
  res: Response,
  rows: T[],
  columns: CsvColumn[],
  filename: string,
): void {
  const format = res.req.query.format as string | undefined;

  if (format === "json") {
    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${formatExportFilename(filename, "json")}"`,
    );
    res.json(rows);
    return;
  }

  const csv = rowsToCsv(rows, columns);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${formatExportFilename(filename, "csv")}"`,
  );
  res.send(csv);
}
