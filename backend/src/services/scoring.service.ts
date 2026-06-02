export const calculatePoints = (
  predictedHome: number,
  predictedAway: number,
  realHome: number,
  realAway: number
): 0 | 1 | 3 => {
  if (predictedHome === realHome && predictedAway === realAway) return 3;
  const predictedResult = Math.sign(predictedHome - predictedAway);
  const realResult = Math.sign(realHome - realAway);
  return predictedResult === realResult ? 1 : 0;
};
