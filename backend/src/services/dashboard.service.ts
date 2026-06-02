import { prisma } from "../prisma";
import { hasDefinedTeams } from "./matches.service";

export type Standing = {
  userId: number; name: string; username: string; totalPoints: number;
  exactScores: number; winnerHits: number; predictionsCount: number;
};

export const getStandings = async (): Promise<Standing[]> => {
  const users = await prisma.user.findMany({ where: { role: "PLAYER" }, include: { predictions: true } });
  return users.map((user) => ({
    userId: user.id,
    name: user.name,
    username: user.username,
    totalPoints: user.predictions.reduce((total, prediction) => total + prediction.points, 0),
    exactScores: user.predictions.filter((prediction) => prediction.points === 3).length,
    winnerHits: user.predictions.filter((prediction) => prediction.points === 1).length,
    predictionsCount: user.predictions.length
  })).sort((a, b) => b.totalPoints - a.totalPoints || b.exactScores - a.exactScores || b.winnerHits - a.winnerHits || a.name.localeCompare(b.name));
};

export const getMySummary = async (userId: number) => {
  const standings = await getStandings();
  const me = standings.find((standing) => standing.userId === userId) ?? { userId, name: "", username: "", totalPoints: 0, exactScores: 0, winnerHits: 0, predictionsCount: 0 };
  const pending = await prisma.match.findMany({ where: { status: "SCHEDULED", matchDate: { gt: new Date() }, predictions: { none: { userId } } }, select: { homeTeam: true, awayTeam: true } });
  const pendingMatches = pending.filter((match) => hasDefinedTeams(match.homeTeam, match.awayTeam)).length;
  return { totalPoints: me.totalPoints, position: Math.max(standings.findIndex((standing) => standing.userId === userId) + 1, 0), predictionsCount: me.predictionsCount, exactScores: me.exactScores, winnerHits: me.winnerHits, pendingMatches };
};

export const getHistory = () => prisma.match.findMany({
  include: { predictions: { include: { user: { select: { id: true, name: true, username: true } } }, orderBy: { user: { name: "asc" } } } },
  orderBy: { matchDate: "asc" }
});
