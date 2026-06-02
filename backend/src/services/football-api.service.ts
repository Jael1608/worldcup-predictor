import { prisma } from "../prisma";
import { AppError } from "../middlewares/error.middleware";
import { fetchOpenFootballMatches } from "../providers/openfootball.provider";
import { ImportedMatch, parseManualMatches } from "../providers/manual.provider";

const saveImported = async (matches: ImportedMatch[], source: string) => {
  let created = 0;
  let updated = 0;
  for (const match of matches) {
    const data = { homeTeam: match.homeTeam.trim(), awayTeam: match.awayTeam.trim(), matchDate: new Date(match.matchDate), stage: match.stage, groupName: match.groupName?.trim() || null, venue: match.venue?.trim() || null, source };
    if (match.externalId) {
      const existing = await prisma.match.findUnique({ where: { externalId: match.externalId } });
      await prisma.match.upsert({ where: { externalId: match.externalId }, create: { ...data, externalId: match.externalId }, update: data });
      existing ? updated++ : created++;
    } else {
      await prisma.match.create({ data });
      created++;
    }
  }
  return { created, updated };
};

export const importManualMatches = (body: unknown) => saveImported(parseManualMatches(body), "manual-json");
export const importExternalMatches = async () => {
  try { return await saveImported(await fetchOpenFootballMatches(), "fifa-official-2026-04-10"); }
  catch { throw new AppError(503, "La fuente de partidos no está disponible. Usa la importación por JSON."); }
};
