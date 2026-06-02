import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Loading } from "../components/Loading";
import { StandingTable } from "../components/StandingTable";
import { Standing, Summary } from "../types";
import { ChampionPredictionCard } from "../components/ChampionPredictionCard";
import { RankingHighlights } from "../components/RankingHighlights";
import { ShareRankingButton } from "../components/ShareRankingButton";
const phases = [["", "General"], ["GROUP", "Grupos"], ["ROUND_OF_32", "16º"], ["ROUND_OF_16", "8º"], ["QUARTER_FINAL", "4º"], ["SEMI_FINAL", "Semis"], ["FINAL", "Final"]];
export const DashboardPage = () => {
  const [summary, setSummary] = useState<Summary>(); const [standings, setStandings] = useState<Standing[]>(); const [phase, setPhase] = useState("");
  useEffect(() => { api.get<Summary>("/dashboard/my-summary").then(({ data }) => setSummary(data)); }, []);
  useEffect(() => { api.get<Standing[]>("/dashboard/standings", { params: phase ? { stage: phase } : {} }).then(({ data }) => setStandings(data)); }, [phase]);
  if (!summary || !standings) return <Loading />;
  const metrics = [["Mi posición", `#${summary.position || "-"}`], ["Mis puntos", summary.totalPoints], ["Bono campeón", summary.championBonus ? `+${summary.championBonus}` : "-"], ["Aciertos", `${summary.accuracyPercentage}%`], ["Exactos", summary.exactScores], ["Predicciones", summary.predictionsCount], ["Pendientes", summary.pendingMatches], ["Mejor jornada", summary.bestDay ? `${summary.bestDay.points} pts` : "-"]];
  const phaseName = phases.find(([value]) => value === phase)?.[1] ?? "General";
  return <><div><p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">Resumen personal</p><h1 className="mt-1 text-3xl font-black">Dashboard</h1></div><section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">{metrics.map(([label, value]) => <div className="panel" key={label}><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>)}</section>{summary.bestDay && <p className="mt-2 text-xs text-slate-400">Mejor jornada: {new Date(`${summary.bestDay.date}T12:00:00`).toLocaleDateString()}.</p>}<div className="mt-6"><ChampionPredictionCard/></div><div className="mt-6"><RankingHighlights standings={standings}/></div><div className="mb-3 mt-8 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-black">Tabla {phaseName.toLowerCase()}</h2><ShareRankingButton standings={standings} title={`Tabla ${phaseName}`}/></div><div className="mb-3 flex gap-2 overflow-x-auto pb-2">{phases.map(([value, label]) => <button className={phase === value ? "button-primary whitespace-nowrap" : "button-secondary whitespace-nowrap"} key={value} onClick={() => setPhase(value)}>{label}</button>)}</div><StandingTable standings={standings}/></>;
};
