import { Standing } from "../types";

const podiumStyles = {
  0: { order: "order-2", height: "min-h-52", tone: "border-yellow-300/60 bg-yellow-400/15", place: "1.º", medal: "text-yellow-300" },
  1: { order: "order-1", height: "min-h-40", tone: "border-slate-300/40 bg-slate-300/10", place: "2.º", medal: "text-slate-200" },
  2: { order: "order-3", height: "min-h-32", tone: "border-orange-400/40 bg-orange-400/10", place: "3.º", medal: "text-orange-300" }
} as const;

export const RankingHighlights = ({ standings }: { standings: Standing[] }) => {
  const top = standings.slice(0, 3);
  const last = standings[standings.length - 1];
  const hasPoints = standings.some((standing) => standing.totalPoints > 0);
  const lastPlayers = last ? standings.filter((standing) => standing.totalPoints === last.totalPoints) : [];

  return <section className="grid gap-4 lg:grid-cols-[1fr_280px]">
    <div className="panel overflow-hidden">
      <div className="text-center">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">Clasificación</p>
        <h2 className="mt-1 text-xl font-black">Podio Top 3</h2>
      </div>
      {hasPoints ? <div className="mt-6 grid grid-cols-3 items-end gap-2 sm:gap-4">
        {top.map((standing, index) => {
          const style = podiumStyles[index as keyof typeof podiumStyles];
          return <div className={`${style.order} ${style.height} ${style.tone} flex flex-col justify-between rounded-t-2xl border p-3 text-center sm:p-4`} key={standing.userId}>
            <div>
              <p className={`${style.medal} text-3xl font-black sm:text-4xl`}>{style.place}</p>
              <p className="mt-3 break-words text-sm font-black sm:text-base">{standing.name}</p>
              <p className="mt-1 text-xs text-slate-300 sm:text-sm">{standing.totalPoints} puntos</p>
            </div>
            <div className="mt-4 h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-current opacity-60"/></div>
          </div>;
        })}
      </div> : <p className="mt-4 text-center text-sm text-slate-400">Esperando los primeros puntos.</p>}
    </div>
    {last && hasPoints && <div className="panel border-lime-500/30 bg-lime-500/5">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-300">El pasto del grupo</p>
      <p className="mt-4 text-xl font-black">{lastPlayers.map((standing) => standing.name).join(", ")}</p>
      <p className="mt-1 text-sm text-slate-300">{last.totalPoints} puntos</p>
    </div>}
  </section>;
};
