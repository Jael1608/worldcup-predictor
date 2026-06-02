import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/utils/password";
import { officialFixtures } from "../src/data/official-fixtures";
import { defaultUsers, passwordFor } from "./default-users";

const prisma = new PrismaClient();

async function main() {
  await prisma.prediction.deleteMany();
  await prisma.match.deleteMany();
  await prisma.user.deleteMany();
  await Promise.all(defaultUsers.map(async (user) => prisma.user.create({
    data: {
      name: user.name,
      username: user.username,
      passwordHash: await hashPassword(passwordFor(user)),
      role: user.role
    }
  })));
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
