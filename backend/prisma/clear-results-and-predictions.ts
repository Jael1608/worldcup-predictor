import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$transaction(async (tx) => {
    const predictions = await tx.prediction.deleteMany();
    const championPredictions = await tx.championPrediction.deleteMany();
    const officialChampion = await tx.systemConfig.deleteMany({ where: { key: "officialChampion" } });
    const matches = await tx.match.updateMany({
      data: {
        homeScore: null,
        awayScore: null,
        winnerTeam: null,
        status: "SCHEDULED"
      }
    });
    return { predictions: predictions.count, championPredictions: championPredictions.count, officialChampion: officialChampion.count, matches: matches.count };
  });

  console.log(`Predicciones eliminadas: ${result.predictions}`);
  console.log(`Predicciones de campeón eliminadas: ${result.championPredictions}`);
  console.log(`Campeón oficial eliminado: ${result.officialChampion}`);
  console.log(`Resultados reiniciados: ${result.matches}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
