import { NextFunction, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { AppError } from "../middlewares/error.middleware";
import * as service from "../services/matches.service";

const idOf = (value: unknown) => {
  const id = Number(value);
  if (!Number.isInteger(id)) throw new AppError(400, "Identificador inválido");
  return id;
};
export const list = async (req: AuthRequest, res: Response, next: NextFunction) => { try { res.json(await service.listMatches(req.user!.id)); } catch (e) { next(e); } };
export const get = async (req: AuthRequest, res: Response, next: NextFunction) => { try { res.json(await service.getMatch(idOf(req.params.id), req.user!.id)); } catch (e) { next(e); } };
export const create = async (req: AuthRequest, res: Response, next: NextFunction) => { try { res.status(201).json(await service.createMatch(req.body)); } catch (e) { next(e); } };
export const update = async (req: AuthRequest, res: Response, next: NextFunction) => { try { res.json(await service.updateMatch(idOf(req.params.id), req.body)); } catch (e) { next(e); } };
export const result = async (req: AuthRequest, res: Response, next: NextFunction) => { try { res.json(await service.saveResult(idOf(req.params.id), req.body)); } catch (e) { next(e); } };
export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => { try { await service.deleteMatch(idOf(req.params.id)); res.status(204).send(); } catch (e) { next(e); } };
