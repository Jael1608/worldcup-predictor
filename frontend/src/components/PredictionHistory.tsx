import { Match } from "../types";
import { useUserDateTime } from "../hooks/useUserDateTime";
export const PredictionHistory = ({ match }: { match: Match }) => {
  const { formatDateTime } = useUserDateTime();
  return <article className="panel">
  <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-black">{match.homeTeam} <span className="text-slate-500">vs</span> {match.awayTeam}</h3><p className="text-xs text-slate-400">{formatDateTime(match.matchDate)}</p></div>{match.status === "FINISHED" && <p className="rounded-xl bg-green-500/10 px-3 py-2 font-black text-green-300">{match.homeScore} - {match.awayScore}</p>}</div>
  <div className="mt-4 space-y-2">{match.predictionsHidden ? <p className="text-sm text-slate-400">Las predicciones se revelan cuando comienza el partido.</p> : match.predictions?.length ? match.predictions.map((prediction) => <div className="flex justify-between rounded-xl bg-[#16243a] p-3 text-sm" key={prediction.id}><span>{prediction.user?.name}</span><strong>{prediction.predictedHome} - {prediction.predictedAway}{match.status === "FINISHED" && ` · ${prediction.points} puntos`}</strong></div>) : <p className="text-sm text-slate-400">Todavía no hay predicciones.</p>}</div>
</article>;
};
