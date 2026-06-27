import { prisma } from "../prisma";
import { AppError } from "../middlewares/error.middleware";
import { fetchOpenFootballMatches } from "../providers/openfootball.provider";
import { ImportedMatch, parseManualMatches } from "../providers/manual.provider";

const isPlaceholderTeam = (team: string) => /^(Primero|Segundo|Mejor tercero|Ganador|Perdedor) /.test(team);

const saveImported = async (matches: ImportedMatch[], source: string) => {
  let created = 0;
  let updated = 0;
  for (const match of matches) {
    const data = { homeTeam: match.homeTeam.trim(), awayTeam: match.awayTeam.trim(), matchDate: new Date(match.matchDate), stage: match.stage, groupName: match.groupName?.trim() || null, venue: match.venue?.trim() || null, source };
    if (match.externalId) {
      const existing = await prisma.match.findUnique({ where: { externalId: match.externalId } });
      const keepResolvedKnockoutTeams = source === "fifa-official-2026-04-10" && existing?.stage !== "GROUP";
      const update = keepResolvedKnockoutTeams ? {
        ...data,
        homeTeam: existing && !isPlaceholderTeam(existing.homeTeam) ? existing.homeTeam : data.homeTeam,
        awayTeam: existing && !isPlaceholderTeam(existing.awayTeam) ? existing.awayTeam : data.awayTeam
      } : data;
      await prisma.match.upsert({ where: { externalId: match.externalId }, create: { ...data, externalId: match.externalId }, update });
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
