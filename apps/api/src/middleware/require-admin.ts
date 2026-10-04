import type { Request, Response, NextFunction } from "express";
import { BadRequestError, ForbiddenError } from "../lib/app-error.js";

export interface RequireAdminOptions {
  /**
   * When true, attach the caller's admin workspace ids to `req.adminWorkspaceIds`
   * (used by tenant-scoped admin routes). The role-only path keeps `.limit(1)`.
   */
  attachWorkspaceIds?: boolean;
}

export function requireAdmin(
  paramName: string | null = null,
  options: RequireAdminOptions = {},
) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const supabase = req.supabase;
      if (!supabase) {
        next(new ForbiddenError("Auth context missing"));
        return;
      }
      let workspaceId: string | undefined;
      if (paramName) {
        workspaceId = req.params[paramName] as string;
        if (!workspaceId) {
          next(new BadRequestError(`Missing ${paramName}`));
          return;
        }
      }
      const attachWorkspaceIds = options.attachWorkspaceIds === true;
      let query = supabase
        .from("workspace_members")
        .select("workspace_id, role")
        .eq("user_id", req.userId)
        .in("role", ["owner", "admin"]);
      if (paramName && workspaceId) {
        query = query.eq("workspace_id", workspaceId);
      }
      if (!attachWorkspaceIds) {
        query = query.limit(1);
      }
      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        next(new ForbiddenError("Admin access required"));
        return;
      }
      if (attachWorkspaceIds) {
        (req as Request & { adminWorkspaceIds?: string[] }).adminWorkspaceIds = (
          data as unknown as Array<{ workspace_id: string }>
        ).map((m) => m.workspace_id);
      }
      next();
    } catch {
      next(new ForbiddenError("Admin access check failed"));
    }
  };
}
