import type { Request, Response, NextFunction } from "express";
import { BadRequestError, ForbiddenError } from "../lib/app-error.js";

export function requireAdmin(paramName: string | null = null) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const supabase = req.supabase;
      if (!supabase) {
        next(new ForbiddenError("Auth context missing"));
        return;
      }
      let query = supabase
        .from("workspace_members")
        .select("role")
        .eq("user_id", req.userId)
        .in("role", ["owner", "admin"])
        .limit(1);
      if (paramName) {
        const workspaceId = req.params[paramName];
        if (!workspaceId) {
          next(new BadRequestError(`Missing ${paramName}`));
          return;
        }
        query = query.eq("workspace_id", workspaceId);
      }
      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        next(new ForbiddenError("Admin access required"));
        return;
      }
      next();
    } catch {
      next(new ForbiddenError("Admin access check failed"));
    }
  };
}
