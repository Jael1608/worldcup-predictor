import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { AppError } from "../middlewares/error.middleware";
import { hasDefinedTeams } from "./matches.service";
import { requiresPenaltyPrediction } from "./scoring.service";

const score = (value: unknown, field: string) => {
  if (!Number.isInteger(value) || Number(value) < 0) throw new AppError(400, `${field} debe ser un entero mayor o igual a cero`);
  return Number(value);
};

export const createPrediction = async (userId: number, body: Record<string, unknown>) => {
  const matchId = Number(body.matchId);
  if (!Number.isInteger(matchId)) throw new AppError(400, "Partido inválido");
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) throw new AppError(404, "Partido no encontrado");
  if (match.status !== "SCHEDULED" || match.matchDate <= new Date()) throw new AppError(400, "El partido ya comenzó o no admite predicciones");
  if (!hasDefinedTeams(match.homeTeam, match.awayTeam)) throw new AppError(400, "Los participantes de este partido todavía no están definidos");
  const predictedPenaltyWinner = typeof body.predictedPenaltyWinner === "string" ? body.predictedPenaltyWinner.trim() : "";
  if (requiresPenaltyPrediction(match.stage) && ![match.homeTeam, match.awayTeam].includes(predictedPenaltyWinner)) throw new AppError(400, "Debes elegir quién pasa en caso de penales");
  try {
    return await prisma.prediction.create({
      data: {
        userId,
        matchId,
        predictedHome: score(body.predictedHome, "Goles local"),
        predictedAway: score(body.predictedAway, "Goles visitante"),
        predictedPenaltyWinner: requiresPenaltyPrediction(match.stage) ? predictedPenaltyWinner : null
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new AppError(409, "Ya guardaste una predicción para este partido");
    throw error;
  }
};

export const getMyPredictions = (userId: number) => prisma.prediction.findMany({ where: { userId }, include: { match: true }, orderBy: { match: { matchDate: "asc" } } });

export const getMatchPredictions = async (matchId: number) => {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) throw new AppError(404, "Partido no encontrado");
  return prisma.prediction.findMany({ where: { matchId }, include: { user: { select: { id: true, name: true, username: true } } }, orderBy: { user: { name: "asc" } } });
};
