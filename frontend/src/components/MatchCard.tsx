import { FormEvent, useState } from "react";
import { api, errorMessage } from "../api/client";
import { Match } from "../types";
import { Badge } from "./Badge";

const stage: Record<string, string> = { GROUP: "Fase de grupos", ROUND_OF_32: "Dieciseisavos", ROUND_OF_16: "Octavos", QUARTER_FINAL: "Cuartos", SEMI_FINAL: "Semifinal", THIRD_PLACE: "Tercer puesto", FINAL: "Final" };
export const MatchCard = ({ match, onSaved }: { match: Match; onSaved: () => void }) => {
  const [home, setHome] = useState(""); const [away, setAway] = useState(""); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  const save = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError("");
    try { await api.post("/predictions", { matchId: match.id, predictedHome: Number(home), predictedAway: Number(away) }); onSaved(); }
    catch (e) { setError(errorMessage(e)); } finally { setSaving(false); }
  };
  return <article className="panel">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-bold uppercase tracking-wider text-blue-300">{stage[match.stage]} {match.groupName && `· ${match.groupName}`}</p><p className="mt-1 text-xs text-slate-400">{new Date(match.matchDate).toLocaleString()}</p></div><Badge tone={match.status === "FINISHED" ? "green" : "blue"}>{match.status}</Badge></div>
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center"><p className="font-bold">{match.homeTeam}</p><p className="text-xl font-black text-slate-400">VS</p><p className="font-bold">{match.awayTeam}</p></div>
    {match.status === "FINISHED" && <p className="mt-4 rounded-xl bg-green-500/10 p-3 text-center font-black text-green-300">Resultado oficial: {match.homeScore} - {match.awayScore}</p>}
    {match.myPrediction ? <div className="mt-4 rounded-xl border border-[#30415d] bg-[#16243a] p-3 text-center"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Predicción guardada · bloqueada</p><p className="mt-1 text-xl font-black">{match.myPrediction.predictedHome} - {match.myPrediction.predictedAway}</p>{match.status === "FINISHED" && <p className="text-sm text-green-300">{match.myPrediction.points} puntos</p>}</div>
    : match.canPredict ? <form className="mt-4" onSubmit={save}><div className="flex items-center justify-center gap-3"><input required min="0" className="w-16 text-center" type="number" value={home} onChange={(e) => setHome(e.target.value)} /><span>-</span><input required min="0" className="w-16 text-center" type="number" value={away} onChange={(e) => setAway(e.target.value)} /></div><button className="button-primary mt-3 w-full" disabled={saving || home === "" || away === ""}>{saving ? "Guardando..." : "Guardar predicción"}</button>{error && <p className="mt-2 text-sm text-red-300">{error}</p>}</form>
    : <p className="mt-4 text-center text-sm text-slate-400">Predicción no disponible</p>}
  </article>;
};
