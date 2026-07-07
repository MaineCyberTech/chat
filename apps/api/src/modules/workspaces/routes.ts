import {
  Router,
  type Request,
  type Response,
  type NextFunction,
  type Router as RouterType,
} from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateUuidParam } from "../../middleware/validate-uuid.js";
import { requireWorkspaceMembership } from "../../middleware/require-membership.js";
import { workspaceService } from "./service.js";
import { channelService } from "../channels/service.js";
import { logAuditEvent } from "../../services/audit.js";
import type { Workspace } from "@chat/db";
import { logger } from "../../lib/logger.js";
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  addWorkspaceMemberSchema,
  updateWorkspaceMemberSchema,
} from "../../config/validators.js";
import { responseCache } from "../../middleware/cache.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { BadRequestError, NotFoundError, ForbiddenError, InternalServerError } from "../../lib/app-error.js";

const router: RouterType = Router();
router.use(authenticate);

router.get("/", responseCache(30), asyncHandler(async (req, res) => {
  logger.info("GET /v1/workspaces", { userId: req.userId });
  const workspaces = await workspaceService.listByUser(req.supabase);
  logger.info("Workspaces list result", { userId: req.userId, count: workspaces.length });
  res.json({ workspaces });
}));

// Consolidated bootstrap endpoint: returns workspaces with their channels in one call
router.get("/bootstrap", responseCache(30), asyncHandler(async (req, res) => {
  const workspaces = await workspaceService.listByUser(req.supabase);
  const workspaceChannels = await Promise.all(
    workspaces.map(async (ws) => {
      const channels = await channelService.listByWorkspace(ws.id);
      return { workspace: ws, channels };
    }),
  );
  res.json({ workspaces: workspaceChannels });
}));

router.post("/", asyncHandler(async (req, res) => {
  const parsed = createWorkspaceSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new BadRequestError(parsed.error.issues[0].message);
  }

  const workspace = await workspaceService.create({
    name: parsed.data.name,
    owner_id: req.userId!,
  });
  if (!workspace) {
    throw new InternalServerError("Could not create workspace. Check server logs for details.");
  }

  res.status(201).json({ workspace });
  logAuditEvent({
    actorUserId: req.userId,
    action: "workspace.create",
    entityType: "workspace",
    entityId: workspace.id,
    metadata: { name: workspace.name },
  });
}));

router.get("/:id", validateUuidParam("id"), requireWorkspaceMembership("id"), responseCache(30), asyncHandler(async (req, res) => {
  const workspace = await workspaceService.getById(req.params.id as string, req.supabase);
  if (!workspace) {
    throw new NotFoundError("Workspace not found");
  }
  res.json({ workspace });
}));

router.patch(
  "/:id",
  validateUuidParam("id"),
  requireWorkspaceMembership("id"),
  asyncHandler(async (req, res) => {
    const parsed = updateWorkspaceSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.issues[0].message);
    }

    const workspace = await workspaceService.update(
      req.params.id as string,
      parsed.data,
      req.supabase,
    );
    if (!workspace) {
      throw new NotFoundError("Workspace not found");
    }

    const updatedWorkspace: Workspace = workspace;
    res.json({ workspace: updatedWorkspace });
    logAuditEvent({
      actorUserId: req.userId,
      action: "workspace.update",
      entityType: "workspace",
      entityId: updatedWorkspace.id,
      metadata: { name: updatedWorkspace.name },
    });
  }),
);

router.get(
  "/:id/members",
  validateUuidParam("id"),
  requireWorkspaceMembership("id"),
  responseCache(30),
  asyncHandler(async (req, res) => {
    const members = await workspaceService.getMembers(req.params.id as string, req.supabase);
    res.json({ members });
  }),
);

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const role = (req as unknown as { workspaceRole?: string }).workspaceRole;
  if (role !== "owner" && role !== "admin") {
    res.status(403).json({ error: { code: "FORBIDDEN", message: "Admin role required" } });
    return;
  }
  next();
}

router.post(
  "/:id/members",
  validateUuidParam("id"),
  requireWorkspaceMembership("id"),
  requireAdmin,
  asyncHandler(async (req, res) => {
    const parsed = addWorkspaceMemberSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.issues[0].message);
    }

    const success = await workspaceService.addMember(
      req.params.id as string,
      parsed.data.user_id,
      parsed.data.role,
      req.supabase,
    );
    if (!success) {
      throw new InternalServerError("Could not add member");
    }

    logAuditEvent({
      actorUserId: req.userId,
      action: "workspace_member.add",
      entityType: "workspace_member",
      entityId: parsed.data.user_id,
      metadata: { workspace_id: req.params.id, role: parsed.data.role },
    });

    res.status(201).json({ success: true });
  }),
);

router.patch(
  "/:id/members/:userId",
  validateUuidParam("id"),
  validateUuidParam("userId"),
  requireWorkspaceMembership("id"),
  requireAdmin,
  asyncHandler(async (req, res) => {
    const parsed = updateWorkspaceMemberSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.issues[0].message);
    }

    const success = await workspaceService.updateMemberRole(
      req.params.id as string,
      req.params.userId as string,
      parsed.data.role,
      req.supabase,
    );
    if (!success) {
      throw new NotFoundError("Member not found");
    }

    logAuditEvent({
      actorUserId: req.userId,
      action: "workspace_member.role_change",
      entityType: "workspace_member",
      entityId: req.params.userId as string,
      metadata: { workspace_id: req.params.id, role: parsed.data.role },
    });

    res.json({ success: true });
  }),
);

router.delete(
  "/:id/members/:userId",
  validateUuidParam("id"),
  validateUuidParam("userId"),
  requireWorkspaceMembership("id"),
  requireAdmin,
  asyncHandler(async (req, res) => {
    const success = await workspaceService.removeMember(
      req.params.id as string,
      req.params.userId as string,
      req.supabase,
    );
    if (!success) {
      throw new NotFoundError("Member not found");
    }

    logAuditEvent({
      actorUserId: req.userId,
      action: "workspace_member.remove",
      entityType: "workspace_member",
      entityId: req.params.userId as string,
      metadata: { workspace_id: req.params.id },
    });

    res.status(204).send();
  }),
);

router.delete(
  "/:id",
  validateUuidParam("id"),
  requireWorkspaceMembership("id"),
  asyncHandler(async (req, res) => {
    const deleted = await workspaceService.remove(req.params.id as string, req.supabase);
    if (!deleted) {
      throw new NotFoundError("Workspace not found");
    }
    logAuditEvent({
      actorUserId: req.userId,
      action: "workspace.delete",
      entityType: "workspace",
      entityId: req.params.id as string,
    });
    res.status(204).send();
  }),
);

export default router;
