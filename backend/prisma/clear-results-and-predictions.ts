import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$transaction(async (tx) => {
    const predictions = await tx.prediction.deleteMany();
    const matches = await tx.match.updateMany({
      data: {
        homeScore: null,
        awayScore: null,
        status: "SCHEDULED"
      }
    });
    return { predictions: predictions.count, matches: matches.count };
  });

  console.log(`Predicciones eliminadas: ${result.predictions}`);
  console.log(`Resultados reiniciados: ${result.matches}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
