import { Standing } from "../types";
export const StandingTable = ({ standings, movements = {} }: { standings: Standing[]; movements?: Record<number, number> }) => <div className="panel overflow-x-auto">
  <table className="min-w-full text-sm">
    <thead className="text-left text-xs uppercase tracking-wider text-slate-400"><tr><th className="p-3">#</th><th className="p-3">Jugador</th><th className="p-3">Cambio</th><th className="p-3">Puntos</th><th className="p-3">Campeón</th><th className="p-3">Exactos</th><th className="p-3">Ganadores</th><th className="p-3">Predicciones</th></tr></thead>
    <tbody>{standings.map((standing, index) => <tr className={`border-t border-[#24344d] ${index === 0 ? "bg-yellow-400/10 text-yellow-100" : ""}`} key={standing.userId}>
      <td className="p-3 font-black">{index + 1}</td><td className="p-3 font-semibold">{standing.name}</td><td className={`p-3 font-bold ${movements[standing.userId] > 0 ? "text-green-300" : movements[standing.userId] < 0 ? "text-red-300" : "text-slate-500"}`}>{movements[standing.userId] > 0 ? `↑ ${movements[standing.userId]}` : movements[standing.userId] < 0 ? `↓ ${Math.abs(movements[standing.userId])}` : "—"}</td><td className="p-3 font-black">{standing.totalPoints}</td><td className="p-3">{standing.championBonus ? `+${standing.championBonus}` : "-"}</td><td className="p-3">{standing.exactScores}</td><td className="p-3">{standing.winnerHits}</td><td className="p-3">{standing.predictionsCount}</td>
    </tr>)}</tbody>
  </table>
</div>;
