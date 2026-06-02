import { NextFunction, Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as authService from "../services/auth.service";

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await authService.login(req.body.username, req.body.password)); } catch (error) { next(error); }
};
export const me = (req: AuthRequest, res: Response) => { res.json(req.user); };
