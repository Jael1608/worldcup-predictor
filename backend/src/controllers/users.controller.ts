import { NextFunction, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { AppError } from "../middlewares/error.middleware";
import * as service from "../services/users.service";

const idOf = (value: unknown) => {
  const id = Number(value);
  if (!Number.isInteger(id)) throw new AppError(400, "Identificador inválido");
  return id;
};
export const list = async (_req: AuthRequest, res: Response, next: NextFunction) => { try { res.json(await service.listUsers()); } catch (e) { next(e); } };
export const create = async (req: AuthRequest, res: Response, next: NextFunction) => { try { res.status(201).json(await service.createUser(req.body)); } catch (e) { next(e); } };
export const update = async (req: AuthRequest, res: Response, next: NextFunction) => { try { res.json(await service.updateUser(idOf(req.params.id), req.body)); } catch (e) { next(e); } };
export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => { try { await service.deleteUser(idOf(req.params.id), req.user!.id); res.status(204).send(); } catch (e) { next(e); } };
