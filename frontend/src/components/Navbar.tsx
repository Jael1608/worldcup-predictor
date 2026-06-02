import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
const link = ({ isActive }: { isActive: boolean }) => `rounded-xl px-3 py-2 text-sm font-semibold ${isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-white/5"}`;
export const Navbar = () => {
  const { isAdmin, logout, user } = useAuth();
  return <header className="border-b border-[#24344d] bg-[#0b1728]/90 backdrop-blur">
    <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3">
      <div className="mr-auto"><p className="font-black text-white">Quiniela Mundial <span className="text-blue-400">2026</span></p><p className="text-xs text-slate-400">{user?.name}</p></div>
      <nav className="flex flex-wrap items-center gap-1">
        <NavLink to="/" className={link}>Dashboard</NavLink><NavLink to="/matches" className={link}>Partidos</NavLink><NavLink to="/history" className={link}>Historial</NavLink>
        {isAdmin && <NavLink to="/admin" className={link}>Admin</NavLink>}
        <button className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-400 hover:bg-white/5 hover:text-white" onClick={logout}>Salir</button>
      </nav>
    </div>
  </header>;
};
