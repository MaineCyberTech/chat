import type { Request, Response, NextFunction } from "express";
import { hasPermission, type Permission } from "@chat/db";
import type { WorkspaceRole } from "@chat/db";

export {};

declare module "express" {
  interface Request {
    workspaceRole?: WorkspaceRole;
  }
}

export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const role = req.workspaceRole;

    if (!role) {
      res.status(403).json({
        error: { code: "FORBIDDEN", message: "No workspace role found" },
      });
      return;
    }

    if (!hasPermission(role, permission)) {
      res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: `Missing required permission: ${permission}`,
        },
      });
      return;
    }

    next();
  };
}
