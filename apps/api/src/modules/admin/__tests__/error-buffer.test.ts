import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { clearErrors, getErrors, initErrorLog, pushError } from "../error-buffer.js";

const ORIGINAL = process.env.ERROR_LOG_FILE;
let dir: string;

function entry(message: string, level: "error" | "warn" = "error") {
  return { level, message, timestamp: new Date().toISOString() };
}

describe("error buffer durability (OBS-P2-003)", () => {
  beforeEach(() => {
    clearErrors();
    dir = mkdtempSync(join(tmpdir(), "chat-error-log-"));
    delete process.env.ERROR_LOG_FILE;
  });

  afterEach(() => {
    clearErrors();
    if (ORIGINAL === undefined) delete process.env.ERROR_LOG_FILE;
    else process.env.ERROR_LOG_FILE = ORIGINAL;
    rmSync(dir, { recursive: true, force: true });
  });

  it("keeps entries in memory when ERROR_LOG_FILE is unset", () => {
    pushError(entry("boom"));
    expect(getErrors()).toHaveLength(1);
  });

  it("appends newline-delimited JSON to ERROR_LOG_FILE", () => {
    const file = join(dir, "errors.jsonl");
    process.env.ERROR_LOG_FILE = file;

    pushError(entry("first"));
    pushError(entry("second", "warn"));

    const lines = readFileSync(file, "utf8").trim().split("\n");
    expect(lines).toHaveLength(2);
    // The file is append-only (oldest first); the buffer is newest first.
    expect(JSON.parse(lines[0]).message).toBe("first");
    expect(JSON.parse(lines[1]).message).toBe("second");
  });

  it("rehydrates the buffer from ERROR_LOG_FILE on init", () => {
    const file = join(dir, "errors.jsonl");
    writeFileSync(file, JSON.stringify(entry("persisted")) + "\n");
    process.env.ERROR_LOG_FILE = file;

    initErrorLog();

    const errors = getErrors();
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe("persisted");
  });

  it("ignores a corrupt log file instead of throwing", () => {
    const file = join(dir, "errors.jsonl");
    writeFileSync(file, "not-json\n");
    process.env.ERROR_LOG_FILE = file;

    expect(() => initErrorLog()).not.toThrow();
    expect(getErrors()).toHaveLength(0);
  });

  it("redacts email-like PII before buffering and persisting", () => {
    const file = join(dir, "errors.jsonl");
    process.env.ERROR_LOG_FILE = file;

    pushError(entry("failed for alice@example.com"));

    expect(getErrors()[0].message).toBe("failed for [EMAIL]");
    expect(readFileSync(file, "utf8")).not.toContain("alice@example.com");
  });

  it("never throws when the log path cannot be written", () => {
    process.env.ERROR_LOG_FILE = dir; // a directory, not a file
    expect(() => pushError(entry("boom"))).not.toThrow();
    expect(getErrors()).toHaveLength(1);
  });
});
