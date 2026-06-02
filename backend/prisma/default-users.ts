import { Role } from "../src/types/domain";

export type DefaultUser = {
  name: string;
  username: string;
  passwordEnv: string;
  role: Role;
};

export const defaultUsers: DefaultUser[] = [
  { name: "Administrador", username: "admin", passwordEnv: "DEFAULT_ADMIN_PASSWORD", role: "ADMIN" },
  { name: "Joel", username: "joel", passwordEnv: "DEFAULT_JOEL_PASSWORD", role: "PLAYER" },
  { name: "Adan", username: "adan", passwordEnv: "DEFAULT_ADAN_PASSWORD", role: "PLAYER" },
  { name: "Dani", username: "dani", passwordEnv: "DEFAULT_DANI_PASSWORD", role: "PLAYER" },
  { name: "Arnaldo", username: "arnaldo", passwordEnv: "DEFAULT_ARNALDO_PASSWORD", role: "PLAYER" },
  { name: "Nelson", username: "nelson", passwordEnv: "DEFAULT_NELSON_PASSWORD", role: "PLAYER" }
];

export const passwordFor = (user: DefaultUser) => {
  const password = process.env[user.passwordEnv];
  if (!password) throw new Error(`Falta configurar ${user.passwordEnv}`);
  return password;
};
