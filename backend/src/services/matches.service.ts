import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { AppError } from "../middlewares/error.middleware";
import { calculatePoints } from "./scoring.service";
import { MatchStage, MatchStatus, matchStages, matchStatuses } from "../types/domain";

const stages: readonly string[] = matchStages;
const statuses: readonly string[] = matchStatuses;
const nonNegativeInteger = (value: unknown, field: string) => {
  if (!Number.isInteger(value) || Number(value) < 0) throw new AppError(400, `${field} debe ser un entero mayor o igual a cero`);
  return Number(value);
};
const requiredString = (value: unknown, field: string) => {
  if (typeof value !== "string" || !value.trim()) throw new AppError(400, `${field} es obligatorio`);
  return value.trim();
};
const optionalString = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : null;
const stageOf = (value: unknown) => {
  if (!stages.includes(value as MatchStage)) throw new AppError(400, "Fase inválida");
  return value as MatchStage;
};
const statusOf = (value: unknown) => {
  if (!statuses.includes(value as MatchStatus)) throw new AppError(400, "Estado inválido");
  return value as MatchStatus;
};
const dateOf = (value: unknown) => {
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) throw new AppError(400, "Fecha inválida");
  return date;
};
export const hasDefinedTeams = (homeTeam: string, awayTeam: string) => ![homeTeam, awayTeam].some((team) => /^(Primero|Segundo|Mejor tercero|Ganador|Perdedor) /.test(team));

export const listMatches = async (userId: number) => {
  const matches = await prisma.match.findMany({ include: { predictions: { where: { userId } } }, orderBy: { matchDate: "asc" } });
  return matches.map(({ predictions, ...match }) => ({
    ...match,
    myPrediction: predictions[0] ?? null,
    canPredict: predictions.length === 0 && match.status === "SCHEDULED" && match.matchDate > new Date() && hasDefinedTeams(match.homeTeam, match.awayTeam)
  }));
};

export const getMatch = async (id: number, userId: number) => {
  const match = await prisma.match.findUnique({ where: { id }, include: { predictions: { where: { userId } } } });
  if (!match) throw new AppError(404, "Partido no encontrado");
  const { predictions, ...rest } = match;
  return { ...rest, myPrediction: predictions[0] ?? null, canPredict: predictions.length === 0 && match.status === "SCHEDULED" && match.matchDate > new Date() && hasDefinedTeams(match.homeTeam, match.awayTeam) };
};

export const createMatch = (body: Record<string, unknown>) => prisma.match.create({
  data: {
    homeTeam: requiredString(body.homeTeam, "Equipo local"),
    awayTeam: requiredString(body.awayTeam, "Equipo visitante"),
    matchDate: dateOf(body.matchDate),
    stage: stageOf(body.stage),
    groupName: optionalString(body.groupName),
    venue: optionalString(body.venue),
    externalId: optionalString(body.externalId),
    source: optionalString(body.source) ?? "manual",
    status: body.status ? statusOf(body.status) : "SCHEDULED"
  }
});

export const updateMatch = async (id: number, body: Record<string, unknown>) => {
  const data: Prisma.MatchUpdateInput = {};
  if (body.homeTeam !== undefined) data.homeTeam = requiredString(body.homeTeam, "Equipo local");
  if (body.awayTeam !== undefined) data.awayTeam = requiredString(body.awayTeam, "Equipo visitante");
  if (body.matchDate !== undefined) data.matchDate = dateOf(body.matchDate);
  if (body.stage !== undefined) data.stage = stageOf(body.stage);
  if (body.groupName !== undefined) data.groupName = optionalString(body.groupName);
  if (body.venue !== undefined) data.venue = optionalString(body.venue);
  if (body.status !== undefined) data.status = statusOf(body.status);
  try { return await prisma.match.update({ where: { id }, data }); }
  catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") throw new AppError(404, "Partido no encontrado");
    throw error;
  }
};

export const saveResult = async (id: number, body: Record<string, unknown>) => {
  const homeScore = nonNegativeInteger(body.homeScore, "Goles local");
  const awayScore = nonNegativeInteger(body.awayScore, "Goles visitante");
  return prisma.$transaction(async (tx) => {
    const match = await tx.match.update({ where: { id }, data: { homeScore, awayScore, status: "FINISHED" } }).catch(() => { throw new AppError(404, "Partido no encontrado"); });
    const predictions = await tx.prediction.findMany({ where: { matchId: id } });
    await Promise.all(predictions.map((prediction) => tx.prediction.update({
      where: { id: prediction.id },
      data: { points: calculatePoints(prediction.predictedHome, prediction.predictedAway, homeScore, awayScore) }
    })));
    return match;
  });
};

export const deleteMatch = async (id: number) => {
  try { await prisma.match.delete({ where: { id } }); }
  catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") throw new AppError(404, "Partido no encontrado");
    throw error;
  }
};

export const recalculateAll = async () => {
  const matches = await prisma.match.findMany({ where: { status: "FINISHED", homeScore: { not: null }, awayScore: { not: null } }, include: { predictions: true } });
  let updated = 0;
  await prisma.$transaction(async (tx) => {
    for (const match of matches) {
      for (const prediction of match.predictions) {
        await tx.prediction.update({ where: { id: prediction.id }, data: { points: calculatePoints(prediction.predictedHome, prediction.predictedAway, match.homeScore!, match.awayScore!) } });
        updated++;
      }
    }
  });
  return { updated };
};
