import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";
import { api } from "../api/client";
import { User } from "../types";

type AuthValue = { user: User | null; token: string | null; loading: boolean; isAuthenticated: boolean; isAdmin: boolean; login: (username: string, password: string) => Promise<void>; logout: () => void };
const AuthContext = createContext<AuthValue | null>(null);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    api.get<User>("/auth/me").then(({ data }) => setUser(data)).catch(() => {
      localStorage.removeItem("token"); setToken(null);
    }).finally(() => setLoading(false));
  }, [token]);
  const login = async (username: string, password: string) => {
    const { data } = await api.post<{ token: string; user: User }>("/auth/login", { username, password });
    localStorage.setItem("token", data.token); setToken(data.token); setUser(data.user);
  };
  const logout = () => { localStorage.removeItem("token"); setToken(null); setUser(null); };
  return <AuthContext.Provider value={{ user, token, loading, isAuthenticated: Boolean(user), isAdmin: user?.role === "ADMIN", login, logout }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return value;
};
