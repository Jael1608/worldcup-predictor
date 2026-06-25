import { NextFunction, Response } from "express";
import { AuthRequest } from "./auth.middleware";
import { AppError } from "./error.middleware";
import { isAdministrator } from "../utils/authorization";

export const adminMiddleware = (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (!isAdministrator(req.user)) return next(new AppError(403, "Acceso exclusivo para administradores"));
  next();
};
