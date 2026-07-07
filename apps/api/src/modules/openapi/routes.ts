import { Router } from "express";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const specPath = join(__dirname, "..", "..", "..", "..", "..", "docs", "api", "openapi.json");
const openApiSpec = JSON.parse(readFileSync(specPath, "utf-8"));

const router = Router();

router.get("/openapi.json", (_req, res) => {
  res.json(openApiSpec);
});

export default router;
