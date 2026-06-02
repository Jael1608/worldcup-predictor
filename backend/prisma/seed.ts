import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/utils/password";
import { officialFixtures } from "../src/data/official-fixtures";

const prisma = new PrismaClient();

async function main() {
  await prisma.prediction.deleteMany();
  await prisma.match.deleteMany();
  await prisma.user.deleteMany();
  await Promise.all([
    prisma.user.create({ data: { name: "Administrador", username: "admin", passwordHash: await hashPassword("admin123"), role: "ADMIN" } }),
    prisma.user.create({ data: { name: "Joel", username: "joel", passwordHash: await hashPassword("123456"), role: "PLAYER" } }),
    prisma.user.create({ data: { name: "Adan", username: "adan", passwordHash: await hashPassword("123456"), role: "PLAYER" } }),
    prisma.user.create({ data: { name: "Dani", username: "dani", passwordHash: await hashPassword("123456"), role: "PLAYER" } })
  ]);
  await prisma.match.createMany({
    data: officialFixtures.map((match) => ({
      ...match,
      matchDate: new Date(match.matchDate),
      status: "SCHEDULED",
      source: "fifa-official-2026-04-10"
    }))
  });
}

main().then(() => prisma.$disconnect()).catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });
