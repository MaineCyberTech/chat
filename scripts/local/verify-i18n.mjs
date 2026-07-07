#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";

const SOURCE_DIR = process.argv[2] || "apps/web";
const LOCALE_FILE = process.argv[3] || "apps/web/lib/i18n/en.json";

const T_KEY_PATTERN = /(?<![\.\w])t\("([a-z][\w.]+)"\)/g;
const EXCLUDE_DIRS = new Set(["node_modules", ".turbo", "dist", ".next", "__tests__"]);

import { readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

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
    keys.add(match[1]);
  }
  return keys;
}

function getNested(obj, keyPath) {
  const keys = keyPath.split(".");
  let current = obj;
  for (let i = 0; i < keys.length; i++) {
    if (current === undefined || current === null) return undefined;
    current = current[keys[i]];
  }
  return current;
}

function main() {
  console.log(`Verifying i18n translations in ${SOURCE_DIR}...`);

  if (!existsSync(LOCALE_FILE)) {
    console.error(`ERROR: Locale file not found: ${LOCALE_FILE}`);
    console.error("Run 'pnpm i18n:extract' first.");
    process.exit(1);
  }

  const translations = JSON.parse(readFileSync(LOCALE_FILE, "utf-8").replace(/^\uFEFF/, ""));

  const files = findSourceFiles(SOURCE_DIR);
  const sourceKeys = new Set();
  for (const file of files) {
    const content = readFileSync(file, "utf-8");
    const keys = extractKeys(content);
    for (const key of keys) {
      sourceKeys.add(key);
    }
  }

  let missingCount = 0;
  let todoCount = 0;

  for (const key of sourceKeys) {
    const value = getNested(translations, key);
    if (value === undefined) {
      console.log(`  MISSING: ${key}`);
      missingCount++;
    } else if (typeof value === "string" && value.startsWith("TODO:")) {
      todoCount++;
    }
  }

  const extraKeys = [];
  function findKeys(obj, prefix = "") {
    for (const [k, v] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${k}` : k;
      if (typeof v === "object" && v !== null) {
        findKeys(v, fullKey);
      } else if (!sourceKeys.has(fullKey)) {
        extraKeys.push(fullKey);
      }
    }
  }
  findKeys(translations);

  let exitCode = 0;
  if (missingCount > 0) {
    console.error(`ERROR: ${missingCount} translation keys missing in ${LOCALE_FILE}`);
    exitCode = 1;
  }
  if (todoCount > 0) {
    console.warn(`WARNING: ${todoCount} keys have TODO placeholder values`);
  }
  if (extraKeys.length > 0) {
    console.warn(`WARNING: ${extraKeys.length} unused keys in translation file`);
  }
  if (exitCode === 0) {
    console.log(`All ${sourceKeys.size} translation keys verified OK.`);
  }

  process.exit(exitCode);
}

main();
