export const roles = ["ADMIN", "PLAYER"] as const;
export type Role = typeof roles[number];
export const matchStages = ["GROUP", "ROUND_OF_32", "ROUND_OF_16", "QUARTER_FINAL", "SEMI_FINAL", "THIRD_PLACE", "FINAL"] as const;
export type MatchStage = typeof matchStages[number];
export const matchStatuses = ["SCHEDULED", "LIVE", "FINISHED", "POSTPONED", "CANCELLED"] as const;
export type MatchStatus = typeof matchStatuses[number];
