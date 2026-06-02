import { prisma } from "../prisma";
import { AppError } from "../middlewares/error.middleware";
import { comparePassword } from "../utils/password";
import { signToken } from "../utils/jwt";

export const login = async (username: unknown, password: unknown) => {
  if (typeof username !== "string" || typeof password !== "string") throw new AppError(400, "Usuario y contraseña son obligatorios");
  const found = await prisma.user.findUnique({ where: { username: username.trim().toLowerCase() } });
  if (!found || !(await comparePassword(password, found.passwordHash))) throw new AppError(401, "Credenciales inválidas");
  const user = { id: found.id, name: found.name, username: found.username, role: found.role };
  return { token: signToken(found.id), user };
};
