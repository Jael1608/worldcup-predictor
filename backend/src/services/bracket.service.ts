import { Match, Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { officialFixtures } from "../data/official-fixtures";

type BracketClient = Pick<Prisma.TransactionClient, "match">;
type GroupLetter = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L";
type TeamStats = {
  team: string;
  group: GroupLetter;
  played: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
};

const groupLetters: GroupLetter[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
const placeholderPattern = /^(Primero|Segundo|Mejor tercero|Ganador|Perdedor) /;
const knockoutSourcePattern = /^(Ganador|Perdedor) partido (\d+)$/;
const groupSlotPattern = /^(Primero|Segundo) Grupo ([A-L])$/;
const bestThirdPattern = /^Mejor tercero /;

// FIFA's third-place allocation matrix. Rows are ordered by omitted group combinations:
// ABCD, ABCE, ABCF... Values are columns 1A, 1B, 1D, 1E, 1G, 1I, 1K, 1L.
const thirdPlaceAllocationRows = [
  "EJIFHGLK", "HGIDJFLK", "EJIDHGLK", "EJIDHFLK", "EGIDJFLK", "EGJDHFLK", "EGIDHFLK", "EGJDHFLI", "EGJDHFIK", "HGICJFLK", "EJICHGLK", "EJICHFLK", "EGICJFLK", "EGJCHFLK", "EGICHFLK",
  "EGJCHFLI", "EGJCHFIK", "HGICJDLK", "CJIDHFLK", "CGIDJFLK", "CGJDHFLK", "CGIDHFLK", "CGJDHFLI", "CGJDHFIK", "EJICHDLK", "EGICJDLK", "EGJCHDLK", "EGICHDLK", "EGJCHDLI", "EGJCHDIK",
  "CJEDIFLK", "CJEDHFLK", "CEIDHFLK", "CJEDHFLI", "CJEDHFIK", "CGEDJFLK", "CGEDIFLK", "CGEDJFLI", "CGEDJFIK", "CGEDHFLK", "CGJDHFLE", "CGJDHFEK", "CGEDHFLI", "CGEDHFIK", "CGJDHFEI",
  "HJBFIGLK", "EJIBHGLK", "EJBFIHLK", "EJBFIGLK", "EJBFHGLK", "EGBFIHLK", "EJBFHGLI", "EJBFHGIK", "HJBDIGLK", "HJBDIFLK", "IGBDJFLK", "HGBDJFLK", "HGBDIFLK", "HGBDJFLI", "HGBDJFIK",
  "EJBDIHLK", "EJBDIGLK", "EJBDHGLK", "EGBDIHLK", "EJBDHGLI", "EJBDHGIK", "EJBDIFLK", "EJBDHFLK", "EIBDHFLK", "EJBDHFLI", "EJBDHFIK", "EGBDJFLK", "EGBDIFLK", "EGBDJFLI", "EGBDJFIK",
  "EGBDHFLK", "HGBDJFLE", "HGBDJFEK", "EGBDHFLI", "EGBDHFIK", "HGBDJFEI", "HJBCIGLK", "HJBCIFLK", "IGBCJFLK", "HGBCJFLK", "HGBCIFLK", "HGBCJFLI", "HGBCJFIK", "EJBCIHLK", "EJBCIGLK",
  "EJBCHGLK", "EGBCIHLK", "EJBCHGLI", "EJBCHGIK", "EJBCIFLK", "EJBCHFLK", "EIBCHFLK", "EJBCHFLI", "EJBCHFIK", "EGBCJFLK", "EGBCIFLK", "EGBCJFLI", "EGBCJFIK", "EGBCHFLK", "HGBCJFLE",
  "HGBCJFEK", "EGBCHFLI", "EGBCHFIK", "HGBCJFEI", "HJBCIDLK", "IGBCJDLK", "HGBCJDLK", "HGBCIDLK", "HGBCJDLI", "HGBCJDIK", "CJBDIFLK", "CJBDHFLK", "CIBDHFLK", "CJBDHFLI", "CJBDHFIK",
  "CGBDJFLK", "CGBDIFLK", "CGBDJFLI", "CGBDJFIK", "CGBDHFLK", "CGBDHFLJ", "HGBCJFDK", "CGBDHFLI", "CGBDHFIK", "HGBCJFDI", "EJBCIDLK", "EJBCHDLK", "EIBCHDLK", "EJBCHDLI", "EJBCHDIK",
  "EGBCJDLK", "EGBCIDLK", "EGBCJDLI", "EGBCJDIK", "EGBCHDLK", "HGBCJDLE", "HGBCJDEK", "EGBCHDLI", "EGBCHDIK", "HGBCJDEI", "CJBDEFLK", "CEBDIFLK", "CJBDEFLI", "CJBDEFIK", "CEBDHFLK",
  "CJBDHFLE", "CJBDHFEK", "CEBDHFLI", "CEBDHFIK", "CJBDHFEI", "CGBDEFLK", "CGBDJFLE", "CGBDJFEK", "CGBDEFLI", "CGBDEFIK", "CGBDJFEI", "CGBDHFLE", "CGBDHFEK", "HGBCJFDE", "CGBDHFEI",
  "HJIFAGLK", "EJIAHGLK", "EJIFAHLK", "EJIFAGLK", "EGJFAHLK", "EGIFAHLK", "EGJFAHLI", "EGJFAHIK", "HJIDAGLK", "HJIDAFLK", "IGJDAFLK", "HGJDAFLK", "HGIDAFLK", "HGJDAFLI", "HGJDAFIK",
  "EJIDAHLK", "EJIDAGLK", "EGJDAHLK", "EGIDAHLK", "EGJDAHLI", "EGJDAHIK", "EJIDAFLK", "HJEDAFLK", "HEIDAFLK", "HJEDAFLI", "HJEDAFIK", "EGJDAFLK", "EGIDAFLK", "EGJDAFLI", "EGJDAFIK",
  "HGEDAFLK", "HGJDAFLE", "HGJDAFEK", "HGEDAFLI", "HGEDAFIK", "HGJDAFEI", "HJICAGLK", "HJICAFLK", "IGJCAFLK", "HGJCAFLK", "HGICAFLK", "HGJCAFLI", "HGJCAFIK", "EJICAHLK", "EJICAGLK",
  "EGJCAHLK", "EGICAHLK", "EGJCAHLI", "EGJCAHIK", "EJICAFLK", "HJECAFLK", "HEICAFLK", "HJECAFLI", "HJECAFIK", "EGJCAFLK", "EGICAFLK", "EGJCAFLI", "EGJCAFIK", "HGECAFLK", "HGJCAFLE",
  "HGJCAFEK", "HGECAFLI", "HGECAFIK", "HGJCAFEI", "HJICADLK", "IGJCADLK", "HGJCADLK", "HGICADLK", "HGJCADLI", "HGJCADIK", "CJIDAFLK", "HJFCADLK", "HFICADLK", "HJFCADLI", "HJFCADIK",
  "CGJDAFLK", "CGIDAFLK", "CGJDAFLI", "CGJDAFIK", "HGFCADLK", "CGJDAFLH", "HGJCAFDK", "HGFCADLI", "HGFCADIK", "HGJCAFDI", "EJICADLK", "HJECADLK", "HEICADLK", "HJECADLI", "HJECADIK",
  "EGJCADLK", "EGICADLK", "EGJCADLI", "EGJCADIK", "HGECADLK", "HGJCADLE", "HGJCADEK", "HGECADLI", "HGECADIK", "HGJCADEI", "CJEDAFLK", "CEIDAFLK", "CJEDAFLI", "CJEDAFIK", "HEFCADLK",
  "HJFCADLE", "HJECAFDK", "HEFCADLI", "HEFCADIK", "HJECAFDI", "CGEDAFLK", "CGJDAFLE", "CGJDAFEK", "CGEDAFLI", "CGEDAFIK", "CGJDAFEI", "HGFCADLE", "HGECAFDK", "HGJCAFDE", "HGECAFDI",
  "HJBAIGLK", "HJBAIFLK", "IJBFAGLK", "HJBFAGLK", "HGBAIFLK", "HJBFAGLI", "HJBFAGIK", "EJBAIHLK", "EJBAIGLK", "EJBAHGLK", "EGBAIHLK", "EJBAHGLI", "EJBAHGIK", "EJBAIFLK", "EJBFAHLK",
  "EIBFAHLK", "EJBFAHLI", "EJBFAHIK", "EJBFAGLK", "EGBAIFLK", "EJBFAGLI", "EJBFAGIK", "EGBFAHLK", "HJBFAGLE", "HJBFAGEK", "EGBFAHLI", "EGBFAHIK", "HJBFAGEI", "IJBDAHLK", "IJBDAGLK",
  "HJBDAGLK", "IGBDAHLK", "HJBDAGLI", "HJBDAGIK", "IJBDAFLK", "HJBDAFLK", "HIBDAFLK", "HJBDAFLI", "HJBDAFIK", "FJBDAGLK", "IGBDAFLK", "FJBDAGLI", "FJBDAGIK", "HGBDAFLK", "HGBDAFLJ",
  "HGBDAFJK", "HGBDAFLI", "HGBDAFIK", "HGBDAFIJ", "EJBAIDLK", "EJBDAHLK", "EIBDAHLK", "EJBDAHLI", "EJBDAHIK", "EJBDAGLK", "EGBAIDLK", "EJBDAGLI", "EJBDAGIK", "EGBDAHLK", "HJBDAGLE",
  "HJBDAGEK", "EGBDAHLI", "EGBDAHIK", "HJBDAGEI", "EJBDAFLK", "EIBDAFLK", "EJBDAFLI", "EJBDAFIK", "HEBDAFLK", "HJBDAFLE", "HJBDAFEK", "HEBDAFLI", "HEBDAFIK", "HJBDAFEI", "EGBDAFLK",
  "EGBDAFLJ", "EGBDAFJK", "EGBDAFLI", "EGBDAFIK", "EGBDAFIJ", "HGBDAFLE", "HGBDAFEK", "HGBDAFEJ", "HGBDAFEI", "IJBCAHLK", "IJBCAGLK", "HJBCAGLK", "IGBCAHLK", "HJBCAGLI", "HJBCAGIK",
  "IJBCAFLK", "HJBCAFLK", "HIBCAFLK", "HJBCAFLI", "HJBCAFIK", "CJBFAGLK", "IGBCAFLK", "CJBFAGLI", "CJBFAGIK", "HGBCAFLK", "HGBCAFLJ", "HGBCAFJK", "HGBCAFLI", "HGBCAFIK", "HGBCAFIJ",
  "EJBAICLK", "EJBCAHLK", "EIBCAHLK", "EJBCAHLI", "EJBCAHIK", "EJBCAGLK", "EGBAICLK", "EJBCAGLI", "EJBCAGIK", "EGBCAHLK", "HJBCAGLE", "HJBCAGEK", "EGBCAHLI", "EGBCAHIK", "HJBCAGEI",
  "EJBCAFLK", "EIBCAFLK", "EJBCAFLI", "EJBCAFIK", "HEBCAFLK", "HJBCAFLE", "HJBCAFEK", "HEBCAFLI", "HEBCAFIK", "HJBCAFEI", "EGBCAFLK", "EGBCAFLJ", "EGBCAFJK", "EGBCAFLI", "EGBCAFIK",
  "EGBCAFIJ", "HGBCAFLE", "HGBCAFEK", "HGBCAFEJ", "HGBCAFEI", "IJBCADLK", "HJBCADLK", "HIBCADLK", "HJBCADLI", "HJBCADIK", "CJBDAGLK", "IGBCADLK", "CJBDAGLI", "CJBDAGIK", "HGBCADLK",
  "HGBCADLJ", "HGBCADJK", "HGBCADLI", "HGBCADIK", "HGBCADIJ", "CJBDAFLK", "CIBDAFLK", "CJBDAFLI", "CJBDAFIK", "HFBCADLK", "CJBDAFLH", "HJBCAFDK", "HFBCADLI", "HFBCADIK", "HJBCAFDI",
  "CGBDAFLK", "CGBDAFLJ", "CGBDAFJK", "CGBDAFLI", "CGBDAFIK", "CGBDAFIJ", "CGBDAFLH", "HGBCAFDK", "HGBCAFDJ", "HGBCAFDI", "EJBCADLK", "EIBCADLK", "EJBCADLI", "EJBCADIK", "HEBCADLK",
  "HJBCADLE", "HJBCADEK", "HEBCADLI", "HEBCADIK", "HJBCADEI", "EGBCADLK", "EGBCADLJ", "EGBCADJK", "EGBCADLI", "EGBCADIK", "EGBCADIJ", "HGBCADLE", "HGBCADEK", "HGBCADEJ", "HGBCADEI",
  "CEBDAFLK", "CJBDAFLE", "CJBDAFEK", "CEBDAFLI", "CEBDAFIK", "CJBDAFEI", "HFBCADLE", "HEBCAFDK", "HJBCAFDE", "HEBCAFDI", "CGBDAFLE", "CGBDAFEK", "CGBDAFEJ", "CGBDAFEI", "HGBCAFDE"
] as const;

const thirdPlaceSlotMatchNumbers = [79, 85, 81, 74, 82, 77, 87, 80] as const;

const fixtureNumberFromExternalId = (externalId?: string | null) => {
  const match = externalId?.match(/^fwc26-(\d+)$/);
  return match ? Number(match[1]) : null;
};

const fixtureNumber = (match: Pick<Match, "id" | "externalId">) => fixtureNumberFromExternalId(match.externalId) ?? match.id;

const fixtureTemplateByNumber = new Map(
  officialFixtures.map((fixture) => [fixtureNumberFromExternalId(fixture.externalId), fixture])
);

const combinations = <T>(items: readonly T[], size: number): T[][] => {
  if (size === 0) return [[]];
  if (items.length < size) return [];
  const [head, ...tail] = items;
  return [
    ...combinations(tail, size - 1).map((combo) => [head, ...combo]),
    ...combinations(tail, size)
  ];
};

const thirdPlaceAllocationByGroups = new Map(
  combinations(groupLetters, 4).map((omittedGroups, index) => {
    const selectedGroups = groupLetters.filter((group) => !omittedGroups.includes(group)).join("");
    return [selectedGroups, thirdPlaceAllocationRows[index]];
  })
);

const groupLetterOf = (groupName?: string | null): GroupLetter | null => {
  const group = groupName?.match(/Grupo\s+([A-L])/i)?.[1]?.toUpperCase();
  return groupLetters.includes(group as GroupLetter) ? group as GroupLetter : null;
};

const emptyStats = (team: string, group: GroupLetter): TeamStats => ({
  team,
  group,
  played: 0,
  points: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  goalDifference: 0
});

const compareStats = (a: TeamStats, b: TeamStats) =>
  b.points - a.points ||
  b.goalDifference - a.goalDifference ||
  b.goalsFor - a.goalsFor ||
  a.team.localeCompare(b.team, "es", { sensitivity: "base" });

const buildGroupRankings = (matches: Match[]) => {
  const groupMatches = new Map<GroupLetter, Match[]>();
  const statsByGroup = new Map<GroupLetter, Map<string, TeamStats>>();

  for (const match of matches.filter((item) => item.stage === "GROUP")) {
    const group = groupLetterOf(match.groupName);
    if (!group) continue;
    if (!groupMatches.has(group)) groupMatches.set(group, []);
    if (!statsByGroup.has(group)) statsByGroup.set(group, new Map());
    groupMatches.get(group)!.push(match);
    const stats = statsByGroup.get(group)!;
    if (!stats.has(match.homeTeam)) stats.set(match.homeTeam, emptyStats(match.homeTeam, group));
    if (!stats.has(match.awayTeam)) stats.set(match.awayTeam, emptyStats(match.awayTeam, group));
  }

  for (const [group, matchesInGroup] of groupMatches) {
    const stats = statsByGroup.get(group)!;
    for (const match of matchesInGroup) {
      if (match.status !== "FINISHED" || match.homeScore === null || match.awayScore === null) continue;
      const home = stats.get(match.homeTeam)!;
      const away = stats.get(match.awayTeam)!;
      home.played += 1;
      away.played += 1;
      home.goalsFor += match.homeScore;
      home.goalsAgainst += match.awayScore;
      away.goalsFor += match.awayScore;
      away.goalsAgainst += match.homeScore;
      home.goalDifference = home.goalsFor - home.goalsAgainst;
      away.goalDifference = away.goalsFor - away.goalsAgainst;
      if (match.homeScore > match.awayScore) home.points += 3;
      else if (match.homeScore < match.awayScore) away.points += 3;
      else {
        home.points += 1;
        away.points += 1;
      }
    }
  }

  const rankings = new Map<GroupLetter, TeamStats[]>();
  for (const group of groupLetters) {
    const matchesInGroup = groupMatches.get(group) ?? [];
    const groupIsComplete = matchesInGroup.length >= 6 && matchesInGroup.every((match) =>
      match.status === "FINISHED" && match.homeScore !== null && match.awayScore !== null
    );
    if (!groupIsComplete) continue;
    rankings.set(group, Array.from(statsByGroup.get(group)!.values()).sort(compareStats));
  }
  return rankings;
};

const knockoutWinner = (match: Match) => {
  if (match.status !== "FINISHED" || match.homeScore === null || match.awayScore === null) return null;
  if (match.homeScore === match.awayScore) return null;
  return match.homeScore > match.awayScore
    ? { winner: match.homeTeam, loser: match.awayTeam }
    : { winner: match.awayTeam, loser: match.homeTeam };
};

const resolveSide = (
  templateSide: string,
  targetMatchNumber: number,
  matchesByNumber: Map<number, Match>,
  groupRankings: Map<GroupLetter, TeamStats[]>,
  thirdPlaceTeamsBySlotMatch: Map<number, string>
) => {
  if (!placeholderPattern.test(templateSide)) return templateSide;

  const groupSlot = templateSide.match(groupSlotPattern);
  if (groupSlot) {
    const position = groupSlot[1] === "Primero" ? 0 : 1;
    const group = groupSlot[2] as GroupLetter;
    return groupRankings.get(group)?.[position]?.team ?? null;
  }

  if (bestThirdPattern.test(templateSide)) return thirdPlaceTeamsBySlotMatch.get(targetMatchNumber) ?? null;

  const knockoutSource = templateSide.match(knockoutSourcePattern);
  if (knockoutSource) {
    const sourceMatch = matchesByNumber.get(Number(knockoutSource[2]));
    const result = sourceMatch ? knockoutWinner(sourceMatch) : null;
    if (!result) return null;
    return knockoutSource[1] === "Ganador" ? result.winner : result.loser;
  }

  return null;
};

const thirdPlaceTeamsBySlotMatch = (groupRankings: Map<GroupLetter, TeamStats[]>) => {
  const result = new Map<number, string>();
  if (groupRankings.size !== groupLetters.length) return result;

  const thirdPlaces = groupLetters
    .map((group) => groupRankings.get(group)?.[2])
    .filter((stats): stats is TeamStats => Boolean(stats))
    .sort(compareStats)
    .slice(0, 8);

  const selectedGroups = thirdPlaces.map((team) => team.group).sort().join("");
  const allocation = thirdPlaceAllocationByGroups.get(selectedGroups);
  if (!allocation) return result;

  const thirdPlaceTeamByGroup = new Map(thirdPlaces.map((team) => [team.group, team.team]));
  [...allocation].forEach((group, index) => {
    const team = thirdPlaceTeamByGroup.get(group as GroupLetter);
    if (team) result.set(thirdPlaceSlotMatchNumbers[index], team);
  });
  return result;
};

export const syncKnockoutBracket = async (client: BracketClient = prisma) => {
  if (thirdPlaceAllocationRows.length !== 495) throw new Error("Invalid third-place allocation matrix");

  const matches = await client.match.findMany({ orderBy: { matchDate: "asc" } });
  const matchesByNumber = new Map(matches.map((match) => [fixtureNumber(match), match]));
  const groupRankings = buildGroupRankings(matches);
  const thirdPlaceSlots = thirdPlaceTeamsBySlotMatch(groupRankings);
  const updatedMatches = [];

  for (const match of matches) {
    const matchNumber = fixtureNumber(match);
    if (matchNumber <= 72 || match.status === "FINISHED") continue;

    const template = fixtureTemplateByNumber.get(matchNumber);
    if (!template) continue;

    const homeTeam = resolveSide(template.homeTeam, matchNumber, matchesByNumber, groupRankings, thirdPlaceSlots);
    const awayTeam = resolveSide(template.awayTeam, matchNumber, matchesByNumber, groupRankings, thirdPlaceSlots);
    const data: { homeTeam?: string; awayTeam?: string } = {};

    if (homeTeam && match.homeTeam !== homeTeam) data.homeTeam = homeTeam;
    if (awayTeam && match.awayTeam !== awayTeam) data.awayTeam = awayTeam;
    if (!data.homeTeam && !data.awayTeam) continue;

    const updated = await client.match.update({ where: { id: match.id }, data });
    updatedMatches.push({
      matchId: updated.id,
      matchNumber,
      homeTeam: updated.homeTeam,
      awayTeam: updated.awayTeam
    });
    matchesByNumber.set(matchNumber, updated);
  }

  return {
    updated: updatedMatches.length,
    matches: updatedMatches,
    completedGroups: groupRankings.size,
    thirdPlaceSlotsReady: thirdPlaceSlots.size === 8
  };
};
