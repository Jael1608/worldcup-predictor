import { NextFunction, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as service from "../services/dashboard.service";

export const standings = async (req: AuthRequest, res: Response, next: NextFunction) => { try { res.json(await service.getStandings(typeof req.query.stage === "string" ? req.query.stage : undefined)); } catch (e) { next(e); } };
export const summary = async (req: AuthRequest, res: Response, next: NextFunction) => { try { res.json(await service.getMySummary(req.user!.id)); } catch (e) { next(e); } };
export const history = async (_req: AuthRequest, res: Response, next: NextFunction) => { try { res.json(await service.getHistory()); } catch (e) { next(e); } };
export const rankingHistory = async (_req: AuthRequest, res: Response, next: NextFunction) => { try { res.json(await service.getRankingHistory()); } catch (e) { next(e); } };
