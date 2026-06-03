import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [predictions, championPredictions, officialChampion] = await prisma.$transaction([
    prisma.prediction.deleteMany(),
    prisma.championPrediction.deleteMany(),
    prisma.systemConfig.deleteMany({ where: { key: "officialChampion" } })
  ]);
  console.log(`Predicciones eliminadas: ${predictions.count}`);
  console.log(`Predicciones de campeón eliminadas: ${championPredictions.count}`);
  console.log(`Campeón oficial eliminado: ${officialChampion.count}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
