#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const SOURCE_DIR = process.argv[2] || "apps/web";
const OUTPUT_FILE = process.argv[3] || "apps/web/lib/i18n/en.json";

const T_KEY_PATTERN = /(?<![\.\w])t\("([a-z][\w.]+)"\)/g;
const EXCLUDE_DIRS = new Set(["node_modules", ".turbo", "dist", ".next", "__tests__"]);
const EXCLUDE_KEYS = new Set(["@"]);
const EXCLUDE_PATTERNS = [/^https?:\/\//, /^\//, /^@/, /^\|/, /^const /, /^import /, /^function /, /^ /];

function findSourceFiles(dir, results = []) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (EXCLUDE_DIRS.has(entry.name)) continue;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      findSourceFiles(fullPath, results);
    } else if (entry.isFile() && [".tsx", ".ts"].includes(extname(entry.name))) {
      results.push(fullPath);
    }
  }
  return results;
}

function extractKeys(content) {
  const keys = new Set();
  let match;
  while ((match = T_KEY_PATTERN.exec(content)) !== null) {
    const key = match[1];
    if (EXCLUDE_KEYS.has(key)) continue;
    if (EXCLUDE_PATTERNS.some((p) => p.test(key))) continue;
    keys.add(key);
  }
  return keys;
}

function setNested(obj, keyPath, value) {
  const keys = keyPath.split(".");
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]] || typeof current[keys[i]] !== "object") {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  const lastKey = keys[keys.length - 1];
  if (current[lastKey] === undefined) {
    current[lastKey] = value;
  }
}

function main() {
  console.log(`Scanning ${SOURCE_DIR} for t() calls...`);
  const files = findSourceFiles(SOURCE_DIR);
  console.log(`Found ${files.length} source files`);

  const sourceKeys = new Set();
  for (const file of files) {
    const content = readFileSync(file, "utf-8");
    const keys = extractKeys(content);
    for (const key of keys) {
      sourceKeys.add(key);
    }
  }
  console.log(`Found ${sourceKeys.size} unique translation keys in source.`);

  let existing = {};
  if (existsSync(OUTPUT_FILE)) {
    const raw = readFileSync(OUTPUT_FILE, "utf-8");
    existing = JSON.parse(raw.replace(/^\uFEFF/, ""));
  }

  const merged = JSON.parse(JSON.stringify(existing));
  let added = 0;
  const missing = [];

  for (const key of sourceKeys) {
    const parts = key.split(".");
    const section = parts[0];
    const subKey = parts.slice(1).join(".");
    if (!merged[section] || typeof merged[section] !== "object") {
      merged[section] = {};
    }
    if (merged[section][subKey] === undefined) {
      merged[section][subKey] = `TODO: ${key}`;
      added++;
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.log(`Missing ${missing.length} keys:`);
    for (const k of missing) {
      console.log(`  - ${k}`);
    }
  }

  writeFileSync(OUTPUT_FILE, JSON.stringify(merged, null, 2) + "\n", "utf-8");
  console.log(`Updated ${OUTPUT_FILE} (${added} new keys, ${Object.keys(merged).length} sections)`);
  console.log("Done.");
}

main();
