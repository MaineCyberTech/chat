import { Router } from "express";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let openApiSpec: Record<string, unknown> | null = null;
try {
  const specPath = join(__dirname, "..", "..", "..", "..", "..", "docs", "api", "openapi.json");
  openApiSpec = JSON.parse(readFileSync(specPath, "utf-8"));
} catch {
  // openapi.json not available (production build), use fallback info
  openApiSpec = { info: { title: "Chat API", version: "1.0.0" }, paths: {} };
}

const router = Router();

router.get("/openapi.json", (_req, res) => {
  res.json(openApiSpec);
});

export default router;
