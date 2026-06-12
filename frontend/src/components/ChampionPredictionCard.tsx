import { FormEvent, useEffect, useState } from "react";
import { api, errorMessage } from "../api/client";
import { ChampionPredictionState } from "../types";
import { Badge } from "./Badge";

export const ChampionPredictionCard = () => {
  const [state, setState] = useState<ChampionPredictionState>();
  const [team, setTeam] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const load = () => api.get<ChampionPredictionState>("/predictions/champion").then(({ data }) => setState(data));
  useEffect(() => { void load(); }, []);
  const save = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setMessage("");
    try { await api.post("/predictions/champion", { team }); await load(); }
    catch (error) { setMessage(errorMessage(error)); } finally { setSaving(false); }
  };
  if (!state) return null;
  return <section className="panel bg-[linear-gradient(135deg,_#172554,_#101c2e)]">
    <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">Pronóstico especial</p><h2 className="mt-1 text-xl font-black">¿Quién será campeón?</h2></div><Badge tone={state.canPredict ? "blue" : "slate"}>{state.canPredict ? "Disponible" : "Cerrado"}</Badge></div>
    {state.prediction ? <p className="mt-4 rounded-xl bg-white/5 p-4 text-center text-2xl font-black text-yellow-300">{state.prediction.team}</p>
    : state.canPredict ? <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={save}><select required className="min-w-0 flex-1" value={team} onChange={(event) => setTeam(event.target.value)}><option value="">Seleccionar selección</option>{state.teams.map((option) => <option key={option}>{option}</option>)}</select><button className="button-primary" disabled={saving || !team}>{saving ? "Guardando..." : "Guardar campeón"}</button></form>
    : <p className="mt-4 text-sm text-slate-300">Ya guardaste tu predicción del campeón.</p>}
    {!state.prediction && <p className="mt-3 text-xs text-slate-400">Solo se puede guardar una vez. Quedó habilitado para quienes todavía no cargaron su campeón.</p>}
    {message && <p className="mt-2 text-sm text-red-300">{message}</p>}
  </section>;
};
