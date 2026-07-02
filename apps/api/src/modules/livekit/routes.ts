import { Router, type Request, type Response } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { liveKitService } from "./service.js";

const router = Router();

// Get LiveKit connection details and token for a room
router.get("/livekit/token", authenticate, (req: Request, res: Response) => {
  if (!liveKitService.isConfigured()) {
    res
      .status(501)
      .json({ error: { code: "NOT_CONFIGURED", message: "LiveKit is not configured" } });
    return;
  }

  const roomName = (req.query.room as string) || `room_${req.userId}`;
  const identity = req.userId!;
  const displayName = (req.query.name as string) ?? undefined;

  const token = liveKitService.generateToken(roomName, identity, displayName);
  const wsUrl = liveKitService.getWsUrl();

  res.json({ token, wsUrl, roomName, identity });
});

// Check if LiveKit is available
router.get("/livekit/status", (_req: Request, res: Response) => {
  res.json({
    configured: liveKitService.isConfigured(),
    host: process.env.LIVEKIT_HOST ?? null,
  });
});

export default router;
