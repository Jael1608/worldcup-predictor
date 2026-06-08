import { prisma } from "../prisma";
import { AppError } from "../middlewares/error.middleware";
import { saveResult } from "./matches.service";

type RawResult = Record<string, unknown>;

export type ResultPreview = {
  matchId: number;
  externalId: string | null;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  matchDate: Date;
  alreadyLoaded: boolean;
  currentScore: string | null;
};

const teamAliases = new Map([
  ["Türkiye", "Turquía"],
  ["Côte d'Ivoire", "Costa de Marfil"],
  ["Chequia", "República Checa"],
  ["República de Corea", "Corea del Sur"],
  ["Curaçao", "Curazao"]
]);

const normalized = (value: unknown) => {
  const text = String(value ?? "").trim();
  return (teamAliases.get(text) ?? text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

const pick = (source: unknown, paths: string[]) => {
  for (const path of paths) {
    const value = path.split(".").reduce<unknown>((current, key) => {
      if (current && typeof current === "object" && key in current) return (current as Record<string, unknown>)[key];
      return undefined;
    }, source);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
};

const scoreOf = (value: unknown) => {
  const score = Number(value);
  return Number.isInteger(score) && score >= 0 ? score : null;
};

const isFinal = (item: RawResult) => {
  const status = String(pick(item, ["status", "status.short", "fixture.status.short", "matchStatus", "state"]) ?? "").toUpperCase();
  return ["FT", "AET", "PEN", "FINISHED", "FINAL", "FULL_TIME", "COMPLETED", "COMPLETE"].some((token) => status.includes(token));
};

const resultArray = (payload: unknown): RawResult[] => {
  if (Array.isArray(payload)) return payload as RawResult[];
  if (!payload || typeof payload !== "object") return [];
  const container = payload as Record<string, unknown>;
  for (const key of ["results", "matches", "response", "data", "fixtures"]) {
    if (Array.isArray(container[key])) return container[key] as RawResult[];
  }
  return [];
};

const normalizeExternalResult = (item: RawResult) => {
  const homeTeam = String(pick(item, ["homeTeam", "home.name", "teams.home.name", "teamHome.name", "localTeam.name"]) ?? "").trim();
  const awayTeam = String(pick(item, ["awayTeam", "away.name", "teams.away.name", "teamAway.name", "visitorTeam.name"]) ?? "").trim();
  const homeScore = scoreOf(pick(item, ["homeScore", "score.home", "goals.home", "score.fulltime.home", "score.fullTime.home"]));
  const awayScore = scoreOf(pick(item, ["awayScore", "score.away", "goals.away", "score.fulltime.away", "score.fullTime.away"]));
  const dateValue = pick(item, ["matchDate", "date", "fixture.date", "utcDate"]);
  const matchDate = dateValue ? new Date(String(dateValue)) : null;
  const externalId = pick(item, ["externalId", "id", "matchId", "fixture.id"])?.toString();

  if (!homeTeam || !awayTeam || homeScore === null || awayScore === null || !isFinal(item)) return null;
  return { externalId, homeTeam, awayTeam, homeScore, awayScore, matchDate: matchDate && !Number.isNaN(matchDate.getTime()) ? matchDate : null };
};

const fetchExternalResults = async () => {
  if (!process.env.RESULTS_API_URL) throw new AppError(400, "RESULTS_API_URL no está configurado");
  const headers: Record<string, string> = {};
  if (process.env.RESULTS_API_TOKEN) headers.Authorization = `Bearer ${process.env.RESULTS_API_TOKEN}`;
  const response = await fetch(process.env.RESULTS_API_URL, { headers });
  if (!response.ok) throw new AppError(502, `La API externa respondió ${response.status}`);
  const payload = await response.json();
  return resultArray(payload).map(normalizeExternalResult).filter((item): item is NonNullable<typeof item> => Boolean(item));
};

export const previewExternalResults = async () => {
  const [externalResults, matches] = await Promise.all([
    fetchExternalResults(),
    prisma.match.findMany({ orderBy: { matchDate: "asc" } })
  ]);

  const previews: ResultPreview[] = [];
  for (const result of externalResults) {
    const match = matches.find((candidate) => {
      if (result.externalId && candidate.externalId === result.externalId) return true;
      const sameTeams = normalized(candidate.homeTeam) === normalized(result.homeTeam) && normalized(candidate.awayTeam) === normalized(result.awayTeam);
      if (!sameTeams) return false;
      if (!result.matchDate) return true;
      return Math.abs(candidate.matchDate.getTime() - result.matchDate.getTime()) <= 36 * 60 * 60 * 1000;
    });
    if (!match) continue;
    previews.push({
      matchId: match.id,
      externalId: match.externalId,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeScore: result.homeScore,
      awayScore: result.awayScore,
      matchDate: match.matchDate,
      alreadyLoaded: match.status === "FINISHED" && match.homeScore === result.homeScore && match.awayScore === result.awayScore,
      currentScore: match.homeScore !== null && match.awayScore !== null ? `${match.homeScore}-${match.awayScore}` : null
    });
  }

  return { fetchedAt: new Date(), count: previews.length, results: previews };
};

export const applyExternalResults = async (matchIds?: unknown) => {
  const selected = Array.isArray(matchIds) ? new Set(matchIds.map(Number).filter(Number.isInteger)) : null;
  const preview = await previewExternalResults();
  const toApply = selected ? preview.results.filter((result) => selected.has(result.matchId)) : preview.results.filter((result) => !result.alreadyLoaded);
  const applied = [];
  for (const result of toApply) {
    await saveResult(result.matchId, { homeScore: result.homeScore, awayScore: result.awayScore });
    applied.push(result);
  }
  return { applied: applied.length, results: applied };
};
