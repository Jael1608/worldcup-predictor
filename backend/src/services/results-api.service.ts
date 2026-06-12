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

export type UnmatchedResult = {
  externalId: string | undefined;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  matchDate: Date | null;
};

export type ResultPreviewResponse = {
  fetchedAt: Date;
  count: number;
  apiMatchCount: number;
  externalCount: number;
  unmatchedCount: number;
  statusSummary: Record<string, number>;
  unmatchedResults: UnmatchedResult[];
  results: ResultPreview[];
};

const FOOTBALL_DATA_URL = "https://api.football-data.org/v4/competitions/WC/matches?season=2026";

const teamAliases = new Map([
  ["Algeria", "Argelia"],
  ["Argentina", "Argentina"],
  ["Australia", "Australia"],
  ["Austria", "Austria"],
  ["Belgium", "Bélgica"],
  ["Bosnia and Herzegovina", "Bosnia y Herzegovina"],
  ["Brazil", "Brasil"],
  ["Cabo Verde", "Cabo Verde"],
  ["Cape Verde", "Cabo Verde"],
  ["Canada", "Canadá"],
  ["Colombia", "Colombia"],
  ["Costa de Marfil", "Costa de Marfil"],
  ["Côte d'Ivoire", "Costa de Marfil"],
  ["Croatia", "Croacia"],
  ["Curaçao", "Curazao"],
  ["Curacao", "Curazao"],
  ["Czechia", "República Checa"],
  ["Czech Republic", "República Checa"],
  ["Chequia", "República Checa"],
  ["DR Congo", "RD del Congo"],
  ["Democratic Republic of the Congo", "RD del Congo"],
  ["Ecuador", "Ecuador"],
  ["Egypt", "Egipto"],
  ["England", "Inglaterra"],
  ["France", "Francia"],
  ["Germany", "Alemania"],
  ["Ghana", "Ghana"],
  ["Haiti", "Haití"],
  ["Iran", "Irán"],
  ["Iraq", "Irak"],
  ["Japan", "Japón"],
  ["Jordan", "Jordania"],
  ["Korea Republic", "Corea del Sur"],
  ["Korea, Republic of", "Corea del Sur"],
  ["Republic of Korea", "Corea del Sur"],
  ["South Korea", "Corea del Sur"],
  ["Mexico", "México"],
  ["Morocco", "Marruecos"],
  ["Netherlands", "Países Bajos"],
  ["New Zealand", "Nueva Zelanda"],
  ["Norway", "Noruega"],
  ["Panama", "Panamá"],
  ["Paraguay", "Paraguay"],
  ["Portugal", "Portugal"],
  ["Qatar", "Catar"],
  ["Saudi Arabia", "Arabia Saudita"],
  ["Scotland", "Escocia"],
  ["Senegal", "Senegal"],
  ["South Africa", "Sudáfrica"],
  ["Spain", "España"],
  ["Sweden", "Suecia"],
  ["Switzerland", "Suiza"],
  ["Tunisia", "Túnez"],
  ["Turkey", "Turquía"],
  ["Türkiye", "Turquía"],
  ["República de Corea", "Corea del Sur"],
  ["United States", "Estados Unidos"],
  ["USA", "Estados Unidos"],
  ["Uruguay", "Uruguay"],
  ["Uzbekistan", "Uzbekistán"],
  ["Uzbekistán", "Uzbekistán"]
]);

