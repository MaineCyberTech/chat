import { Router, type Router as RouterType } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateUuidParam } from "../../middleware/validate-uuid.js";
import { notificationService } from "./service.js";

const router: RouterType = Router();
router.use(authenticate);

router.get("/notifications", async (req, res) => {
  const notifications = await notificationService.list(req.userId!);
  const unread = await notificationService.unreadCount(req.userId!);
  res.json({ notifications, unread });
});

router.get("/notifications/unread", async (_req, res) => {
  const count = await notificationService.unreadCount(_req.userId!);
  res.json({ unread: count });
});

router.patch("/notifications/:id/read", validateUuidParam("id"), async (req, res) => {
  await notificationService.markRead(req.params.id as string);
  res.status(204).send();
});

router.post("/notifications/read-all", async (req, res) => {
  await notificationService.markAllRead(req.userId!);
  res.status(204).send();
});

export default router;
