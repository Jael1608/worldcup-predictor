import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const replacements = new Map([
  ["Türkiye", "Turquía"],
  ["Côte d'Ivoire", "Costa de Marfil"],
  ["Chequia", "República Checa"],
  ["República de Corea", "Corea del Sur"],
  ["Curaçao", "Curazao"]
]);

async function main() {
  let updatedMatches = 0;
  for (const [from, to] of replacements) {
    const [home, away, championPredictions, officialChampion] = await prisma.$transaction([
      prisma.match.updateMany({ where: { homeTeam: from }, data: { homeTeam: to } }),
      prisma.match.updateMany({ where: { awayTeam: from }, data: { awayTeam: to } }),
      prisma.championPrediction.updateMany({ where: { team: from }, data: { team: to } }),
      prisma.systemConfig.updateMany({ where: { key: "officialChampion", value: from }, data: { value: to } })
    ]);
    updatedMatches += home.count + away.count;
    console.log(`${from} -> ${to}: partidos ${home.count + away.count}, campeon ${championPredictions.count + officialChampion.count}`);
  }
  console.log(`Partidos actualizados: ${updatedMatches}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
