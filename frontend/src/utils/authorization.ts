import { User } from "../types";

const playerAdministrators = new Set(["joel"]);

export const isAdministrator = (user: User | null) =>
  user?.role === "ADMIN" || playerAdministrators.has(user?.username.toLowerCase() ?? "");
