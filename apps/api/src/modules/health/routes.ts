import { Router, type Router as RouterType } from "express";
import { healthService } from "./service.js";

const router: RouterType = Router();

router.get("/health", (_req, res) => {
  const readiness = healthService.getReadiness();
  res.status(200).json(readiness);
});

export default router;
