import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { AppError } from "../middlewares/error.middleware";
import { calculatePoints } from "./scoring.service";
import { MatchStage, MatchStatus, matchStages, matchStatuses } from "../types/domain";
import { syncKnockoutBracket } from "./bracket.service";

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
const ensureDifferentTeams = (homeTeam: string, awayTeam: string) => {
  if (homeTeam.localeCompare(awayTeam, undefined, { sensitivity: "accent" }) === 0) throw new AppError(400, "Los equipos deben ser diferentes");
};
export const hasDefinedTeams = (homeTeam: string, awayTeam: string) => ![homeTeam, awayTeam].some((team) => /^(Primero|Segundo|Mejor tercero|Ganador|Perdedor) /.test(team));
const knockoutStages = new Set<MatchStage>(["ROUND_OF_32", "ROUND_OF_16", "QUARTER_FINAL", "SEMI_FINAL", "THIRD_PLACE", "FINAL"]);

const predictionDistribution = (predictions: Array<{ predictedHome: number; predictedAway: number }>) => {
  const total = predictions.length;
  const home = predictions.filter((prediction) => prediction.predictedHome > prediction.predictedAway).length;
  const draw = predictions.filter((prediction) => prediction.predictedHome === prediction.predictedAway).length;
  const away = total - home - draw;
  const percentage = (value: number) => total ? Math.round((value / total) * 100) : 0;
  return {
    total,
    home: { count: home, percentage: percentage(home) },
    draw: { count: draw, percentage: percentage(draw) },
    away: { count: away, percentage: percentage(away) }
  };
};

export const listMatches = async (userId: number) => {
  const matches = await prisma.match.findMany({ include: { predictions: true }, orderBy: { matchDate: "asc" } });
  const now = new Date();
  return matches.map(({ predictions, ...match }) => {
    const hasStarted = match.matchDate <= now;
    return {
      ...match,
      myPrediction: predictions.find((prediction) => prediction.userId === userId) ?? null,
      predictionDistribution: hasStarted ? predictionDistribution(predictions) : null,
      distributionHidden: !hasStarted,
      canPredict: !predictions.some((prediction) => prediction.userId === userId) && match.status === "SCHEDULED" && match.matchDate > now && hasDefinedTeams(match.homeTeam, match.awayTeam)
    };
  });
};

export const getMatch = async (id: number, userId: number) => {
  const match = await prisma.match.findUnique({ where: { id }, include: { predictions: true } });
  if (!match) throw new AppError(404, "Partido no encontrado");
  const { predictions, ...rest } = match;
  const hasStarted = match.matchDate <= new Date();
  return {
    ...rest,
    myPrediction: predictions.find((prediction) => prediction.userId === userId) ?? null,
    predictionDistribution: hasStarted ? predictionDistribution(predictions) : null,
    distributionHidden: !hasStarted,
    canPredict: !predictions.some((prediction) => prediction.userId === userId) && match.status === "SCHEDULED" && match.matchDate > new Date() && hasDefinedTeams(match.homeTeam, match.awayTeam)
  };
};

export const createMatch = async (body: Record<string, unknown>) => {
  const homeTeam = requiredString(body.homeTeam, "Equipo local");
  const awayTeam = requiredString(body.awayTeam, "Equipo visitante");
  ensureDifferentTeams(homeTeam, awayTeam);
  try { return await prisma.match.create({ data: {
    homeTeam,
    awayTeam,
    matchDate: dateOf(body.matchDate),
    stage: stageOf(body.stage),
    groupName: optionalString(body.groupName),
    venue: optionalString(body.venue),
    externalId: optionalString(body.externalId),
    source: optionalString(body.source) ?? "manual",
    status: body.status ? statusOf(body.status) : "SCHEDULED"
  } }); } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new AppError(409, "Ya existe un partido con ese identificador externo");
    throw error;
  }
};

export const updateMatch = async (id: number, body: Record<string, unknown>) => {
  const current = await prisma.match.findUnique({ where: { id } });
  if (!current) throw new AppError(404, "Partido no encontrado");
  const data: Prisma.MatchUpdateInput = {};
  if (body.homeTeam !== undefined) data.homeTeam = requiredString(body.homeTeam, "Equipo local");
  if (body.awayTeam !== undefined) data.awayTeam = requiredString(body.awayTeam, "Equipo visitante");
  if (body.matchDate !== undefined) data.matchDate = dateOf(body.matchDate);
  if (body.stage !== undefined) data.stage = stageOf(body.stage);
  if (body.groupName !== undefined) data.groupName = optionalString(body.groupName);
  if (body.venue !== undefined) data.venue = optionalString(body.venue);
  if (body.status !== undefined) {
    const status = statusOf(body.status);
    if (status === "FINISHED") throw new AppError(400, "Usa la carga de resultado oficial para finalizar un partido");
    data.status = status;
  }
  ensureDifferentTeams((data.homeTeam as string | undefined) ?? current.homeTeam, (data.awayTeam as string | undefined) ?? current.awayTeam);
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
    const current = await tx.match.findUnique({ where: { id } });
    if (!current) throw new AppError(404, "Partido no encontrado");

    let winnerTeam: string | null = null;
    if (homeScore > awayScore) winnerTeam = current.homeTeam;
    else if (awayScore > homeScore) winnerTeam = current.awayTeam;
    else if (knockoutStages.has(current.stage as MatchStage)) {
      const requestedWinner = typeof body.winnerTeam === "string" ? body.winnerTeam.trim() : "";
      if (![current.homeTeam, current.awayTeam].includes(requestedWinner)) throw new AppError(400, "Indica qué equipo avanzó por penales");
      winnerTeam = requestedWinner;
    }

    let match;
    try { match = await tx.match.update({ where: { id }, data: { homeScore, awayScore, winnerTeam, status: "FINISHED" } }); }
    catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") throw new AppError(404, "Partido no encontrado");
      throw error;
    }
    const predictions = await tx.prediction.findMany({ where: { matchId: id } });
    await Promise.all(predictions.map((prediction) => tx.prediction.update({
      where: { id: prediction.id },
      data: { points: calculatePoints(prediction.predictedHome, prediction.predictedAway, homeScore, awayScore, match.stage, match.winnerTeam, prediction.predictedPenaltyWinner) }
    })));
    await syncKnockoutBracket(tx);
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
        await tx.prediction.update({ where: { id: prediction.id }, data: { points: calculatePoints(prediction.predictedHome, prediction.predictedAway, match.homeScore!, match.awayScore!, match.stage, match.winnerTeam, prediction.predictedPenaltyWinner) } });
        updated++;
      }
    }
  });
  return { updated };
};
