import { NextFunction, Request, Response } from "express";
import { importExternalMatches, importManualMatches } from "../services/football-api.service";
import { recalculateAll } from "../services/matches.service";
import { clearOfficialChampion, getOfficialChampion, saveOfficialChampion } from "../services/champion.service";
import { applyExternalResults, previewExternalResults } from "../services/results-api.service";

export const importMatches = async (_req: Request, res: Response, next: NextFunction) => { try { res.json(await importExternalMatches()); } catch (e) { next(e); } };
export const importJson = async (req: Request, res: Response, next: NextFunction) => { try { res.json(await importManualMatches(req.body)); } catch (e) { next(e); } };
export const recalculate = async (_req: Request, res: Response, next: NextFunction) => { try { res.json(await recalculateAll()); } catch (e) { next(e); } };
export const officialChampion = async (_req: Request, res: Response, next: NextFunction) => { try { res.json(await getOfficialChampion()); } catch (e) { next(e); } };
export const saveChampion = async (req: Request, res: Response, next: NextFunction) => { try { res.json(await saveOfficialChampion(req.body.team)); } catch (e) { next(e); } };
export const clearChampion = async (_req: Request, res: Response, next: NextFunction) => { try { res.json(await clearOfficialChampion()); } catch (e) { next(e); } };
export const previewResults = async (_req: Request, res: Response, next: NextFunction) => { try { res.json(await previewExternalResults()); } catch (e) { next(e); } };
export const applyResults = async (req: Request, res: Response, next: NextFunction) => { try { res.json(await applyExternalResults(req.body.matchIds)); } catch (e) { next(e); } };
