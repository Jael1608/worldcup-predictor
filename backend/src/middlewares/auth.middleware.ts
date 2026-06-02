import { NextFunction, Request, Response } from "express";
import { prisma } from "../prisma";
import { Role } from "../types/domain";
import { verifyToken } from "../utils/jwt";
import { AppError } from "./error.middleware";

export type AuthUser = { id: number; name: string; username: string; role: Role };
export interface AuthRequest extends Request { user?: AuthUser }

export const authMiddleware = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token) throw new AppError(401, "Debes iniciar sesión");
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, username: true, role: true }
    });
    if (!user) throw new AppError(401, "Sesión inválida");
    req.user = { ...user, role: user.role as Role };
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError(401, "Token inválido"));
  }
};
