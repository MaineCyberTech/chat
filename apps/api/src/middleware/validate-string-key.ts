import type { Request, Response, NextFunction } from "express";

const stringKeyRegex = /^[a-z][a-z0-9-]*$/;

export function validateStringKeyParam(paramName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req.params[paramName] as string;
    if (!value || !stringKeyRegex.test(value)) {
      res.status(400).json({
        error: {
          code: "INVALID_PARAM",
          message: `Invalid ${paramName}: must be a lowercase alphanumeric string with hyphens`,
        },
      });
      return;
    }
    next();
  };
}
