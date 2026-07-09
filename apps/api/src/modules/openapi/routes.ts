import { Router } from "express";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let openApiSpec: Record<string, unknown> | null = null;
try {
  const specPath = join(__dirname, "..", "..", "..", "..", "..", "docs", "api", "openapi.json");
  openApiSpec = JSON.parse(readFileSync(specPath, "utf-8"));
} catch {
  openApiSpec = { info: { title: "Chat API", version: "1.0.0" }, paths: {} };
}

let changelog: Record<string, unknown>[] | null = null;
try {
  const changelogPath = join(
    __dirname,
    "..",
    "..",
    "..",
    "..",
    "..",
    "docs",
    "api",
    "changelog.json",
  );
  if (existsSync(changelogPath)) {
    changelog = JSON.parse(readFileSync(changelogPath, "utf-8"));
  }
} catch {
  changelog = null;
}

const router = Router();

router.get("/openapi.json", (_req, res) => {
  res.json(openApiSpec);
});

router.get("/changelog", (_req, res) => {
  res.json(changelog ?? []);
});

export default router;
