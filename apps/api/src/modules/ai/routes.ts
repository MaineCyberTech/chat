import { Router, type Request, type Response } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { asyncHandler } from "../../lib/async-handler.js";

const router = Router();
router.use(authenticate);

router.post(
  "/rewrite",
  asyncHandler(async (req: Request, res: Response) => {
    const { text, action } = req.body;
    if (!text || !action) {
      res
        .status(400)
        .json({ error: { code: "INVALID_INPUT", message: "text and action required" } });
      return;
    }

    const rewrites: Record<string, string> = {
      "fix-spelling": text.replace(
        /\b(teh|recieve|seperate|occured|definately)\b/gi,
        (match: string) => {
          const corrections: Record<string, string> = {
            teh: "the",
            recieve: "receive",
            seperate: "separate",
            occured: "occurred",
            definately: "definitely",
          };
          return corrections[match.toLowerCase()] ?? match;
        },
      ),
      shorter:
        text.length > 50
          ? text
              .split(" ")
              .slice(0, Math.ceil(text.split(" ").length * 0.7))
              .join(" ") + "..."
          : text,
      formal: `[Formal] ${text}`,
      concise: text,
      friendly: `[Friendly] ${text}`,
    };

    res.json({ rewritten: rewrites[action] ?? text, action });
  }),
);

export default router;
