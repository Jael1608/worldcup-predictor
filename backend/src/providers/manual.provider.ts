import { AppError } from "../middlewares/error.middleware";
import { MatchStage, matchStages } from "../types/domain";

export type ImportedMatch = {
  externalId?: string; homeTeam: string; awayTeam: string; matchDate: string;
  stage: MatchStage; groupName?: string; venue?: string;
};

export const parseManualMatches = (body: unknown): ImportedMatch[] => {
  const matches = (body as { matches?: unknown })?.matches;
  if (!Array.isArray(matches)) throw new AppError(400, "Debes enviar un arreglo matches");
  return matches.map((item, index) => {
    const match = item as Record<string, unknown>;
    if (typeof match.homeTeam !== "string" || !match.homeTeam.trim() || typeof match.awayTeam !== "string" || !match.awayTeam.trim() || match.homeTeam.trim().localeCompare(match.awayTeam.trim(), undefined, { sensitivity: "accent" }) === 0 || Number.isNaN(new Date(String(match.matchDate)).getTime()) || !matchStages.includes(match.stage as MatchStage)) {
      throw new AppError(400, `Partido inválido en posición ${index + 1}`);
    }
    return match as ImportedMatch;
  });
};
