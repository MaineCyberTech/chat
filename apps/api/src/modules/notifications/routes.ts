import { Router, type Router as RouterType } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateUuidParam } from "../../middleware/validate-uuid.js";
import { notificationService } from "./service.js";
import { pushSubscriptionService } from "./push-subscription-service.js";
import { z } from "zod";

const router: RouterType = Router();
router.use(authenticate);

const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
  user_agent: z.string().optional(),
});

// Push subscription routes
router.post("/push-subscriptions", async (req, res) => {
  const parsed = pushSubscriptionSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } });
    return;
  }
  const subscription = await pushSubscriptionService.create(req.userId!, parsed.data);
  res.status(201).json({ subscription });
});

router.get("/push-subscriptions", async (req, res) => {
  const subscriptions = await pushSubscriptionService.list(req.userId!);
  res.json({ subscriptions });
});

router.delete("/push-subscriptions/:id", validateUuidParam("id"), async (req, res) => {
  const deleted = await pushSubscriptionService.delete(req.userId!, req.params.id as string);
  if (!deleted) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Subscription not found" } });
    return;
  }
  res.status(204).send();
});

// VAPID public key for frontend
router.get("/push-subscriptions/vapid-key", async (_req, res) => {
  const publicKey = pushSubscriptionService.getVapidPublicKey();
  res.json({ publicKey });
});

// Existing notification routes
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
