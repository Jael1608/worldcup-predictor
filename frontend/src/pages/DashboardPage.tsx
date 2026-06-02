import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Loading } from "../components/Loading";
import { StandingTable } from "../components/StandingTable";
import { Standing, Summary } from "../types";
export const DashboardPage = () => {
  const [summary, setSummary] = useState<Summary>(); const [standings, setStandings] = useState<Standing[]>();
  useEffect(() => { Promise.all([api.get<Summary>("/dashboard/my-summary"), api.get<Standing[]>("/dashboard/standings")]).then(([a, b]) => { setSummary(a.data); setStandings(b.data); }); }, []);
  if (!summary || !standings) return <Loading />;
  const metrics = [["Mi posición", `#${summary.position || "-"}`], ["Mis puntos", summary.totalPoints], ["Predicciones", summary.predictionsCount], ["Pendientes", summary.pendingMatches]];
  return <><div><p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">Resumen personal</p><h1 className="mt-1 text-3xl font-black">Dashboard</h1></div><section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">{metrics.map(([label, value]) => <div className="panel" key={label}><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>)}</section><h2 className="mb-3 mt-8 text-xl font-black">Tabla general</h2><StandingTable standings={standings}/></>;
};
