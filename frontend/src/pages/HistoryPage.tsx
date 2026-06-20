import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Loading } from "../components/Loading";
import { PredictionHistory } from "../components/PredictionHistory";
import { Match } from "../types";
export const HistoryPage = () => {
  const [matches, setMatches] = useState<Match[]>();
  const load = () => api.get<Match[]>("/dashboard/history").then(({ data }) => setMatches(data));
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
  return <><p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">Todas las jugadas</p><h1 className="mt-1 text-3xl font-black">Historial</h1><section className="mt-5 grid gap-4 md:grid-cols-2">{matches.map((match) => <PredictionHistory key={match.id} match={match}/>)}</section></>;
};
