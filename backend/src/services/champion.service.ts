import { Prisma } from "@prisma/client";
import { AppError } from "../middlewares/error.middleware";
import { prisma } from "../prisma";
import { officialFixtures } from "../data/official-fixtures";

export const tournamentTeams = [...new Set(
  officialFixtures
    .filter((match) => match.stage === "GROUP")
    .flatMap((match) => [match.homeTeam, match.awayTeam])
)].sort((a, b) => a.localeCompare(b));
export const CHAMPION_BONUS_POINTS = 15;
const officialChampionKey = "officialChampion";

const getTournamentStart = async () => {
  const openingMatch = await prisma.match.findFirst({ orderBy: { matchDate: "asc" }, select: { matchDate: true } });
  if (!openingMatch) throw new AppError(400, "Todavía no hay partidos cargados");
  return openingMatch.matchDate;
};

export const getChampionPrediction = async (userId: number) => {
  const closesAt = await getTournamentStart();
  const prediction = await prisma.championPrediction.findUnique({ where: { userId } });
  return {
    prediction,
    teams: tournamentTeams,
    closesAt,
    canPredict: !prediction && closesAt > new Date()
  };
};

export const createChampionPrediction = async (userId: number, team: unknown) => {
  if (typeof team !== "string" || !tournamentTeams.includes(team)) throw new AppError(400, "Selección inválida");
  if (await getTournamentStart() <= new Date()) throw new AppError(400, "La predicción del campeón ya cerró");
  try {
    return await prisma.championPrediction.create({ data: { userId, team } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new AppError(409, "Ya guardaste tu predicción del campeón");
    throw error;
  }
};

export const getOfficialChampion = async () => {
  const config = await prisma.systemConfig.findUnique({ where: { key: officialChampionKey } });
  return { team: config?.value ?? null, bonusPoints: CHAMPION_BONUS_POINTS, teams: tournamentTeams };
};

export const saveOfficialChampion = async (team: unknown) => {
  if (typeof team !== "string" || !tournamentTeams.includes(team)) throw new AppError(400, "Selección inválida");
  await prisma.systemConfig.upsert({
    where: { key: officialChampionKey },
    create: { key: officialChampionKey, value: team },
    update: { value: team }
  });
  return getOfficialChampion();
};

export const clearOfficialChampion = async () => {
  await prisma.systemConfig.deleteMany({ where: { key: officialChampionKey } });
  return getOfficialChampion();
};
