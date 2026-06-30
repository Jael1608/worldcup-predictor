import { FormEvent, useState } from "react";
import { api, errorMessage } from "../api/client";
import { Match } from "../types";
import { Badge } from "./Badge";
import { useUserDateTime } from "../hooks/useUserDateTime";

const stage: Record<string, string> = { GROUP: "Fase de grupos", ROUND_OF_32: "Dieciseisavos", ROUND_OF_16: "Octavos", QUARTER_FINAL: "Cuartos", SEMI_FINAL: "Semifinal", THIRD_PLACE: "Tercer puesto", FINAL: "Final" };
export const MatchCard = ({ match, onSaved }: { match: Match; onSaved: () => void }) => {
  const { formatDateTime } = useUserDateTime();
  const [home, setHome] = useState(""); const [away, setAway] = useState(""); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  const save = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError("");
    try { await api.post("/predictions", { matchId: match.id, predictedHome: Number(home), predictedAway: Number(away) }); onSaved(); }
    catch (e) { setError(errorMessage(e)); } finally { setSaving(false); }
  };
  const distribution = match.predictionDistribution;
  return <article className="panel">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-bold uppercase tracking-wider text-blue-300">{stage[match.stage]} {match.groupName && `· ${match.groupName}`}</p><p className="mt-1 text-xs text-slate-400">{formatDateTime(match.matchDate)}</p></div><Badge tone={match.status === "FINISHED" ? "green" : "blue"}>{match.status}</Badge></div>
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center"><p className="font-bold">{match.homeTeam}</p><p className="text-xl font-black text-slate-400">VS</p><p className="font-bold">{match.awayTeam}</p></div>
    {match.status === "FINISHED" && <p className="mt-4 rounded-xl bg-green-500/10 p-3 text-center font-black text-green-300">Resultado oficial: {match.homeScore} - {match.awayScore}{match.winnerTeam && match.homeScore === match.awayScore ? <span className="block text-xs text-green-200">Avanzó {match.winnerTeam} por penales</span> : null}</p>}
    {match.distributionHidden ? <div className="mt-4 rounded-xl border border-[#30415d] bg-[#0b1728] p-3 text-center text-sm text-slate-400">La distribución se revelará cuando comience el partido.</div>
    : distribution && <div className="mt-4 rounded-xl border border-[#30415d] bg-[#0b1728] p-3">
      <div className="flex items-center justify-between"><p className="text-xs font-black uppercase tracking-wider text-slate-400">Distribución de apuestas</p><p className="text-xs text-slate-500">{distribution.total} apuestas</p></div>
      {distribution.total ? <><div className="mt-3 flex h-3 overflow-hidden rounded-full bg-slate-800"><div className="bg-blue-500" style={{ width: `${distribution.home.percentage}%` }}/><div className="bg-slate-400" style={{ width: `${distribution.draw.percentage}%` }}/><div className="bg-orange-400" style={{ width: `${distribution.away.percentage}%` }}/></div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs"><p className="text-blue-300">Local<br/><strong>{distribution.home.percentage}%</strong></p><p className="text-slate-300">Empate<br/><strong>{distribution.draw.percentage}%</strong></p><p className="text-orange-300">Visitante<br/><strong>{distribution.away.percentage}%</strong></p></div></>
      : <p className="mt-2 text-sm text-slate-500">Todavía no hay apuestas.</p>}
    </div>}
    {match.myPrediction ? <div className="mt-4 rounded-xl border border-[#30415d] bg-[#16243a] p-3 text-center"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Predicción guardada · bloqueada</p><p className="mt-1 text-xl font-black">{match.myPrediction.predictedHome} - {match.myPrediction.predictedAway}</p>{match.status === "FINISHED" && <p className="text-sm text-green-300">{match.myPrediction.points} puntos</p>}</div>
    : match.canPredict ? <form className="mt-4" onSubmit={save}><div className="flex items-center justify-center gap-3"><input required min="0" className="w-16 text-center" type="number" value={home} onChange={(e) => setHome(e.target.value)} /><span>-</span><input required min="0" className="w-16 text-center" type="number" value={away} onChange={(e) => setAway(e.target.value)} /></div><button className="button-primary mt-3 w-full" disabled={saving || home === "" || away === ""}>{saving ? "Guardando..." : "Guardar predicción"}</button>{error && <p className="mt-2 text-sm text-red-300">{error}</p>}</form>
    : <p className="mt-4 text-center text-sm text-slate-400">Predicción no disponible</p>}
  </article>;
};
