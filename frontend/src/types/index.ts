export type Role = "ADMIN" | "PLAYER";
export type Stage = "GROUP" | "ROUND_OF_32" | "ROUND_OF_16" | "QUARTER_FINAL" | "SEMI_FINAL" | "THIRD_PLACE" | "FINAL";
export type User = { id: number; name: string; username: string; role: Role };
export type Prediction = { id: number; predictedHome: number; predictedAway: number; points: number; user?: Pick<User, "id" | "name" | "username"> };
export type Match = {
  id: number; homeTeam: string; awayTeam: string; homeScore: number | null; awayScore: number | null;
  matchDate: string; stage: Stage; groupName?: string | null; venue?: string | null; status: string;
  myPrediction?: Prediction | null; canPredict?: boolean; predictions?: Prediction[]; predictionsHidden?: boolean;
};
export type Standing = { userId: number; name: string; username: string; totalPoints: number; exactScores: number; winnerHits: number; predictionsCount: number; championBonus: number };
export type Summary = { totalPoints: number; position: number; predictionsCount: number; exactScores: number; winnerHits: number; championBonus: number; pendingMatches: number; accuracyPercentage: number; evaluatedPredictions: number; bestDay: { date: string; points: number } | null };
export type ChampionPrediction = { id: number; team: string; createdAt: string };
export type ChampionPredictionState = { prediction: ChampionPrediction | null; teams: string[]; closesAt: string; canPredict: boolean };
export type OfficialChampionState = { team: string | null; bonusPoints: number; teams: string[] };
export type ResultPreview = {
  matchId: number;
  externalId: string | null;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  matchDate: string;
  alreadyLoaded: boolean;
  currentScore: string | null;
};
export type UnmatchedResult = {
  externalId?: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  matchDate: string | null;
};
export type ResultPreviewResponse = {
  fetchedAt: string;
  count: number;
  apiMatchCount: number;
  externalCount: number;
  unmatchedCount: number;
  statusSummary: Record<string, number>;
  unmatchedResults: UnmatchedResult[];
  results: ResultPreview[];
};
