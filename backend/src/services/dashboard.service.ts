import { prisma } from "../prisma";
import { hasDefinedTeams } from "./matches.service";
import { MatchStage, matchStages } from "../types/domain";
import { AppError } from "../middlewares/error.middleware";
import { CHAMPION_BONUS_POINTS, getOfficialChampion } from "./champion.service";

export type Standing = {
  userId: number; name: string; username: string; totalPoints: number;
  exactScores: number; winnerHits: number; predictionsCount: number; championBonus: number;
};

export const getStandings = async (stage?: string): Promise<Standing[]> => {
  if (stage && !matchStages.includes(stage as MatchStage)) throw new AppError(400, "Fase inválida");
  const [users, officialChampion] = await Promise.all([prisma.user.findMany({
    where: { role: "PLAYER" },
    include: { predictions: stage ? { where: { match: { stage } } } : true, championPrediction: true }
  }), getOfficialChampion()]);
  return users.map((user) => ({
    userId: user.id,
    name: user.name,
    username: user.username,
    totalPoints: user.predictions.reduce((total, prediction) => total + prediction.points, 0) + (!stage && user.championPrediction?.team === officialChampion.team ? CHAMPION_BONUS_POINTS : 0),
    exactScores: user.predictions.filter((prediction) => prediction.points === 3).length,
    winnerHits: user.predictions.filter((prediction) => prediction.points === 1).length,
    predictionsCount: user.predictions.length,
    championBonus: !stage && user.championPrediction?.team === officialChampion.team ? CHAMPION_BONUS_POINTS : 0
  })).sort((a, b) => b.totalPoints - a.totalPoints || b.exactScores - a.exactScores || b.winnerHits - a.winnerHits || a.name.localeCompare(b.name));
};

export const getMySummary = async (userId: number) => {
  const standings = await getStandings();
  const me = standings.find((standing) => standing.userId === userId) ?? { userId, name: "", username: "", totalPoints: 0, exactScores: 0, winnerHits: 0, predictionsCount: 0, championBonus: 0 };
  const pending = await prisma.match.findMany({ where: { status: "SCHEDULED", matchDate: { gt: new Date() }, predictions: { none: { userId } } }, select: { homeTeam: true, awayTeam: true } });
  const pendingMatches = pending.filter((match) => hasDefinedTeams(match.homeTeam, match.awayTeam)).length;
  const evaluated = await prisma.prediction.findMany({
    where: { userId, match: { status: "FINISHED" } },
    include: { match: { select: { matchDate: true } } }
  });
  const hits = evaluated.filter((prediction) => prediction.points > 0).length;
  const dailyPoints = evaluated.reduce<Record<string, number>>((days, prediction) => {
    const day = prediction.match.matchDate.toISOString().slice(0, 10);
    days[day] = (days[day] ?? 0) + prediction.points;
    return days;
  }, {});
  const bestDay = Object.entries(dailyPoints).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  return {
    totalPoints: me.totalPoints,
    position: Math.max(standings.findIndex((standing) => standing.userId === userId) + 1, 0),
    predictionsCount: me.predictionsCount,
    exactScores: me.exactScores,
    winnerHits: me.winnerHits,
    championBonus: me.championBonus,
    pendingMatches,
    accuracyPercentage: evaluated.length ? Math.round((hits / evaluated.length) * 100) : 0,
    evaluatedPredictions: evaluated.length,
    bestDay: bestDay ? { date: bestDay[0], points: bestDay[1] } : null
  };
};

export const getHistory = () => prisma.match.findMany({
  include: { predictions: { include: { user: { select: { id: true, name: true, username: true } } }, orderBy: { user: { name: "asc" } } } },
  orderBy: { matchDate: "asc" }
});
