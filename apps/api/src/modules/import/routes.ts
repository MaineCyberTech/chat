import { Router, type Request, type Response } from "express";
import { getSupabaseAdmin } from "../../lib/supabase.js";
import { authenticate } from "../../middleware/authenticate.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { parseCsv } from "../../lib/csv.js";
import { requireAdmin } from "../../middleware/require-admin.js";
import { BadRequestError } from "../../lib/app-error.js";

const router = Router();

function getCsvBody(req: Request): string {
  if (typeof req.body === "string") return req.body;
  if (req.body && typeof req.body.csv === "string") return req.body.csv;
  throw new BadRequestError("Request body must be raw CSV (text/csv) or JSON with a 'csv' field");
}

router.post("/admin/import/workspaces", authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const csv = getCsvBody(req);
  const { data: rows, errors } = parseCsv<{ name: string; slug: string }>(csv);

  if (rows.length === 0 && errors.length === 0) {
    throw new BadRequestError("CSV must contain a header row and at least one data row");
  }

  const admin = getSupabaseAdmin();
  let imported = 0;

  for (const row of rows) {
    if (!row.name || !row.slug) {
      errors.push(`Row ${imported + 1}: missing required columns (name, slug)`);
      continue;
    }
    const { error } = await admin.from("workspaces").insert({ name: row.name, slug: row.slug });
    if (error) {
      errors.push(`Row ${imported + 1}: ${error.message}`);
    } else {
      imported++;
    }
  }

  res.json({ imported, errors: errors.length > 0 ? errors : undefined });
}));

router.post("/admin/import/users", authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const csv = getCsvBody(req);
  const { data: rows, errors } = parseCsv<{ email: string; display_name: string }>(csv);

  if (rows.length === 0 && errors.length === 0) {
    throw new BadRequestError("CSV must contain a header row and at least one data row");
  }

  const admin = getSupabaseAdmin();
  let imported = 0;

  for (const row of rows) {
    if (!row.email) {
      errors.push(`Row ${imported + 1}: missing required column (email)`);
      continue;
    }
    const { error } = await admin.from("users").insert({
      email: row.email,
      display_name: row.display_name || row.email.split("@")[0],
    });
    if (error) {
      errors.push(`Row ${imported + 1}: ${error.message}`);
    } else {
      imported++;
    }
  }

  res.json({ imported, errors: errors.length > 0 ? errors : undefined });
}));

export default router;
