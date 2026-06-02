import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { AppError } from "../middlewares/error.middleware";
import { hashPassword } from "../utils/password";
import { Role, roles } from "../types/domain";

const publicSelect = { id: true, name: true, username: true, role: true, createdAt: true };
const roleOf = (value: unknown): Role => {
  if (!roles.includes(value as Role)) throw new AppError(400, "Rol inválido");
  return value as Role;
};

export const listUsers = () => prisma.user.findMany({ select: publicSelect, orderBy: { name: "asc" } });

export const createUser = async (body: Record<string, unknown>) => {
  const { name, username, password } = body;
  if (typeof name !== "string" || !name.trim() || typeof username !== "string" || !username.trim() || typeof password !== "string" || password.length < 6) {
    throw new AppError(400, "Nombre, usuario y contraseña de al menos 6 caracteres son obligatorios");
  }
  try {
    return await prisma.user.create({
      data: { name: name.trim(), username: username.trim().toLowerCase(), passwordHash: await hashPassword(password), role: roleOf(body.role ?? "PLAYER") },
      select: publicSelect
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new AppError(409, "El usuario ya existe");
    throw error;
  }
};

export const updateUser = async (id: number, body: Record<string, unknown>) => {
  const data: Prisma.UserUpdateInput = {};
  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) throw new AppError(400, "Nombre inválido");
    data.name = body.name.trim();
  }
  if (body.username !== undefined) {
    if (typeof body.username !== "string" || !body.username.trim()) throw new AppError(400, "Usuario inválido");
    data.username = body.username.trim().toLowerCase();
  }
  if (body.password !== undefined) {
    if (typeof body.password !== "string" || body.password.length < 6) throw new AppError(400, "La contraseña debe tener al menos 6 caracteres");
    data.passwordHash = await hashPassword(body.password);
  }
  if (body.role !== undefined) data.role = roleOf(body.role);
  try {
    return await prisma.user.update({ where: { id }, data, select: publicSelect });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") throw new AppError(404, "Usuario no encontrado");
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new AppError(409, "El usuario ya existe");
    throw error;
  }
};

export const deleteUser = async (id: number, requesterId: number) => {
  if (id === requesterId) throw new AppError(400, "No puedes eliminar tu propio usuario");
  try { await prisma.user.delete({ where: { id } }); }
  catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") throw new AppError(404, "Usuario no encontrado");
    throw error;
  }
};
