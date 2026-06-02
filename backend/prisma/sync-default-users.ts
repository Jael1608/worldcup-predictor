import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/utils/password";
import { defaultUsers, passwordFor } from "./default-users";

const prisma = new PrismaClient();

async function main() {
  const usernames = defaultUsers.map((user) => user.username);

  for (const user of defaultUsers) {
    const passwordHash = await hashPassword(passwordFor(user));
    await prisma.user.upsert({
      where: { username: user.username },
      create: {
        name: user.name,
        username: user.username,
        passwordHash,
        role: user.role
      },
      update: {
        name: user.name,
        passwordHash,
        role: user.role
      }
    });
  }

  const removed = await prisma.user.deleteMany({
    where: { username: { notIn: usernames } }
  });

  console.log(`Usuarios sincronizados: ${defaultUsers.length}`);
  console.log(`Usuarios adicionales eliminados: ${removed.count}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
