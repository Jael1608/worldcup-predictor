import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Loading } from "../components/Loading";
import { MatchCard } from "../components/MatchCard";
import { Match } from "../types";
const filters = [["ALL", "Todos"], ["PENDING", "Pendientes"], ["PREDICTED", "Apostados"], ["FINISHED", "Finalizados"], ["GROUP", "Grupos"], ["ROUND_OF_32", "Dieciseisavos"], ["ROUND_OF_16", "Octavos"], ["QUARTER_FINAL", "Cuartos"], ["SEMI_FINAL", "Semifinal"], ["FINAL", "Final"]];
export const MatchesPage = () => {
  const [matches, setMatches] = useState<Match[]>(); const [filter, setFilter] = useState("ALL");
  const load = () => api.get<Match[]>("/matches").then(({ data }) => setMatches(data));
  useEffect(() => { void load(); }, []);
  useEffect(() => {
    if (!matches) return;
    const now = Date.now();
    const nextStart = matches.map((match) => new Date(match.matchDate).getTime()).filter((time) => time > now).sort((a, b) => a - b)[0];
    if (!nextStart) return;
    const timer = window.setTimeout(() => void load(), nextStart - now + 1000);
    return () => window.clearTimeout(timer);
  }, [matches]);
  if (!matches) return <Loading />;
  const shown = matches.filter((match) => filter === "ALL" || (filter === "PENDING" && match.canPredict) || (filter === "PREDICTED" && match.myPrediction) || (filter === "FINISHED" && match.status === "FINISHED") || match.stage === filter);
  return <><p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">Carga tus resultados</p><h1 className="mt-1 text-3xl font-black">Partidos</h1><div className="my-5 flex gap-2 overflow-x-auto pb-2">{filters.map(([value, label]) => <button className={filter === value ? "button-primary whitespace-nowrap" : "button-secondary whitespace-nowrap"} key={value} onClick={() => setFilter(value)}>{label}</button>)}</div><section className="grid gap-4 md:grid-cols-2">{shown.map((match) => <MatchCard key={match.id} match={match} onSaved={load}/>)}</section>{!shown.length && <p className="panel text-slate-400">No hay partidos para este filtro.</p>}</>;
};
