import { NextFunction, Request, Response } from "express";
import { importExternalMatches, importManualMatches } from "../services/football-api.service";
import { recalculateAll } from "../services/matches.service";

export const importMatches = async (_req: Request, res: Response, next: NextFunction) => { try { res.json(await importExternalMatches()); } catch (e) { next(e); } };
export const importJson = async (req: Request, res: Response, next: NextFunction) => { try { res.json(await importManualMatches(req.body)); } catch (e) { next(e); } };
export const recalculate = async (_req: Request, res: Response, next: NextFunction) => { try { res.json(await recalculateAll()); } catch (e) { next(e); } };
