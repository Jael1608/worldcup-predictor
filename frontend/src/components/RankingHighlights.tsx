import { Standing } from "../types";

export const RankingHighlights = ({ standings }: { standings: Standing[] }) => {
  const top = standings.slice(0, 3);
  const last = standings[standings.length - 1];
  const hasPoints = standings.some((standing) => standing.totalPoints > 0);
  const lastPlayers = last ? standings.filter((standing) => standing.totalPoints === last.totalPoints) : [];
  return <section className="grid gap-4 lg:grid-cols-[1fr_280px]">
    <div className="panel"><h2 className="text-lg font-black">Top 3</h2>{hasPoints ? <div className="mt-4 grid gap-3 sm:grid-cols-3">{top.map((standing, index) => <div className={`rounded-xl border p-4 text-center ${index === 0 ? "border-yellow-400/50 bg-yellow-400/10" : "border-[#30415d] bg-[#16243a]"}`} key={standing.userId}><p className="text-2xl">{["1°", "2°", "3°"][index]}</p><p className="mt-2 font-black">{standing.name}</p><p className="text-sm text-slate-300">{standing.totalPoints} puntos</p></div>)}</div> : <p className="mt-3 text-sm text-slate-400">Esperando los primeros puntos.</p>}</div>
    {last && hasPoints && <div className="panel border-lime-500/30 bg-lime-500/5"><p className="text-xs font-black uppercase tracking-[0.2em] text-lime-300">El pasto del grupo</p><p className="mt-4 text-xl font-black">{lastPlayers.map((standing) => standing.name).join(", ")}</p><p className="mt-1 text-sm text-slate-300">{last.totalPoints} puntos</p></div>}
  </section>;
};
