import type { AuthUser } from "../middlewares/auth.middleware";

const playerAdministrators = new Set(["joel"]);

export const isAdministrator = (user: AuthUser | undefined) =>
  user?.role === "ADMIN" || playerAdministrators.has(user?.username.toLowerCase() ?? "");
