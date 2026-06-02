import { NextFunction, Response } from "express";
import { AuthRequest } from "./auth.middleware";
import { AppError } from "./error.middleware";

export const adminMiddleware = (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (req.user?.role !== "ADMIN") return next(new AppError(403, "Acceso exclusivo para administradores"));
  next();
};
