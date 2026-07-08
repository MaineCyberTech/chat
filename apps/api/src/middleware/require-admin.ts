import type { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "../lib/app-error.js";

export async function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  try {
    const supabase = req.supabase;
    if (!supabase) {
      next(new ForbiddenError("Auth context missing"));
      return;
    }
    const { data, error } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("user_id", req.userId)
      .in("role", ["owner", "admin"])
      .limit(1);
    if (error || !data || data.length === 0) {
      next(new ForbiddenError("Admin access required"));
      return;
    }
    next();
  } catch (err) {
    next(new ForbiddenError("Admin access check failed"));
  }
}
