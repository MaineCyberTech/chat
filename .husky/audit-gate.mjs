#!/usr/bin/env node
// Blocking dependency-vulnerability gate (SUPPLY-P2-003).
//
// Reads a `pnpm audit --prod --json` report and fails (exit 1) on any HIGH or
// CRITICAL advisory that is not in the time-boxed exception list. The exception
// list (`.pnpm-audit-exceptions.json`) is shared with the CI audit gate, so the
// same allowlist governs both. The gate also fails once the list has expired,
// and fails closed (exit 1) when an advisory is present but no allowlist exists.
//
// Usage: node .husky/audit-gate.mjs <audit.json> [exceptions.json]
// Exit:  0 pass, 1 blocked, 2 bad usage / unreadable audit report.

import { readFileSync } from "node:fs";

const [, , auditPath, exceptionsPath = ".pnpm-audit-exceptions.json"] = process.argv;

if (!auditPath) {
  console.error("audit-gate: usage: node .husky/audit-gate.mjs <pnpm-audit.json> [exceptions.json]");
  process.exit(2);
}

let report;
try {
  report = JSON.parse(readFileSync(auditPath, "utf8"));
} catch (err) {
  console.error(`audit-gate: could not read audit report ${auditPath}: ${err.message}`);
  process.exit(2);
}

let exceptions = null;
try {
  exceptions = JSON.parse(readFileSync(exceptionsPath, "utf8"));
} catch {
  console.error(
    `audit-gate: no exception list at ${exceptionsPath}; failing closed on HIGH/CRITICAL advisories.`,
  );
}

let allow = new Set();
if (exceptions) {
  const expiry = Date.parse(`${exceptions.expires}T23:59:59Z`);
  if (Number.isNaN(expiry) || Date.now() > expiry) {
    console.error(
      `audit-gate: exceptions expired on ${exceptions.expires ?? "(missing date)"}; fix or renew them.`,
    );
    process.exit(1);
  }
  allow = new Set(exceptions.ignoreGhsas ?? []);
}

const blocking = [];
for (const adv of Object.values(report.advisories ?? {})) {
  if (adv.severity !== "high" && adv.severity !== "critical") continue;
  const id = adv.github_advisory_id || `npm-${adv.id}`;
  if (!allow.has(id)) blocking.push(`${adv.severity} ${id} ${adv.module_name}: ${adv.title}`);
}

if (blocking.length) {
  console.error("audit-gate: un-allowlisted HIGH/CRITICAL advisories:\n  " + blocking.join("\n  "));
  process.exit(1);
}

console.log(
  `audit-gate: no HIGH/CRITICAL advisories outside the ${allow.size}-entry time-boxed exception list`,
);
