import type { Request, Response, NextFunction } from "express";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateUuidParam(paramName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req.params[paramName] as string;
    if (!value || !uuidRegex.test(value)) {
      res.status(400).json({
        error: { code: "INVALID_PARAM", message: `Invalid ${paramName}: must be a valid UUID` },
      });
      return;
    }
    next();
  };
}
