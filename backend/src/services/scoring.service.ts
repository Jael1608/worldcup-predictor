export const PENALTY_BONUS_POINTS = 2;
export const penaltyPredictionStages = ["ROUND_OF_16", "QUARTER_FINAL", "SEMI_FINAL", "THIRD_PLACE", "FINAL"] as const;

export const requiresPenaltyPrediction = (stage: string) => penaltyPredictionStages.includes(stage as typeof penaltyPredictionStages[number]);

export const isExactScore = (predictedHome: number, predictedAway: number, realHome: number, realAway: number) =>
  predictedHome === realHome && predictedAway === realAway;

export const isWinnerHit = (predictedHome: number, predictedAway: number, realHome: number, realAway: number) =>
  !isExactScore(predictedHome, predictedAway, realHome, realAway) && Math.sign(predictedHome - predictedAway) === Math.sign(realHome - realAway);

export const baseScorePoints = (predictedHome: number, predictedAway: number, realHome: number, realAway: number) => {
  if (isExactScore(predictedHome, predictedAway, realHome, realAway)) return 3;
  return isWinnerHit(predictedHome, predictedAway, realHome, realAway) ? 1 : 0;
};

export const penaltyBonusPoints = (stage: string, realHome: number, realAway: number, winnerTeam?: string | null, predictedPenaltyWinner?: string | null) =>
  requiresPenaltyPrediction(stage) && realHome === realAway && Boolean(winnerTeam) && predictedPenaltyWinner === winnerTeam ? PENALTY_BONUS_POINTS : 0;

export const calculatePoints = (
  predictedHome: number,
  predictedAway: number,
  realHome: number,
  realAway: number,
  stage = "GROUP",
  winnerTeam?: string | null,
  predictedPenaltyWinner?: string | null
) => baseScorePoints(predictedHome, predictedAway, realHome, realAway) + penaltyBonusPoints(stage, realHome, realAway, winnerTeam, predictedPenaltyWinner);
