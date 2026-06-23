import { Router, type Router as RouterType } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateUuidParam } from "../../middleware/validate-uuid.js";
import { requireWorkspaceMembership } from "../../middleware/require-membership.js";
import { workspaceService } from "./service.js";
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  addWorkspaceMemberSchema,
  updateWorkspaceMemberSchema,
} from "../../config/validators.js";
import { logAuditEvent } from "../../services/audit.js";

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

  try {
    const workspace = await workspaceService.create({
      name: parsed.data.name,
      owner_id: req.userId!,
    });
    if (!workspace) {
      res.status(500).json({
        error: {
          code: "CREATE_FAILED",
          message: "Could not create workspace. Check server logs for details.",
        },
      });
      return;
    }

    res.status(201).json({ workspace });
    logAuditEvent({
      actorUserId: req.userId,
      action: "workspace.create",
      entityType: "workspace",
      entityId: workspace.id,
      metadata: { name: workspace.name },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: { code: "CREATE_FAILED", message } });
  }
});

router.get("/:id", validateUuidParam("id"), requireWorkspaceMembership(), async (req, res) => {
  const workspace = await workspaceService.getById(req.params.id as string);
  if (!workspace) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Workspace not found" } });
    return;
  }
  res.json({ workspace });
});

router.patch("/:id", validateUuidParam("id"), requireWorkspaceMembership(), async (req, res) => {
  const parsed = updateWorkspaceSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } });
    return;
  }

  const workspace = await workspaceService.update(req.params.id as string, parsed.data);
  if (!workspace) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Workspace not found" } });
    return;
  }
  res.json({ workspace });
  logAuditEvent({
    actorUserId: req.userId,
    action: "workspace.update",
    entityType: "workspace",
    entityId: workspace.id,
    metadata: { name: workspace.name },
  });
});

router.get(
  "/:id/members",
  validateUuidParam("id"),
  requireWorkspaceMembership(),
  async (req, res) => {
    const members = await workspaceService.getMembers(req.params.id as string);
    res.json({ members });
  },
);

router.post(
  "/:id/members",
  validateUuidParam("id"),
  requireWorkspaceMembership(),
  async (req, res) => {
    const parsed = addWorkspaceMemberSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } });
      return;
    }

    const success = await workspaceService.addMember(
      req.params.id as string,
      parsed.data.user_id,
      parsed.data.role,
    );
    if (!success) {
      res.status(500).json({ error: { code: "CREATE_FAILED", message: "Could not add member" } });
      return;
    }

    logAuditEvent({
      actorUserId: req.userId,
      action: "workspace_member.add",
      entityType: "workspace_member",
      entityId: parsed.data.user_id,
      metadata: { workspace_id: req.params.id, role: parsed.data.role },
    });

    res.status(201).json({ success: true });
  },
);

router.patch(
  "/:id/members/:userId",
  validateUuidParam("id"),
  validateUuidParam("userId"),
  requireWorkspaceMembership(),
  async (req, res) => {
    const parsed = updateWorkspaceMemberSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } });
      return;
    }

    const success = await workspaceService.updateMemberRole(
      req.params.id as string,
      req.params.userId as string,
      parsed.data.role,
    );
    if (!success) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Member not found" } });
      return;
    }

    logAuditEvent({
      actorUserId: req.userId,
      action: "workspace_member.role_change",
      entityType: "workspace_member",
      entityId: req.params.userId as string,
      metadata: { workspace_id: req.params.id, role: parsed.data.role },
    });

    res.json({ success: true });
  },
);

router.delete(
  "/:id/members/:userId",
  validateUuidParam("id"),
  validateUuidParam("userId"),
  requireWorkspaceMembership(),
  async (req, res) => {
    const success = await workspaceService.removeMember(
      req.params.id as string,
      req.params.userId as string,
    );
    if (!success) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Member not found" } });
      return;
    }

    logAuditEvent({
      actorUserId: req.userId,
      action: "workspace_member.remove",
      entityType: "workspace_member",
      entityId: req.params.userId as string,
      metadata: { workspace_id: req.params.id },
    });

    res.status(204).send();
  },
);

router.delete("/:id", validateUuidParam("id"), requireWorkspaceMembership(), async (req, res) => {
  const deleted = await workspaceService.remove(req.params.id as string);
  if (!deleted) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Workspace not found" } });
    return;
  }
  logAuditEvent({
    actorUserId: req.userId,
    action: "workspace.delete",
    entityType: "workspace",
    entityId: req.params.id as string,
  });
  res.status(204).send();
});

export default router;
