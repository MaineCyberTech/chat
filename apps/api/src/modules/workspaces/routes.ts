import { Router, type Router as RouterType } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { workspaceService } from "./service.js";
import { createWorkspaceSchema, updateWorkspaceSchema } from "../../config/validators.js";

const router: RouterType = Router();
router.use(authenticate);

router.get("/", async (req, res) => {
  const workspaces = await workspaceService.listByUser();
  res.json({ workspaces });
});

router.post("/", async (req, res) => {
  const parsed = createWorkspaceSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } });
    return;
  }

  const workspace = await workspaceService.create({
    name: parsed.data.name,
    owner_id: req.userId!,
  });
  if (!workspace) {
    res
      .status(500)
      .json({ error: { code: "CREATE_FAILED", message: "Could not create workspace" } });
    return;
  }

  res.status(201).json({ workspace });
});

router.get("/:id", async (req, res) => {
  const workspace = await workspaceService.getById(req.params.id);
  if (!workspace) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Workspace not found" } });
    return;
  }
  res.json({ workspace });
});

router.patch("/:id", async (req, res) => {
  const parsed = updateWorkspaceSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } });
    return;
  }

  const workspace = await workspaceService.update(req.params.id, parsed.data);
  if (!workspace) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Workspace not found" } });
    return;
  }
  res.json({ workspace });
});

router.delete("/:id", async (req, res) => {
  const deleted = await workspaceService.remove(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Workspace not found" } });
    return;
  }
  res.status(204).send();
});

export default router;
