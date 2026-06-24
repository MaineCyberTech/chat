import { Router, type Router as RouterType } from "express";
import { healthService } from "./service.js";

const router: RouterType = Router();

router.get("/health", (_req, res) => {
  const readiness = healthService.getReadiness();
  res.status(200).json(readiness);
});

router.get("/healthz", async (_req, res) => {
  const result = await healthService.getFullHealth();
  const statusCode = result.status === "healthy" ? 200 : result.status === "degraded" ? 200 : 503;
  res.status(statusCode).json(result);
});

export default router;
