import { Router, type Router as RouterType } from "express";
import { healthService } from "./service.js";

const router: RouterType = Router();

router.get("/health", (_req, res) => {
  res.json(healthService.getReadiness());
});

router.get("/healthz", async (_req, res) => {
  const result = await healthService.getFullHealth();
  res.status(result.status === "ok" ? 200 : 503).json(result);
});

export default router;
