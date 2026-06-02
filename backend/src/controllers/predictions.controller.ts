import { NextFunction, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { AppError } from "../middlewares/error.middleware";
import * as service from "../services/predictions.service";
import * as championService from "../services/champion.service";

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => { try { res.status(201).json(await service.createPrediction(req.user!.id, req.body)); } catch (e) { next(e); } };
export const mine = async (req: AuthRequest, res: Response, next: NextFunction) => { try { res.json(await service.getMyPredictions(req.user!.id)); } catch (e) { next(e); } };
export const byMatch = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.matchId);
    if (!Number.isInteger(id)) throw new AppError(400, "Partido inválido");
    res.json(await service.getMatchPredictions(id));
  } catch (e) { next(e); }
};
export const champion = async (req: AuthRequest, res: Response, next: NextFunction) => { try { res.json(await championService.getChampionPrediction(req.user!.id)); } catch (e) { next(e); } };
export const createChampion = async (req: AuthRequest, res: Response, next: NextFunction) => { try { res.status(201).json(await championService.createChampionPrediction(req.user!.id, req.body.team)); } catch (e) { next(e); } };
