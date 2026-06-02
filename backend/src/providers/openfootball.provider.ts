import { ImportedMatch } from "./manual.provider";
import { officialFixtures } from "../data/official-fixtures";

// Versioned FIFA fixture fallback. It keeps the app ready even when no live feed is configured.
export const fetchOpenFootballMatches = async (): Promise<ImportedMatch[]> => {
  return officialFixtures;
};
