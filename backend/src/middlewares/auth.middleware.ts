import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";

export function requireAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const auth = getAuth(req);

  if (!auth.userId) {
    return res.status(401).json({
      error: "Unauthorized",
      code: "AUTH_REQUIRED",
    });
  }

  next();
}