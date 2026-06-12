import { useEffect, useState } from "react";
import { api } from "../api/client";
import { ChampionPredictionWithUser } from "../types";

export const ChampionPredictionsList = () => {
  const [predictions, setPredictions] = useState<ChampionPredictionWithUser[]>([]);
  useEffect(() => { void api.get<ChampionPredictionWithUser[]>("/predictions/champion/all").then(({ data }) => setPredictions(data)); }, []);

  return <section className="panel">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">Campeón</p>
        <h2 className="mt-1 text-xl font-black">Apuestas de campeón</h2>
      </div>
      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300">{predictions.length} cargadas</span>
    </div>
    {predictions.length ? <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {predictions.map((prediction) => <div className="rounded-xl bg-[#16243a] p-3" key={prediction.id}>
        <p className="text-sm font-bold text-slate-200">{prediction.user.name}</p>
        <p className="mt-1 text-lg font-black text-yellow-300">{prediction.team}</p>
        <p className="mt-1 text-xs text-slate-500">{new Date(prediction.createdAt).toLocaleString()}</p>
      </div>)}
    </div> : <p className="mt-4 text-sm text-slate-400">Todavía nadie cargó su campeón.</p>}
  </section>;
};
