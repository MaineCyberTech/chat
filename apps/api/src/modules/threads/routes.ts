import { Router, type Request, type Response } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireChannelAccess } from "../../middleware/require-membership.js";
import { validateUuidParam } from "../../middleware/validate-uuid.js";
import { threadService } from "./service.js";

const router = Router();
router.use(authenticate);

// Get thread metadata and replies for a message
router.get(
  "/messages/:id/thread",
  validateUuidParam("id"),
  requireChannelAccess("id"),
  async (req: Request, res: Response) => {
    const thread = await threadService.getThread(req.params.id as string, req.supabase!);
    if (!thread) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Thread not found" } });
      return;
    }
    res.json({ thread });
  },
);

// Get thread participants
router.get(
  "/threads/:id/participants",
  validateUuidParam("id"),
  async (req: Request, res: Response) => {
    const participants = await threadService.getParticipants(
      req.params.id as string,
      req.supabase!,
    );
    res.json({ participants });
  },
);

// Join a thread
router.post("/threads/:id/join", validateUuidParam("id"), async (req: Request, res: Response) => {
  const success = await threadService.joinThread(
    req.params.id as string,
    req.userId!,
    req.supabase!,
  );
  if (!success) {
    res.status(500).json({ error: { code: "ADD_FAILED", message: "Could not join thread" } });
    return;
  }
  res.json({ success: true });
});

// Leave a thread
router.post("/threads/:id/leave", validateUuidParam("id"), async (req: Request, res: Response) => {
  await threadService.leaveThread(req.params.id as string, req.userId!, req.supabase!);
  res.json({ success: true });
});

// Get thread unread count
router.get("/threads/:id/unread", validateUuidParam("id"), async (req: Request, res: Response) => {
  const count = await threadService.getUnreadCount(
    req.params.id as string,
    req.userId!,
    req.supabase!,
  );
  res.json({ unread: count });
});

export default router;