const normalized = (value: unknown) => {
  const text = String(value ?? "").replace(/\s+(FC|CF)$/i, "").trim();
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

const statusOf = (item: RawResult) => String(pick(item, ["status", "status.short", "fixture.status.short", "matchStatus", "state"]) ?? "SIN_ESTADO").toUpperCase();

const isFinal = (item: RawResult) => {
  const status = statusOf(item);
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
  const homeTeam = String(pick(item, ["homeTeam.name", "home.name", "teams.home.name", "teamHome.name", "localTeam.name", "homeTeam"]) ?? "").trim();
  const awayTeam = String(pick(item, ["awayTeam.name", "away.name", "teams.away.name", "teamAway.name", "visitorTeam.name", "awayTeam"]) ?? "").trim();
  const homeScore = scoreOf(pick(item, ["homeScore", "score.home", "goals.home", "score.fulltime.home", "score.fullTime.home"]));
  const awayScore = scoreOf(pick(item, ["awayScore", "score.away", "goals.away", "score.fulltime.away", "score.fullTime.away"]));
  const dateValue = pick(item, ["matchDate", "date", "fixture.date", "utcDate"]);
  const matchDate = dateValue ? new Date(String(dateValue)) : null;
  const externalId = pick(item, ["externalId", "id", "matchId", "fixture.id"])?.toString();

  if (!homeTeam || !awayTeam || homeScore === null || awayScore === null || !isFinal(item)) return null;
  return { externalId, homeTeam, awayTeam, homeScore, awayScore, matchDate: matchDate && !Number.isNaN(matchDate.getTime()) ? matchDate : null };
};

const sameMatchDate = (candidateDate: Date, resultDate: Date | null) =>
  !resultDate || Math.abs(candidateDate.getTime() - resultDate.getTime()) <= 36 * 60 * 60 * 1000;

const findMatchingPreview = (matches: Awaited<ReturnType<typeof prisma.match.findMany>>, result: NonNullable<ReturnType<typeof normalizeExternalResult>>) => {
  const direct = matches.find((candidate) => {
    if (result.externalId && candidate.externalId === result.externalId) return true;
    return normalized(candidate.homeTeam) === normalized(result.homeTeam)
      && normalized(candidate.awayTeam) === normalized(result.awayTeam)
      && sameMatchDate(candidate.matchDate, result.matchDate);
  });
  if (direct) return { match: direct, homeScore: result.homeScore, awayScore: result.awayScore };

  const reversed = matches.find((candidate) =>
    normalized(candidate.homeTeam) === normalized(result.awayTeam)
    && normalized(candidate.awayTeam) === normalized(result.homeTeam)
    && sameMatchDate(candidate.matchDate, result.matchDate)
  );
  if (reversed) return { match: reversed, homeScore: result.awayScore, awayScore: result.homeScore };
  return null;
};

const fetchExternalResults = async () => {
  const url = process.env.RESULTS_API_URL || FOOTBALL_DATA_URL;
  const isFootballData = url.includes("football-data.org");
  if (isFootballData && !process.env.RESULTS_API_TOKEN) throw new AppError(400, "Configura RESULTS_API_TOKEN con tu token de football-data.org");
  const headers: Record<string, string> = {};
  if (process.env.RESULTS_API_TOKEN) {
    if (isFootballData) headers["X-Auth-Token"] = process.env.RESULTS_API_TOKEN;
    else headers.Authorization = `Bearer ${process.env.RESULTS_API_TOKEN}`;
  }
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new AppError(502, `La API externa respondió ${response.status}`);
  const payload = await response.json();
  const rawResults = resultArray(payload);
  const statusSummary = rawResults.reduce<Record<string, number>>((summary, item) => {
    const status = statusOf(item);
    summary[status] = (summary[status] ?? 0) + 1;
    return summary;
  }, {});
  const finalResults = rawResults.map(normalizeExternalResult).filter((item): item is NonNullable<typeof item> => Boolean(item));
  return { rawCount: rawResults.length, statusSummary, finalResults };
};

export const previewExternalResults = async (): Promise<ResultPreviewResponse> => {
  const [externalResponse, matches] = await Promise.all([
    fetchExternalResults(),
    prisma.match.findMany({ orderBy: { matchDate: "asc" } })
  ]);
  const externalResults = externalResponse.finalResults;

  const previews: ResultPreview[] = [];
  const unmatchedResults: UnmatchedResult[] = [];
  for (const result of externalResults) {
    const matchPreview = findMatchingPreview(matches, result);
    if (!matchPreview) {
      unmatchedResults.push(result);
      continue;
    }
    const { match, homeScore, awayScore } = matchPreview;
    previews.push({
      matchId: match.id,
      externalId: match.externalId,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeScore,
      awayScore,
      matchDate: match.matchDate,
      alreadyLoaded: match.status === "FINISHED" && match.homeScore === homeScore && match.awayScore === awayScore,
      currentScore: match.homeScore !== null && match.awayScore !== null ? `${match.homeScore}-${match.awayScore}` : null
    });
  }

  return {
    fetchedAt: new Date(),
    count: previews.length,
    apiMatchCount: externalResponse.rawCount,
    externalCount: externalResults.length,
    unmatchedCount: unmatchedResults.length,
    statusSummary: externalResponse.statusSummary,
    unmatchedResults,
    results: previews
  };
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
