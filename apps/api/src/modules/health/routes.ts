import { Router, type Router as RouterType } from "express";
import { healthService } from "./service.js";

const router: RouterType = Router();

router.get("/health", (_req, res) => {
  res.json(healthService.getReadiness());
});

router.get("/healthz", (_req, res) => {
  res.json(healthService.getLiveness());
});

export default router;
