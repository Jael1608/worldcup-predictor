import { RankingHistory } from "../types";

const colors = ["#60a5fa", "#facc15", "#4ade80", "#f472b6", "#c084fc", "#fb923c", "#22d3ee", "#f87171"];

export const RankingHistoryChart = ({ history }: { history: RankingHistory }) => {
  if (!history.snapshots.length) return <section className="panel"><h2 className="text-xl font-black">Evolución del ranking</h2><p className="mt-3 text-sm text-slate-400">La gráfica aparecerá cuando se cargue el primer resultado.</p></section>;

  const width = 1000;
  const height = 430;
  const padding = { left: 58, right: 115, top: 30, bottom: 52 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const xOf = (index: number) => padding.left + (history.snapshots.length === 1 ? chartWidth / 2 : index * chartWidth / (history.snapshots.length - 1));
  const yOf = (position: number) => padding.top + (history.players.length === 1 ? chartHeight / 2 : (position - 1) * chartHeight / (history.players.length - 1));
  const tickIndexes = [...new Set([0, Math.floor((history.snapshots.length - 1) / 2), history.snapshots.length - 1])];

  return <section className="panel">
    <div>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">Historial completo</p>
      <h2 className="mt-1 text-xl font-black">Evolución del ranking</h2>
      <p className="mt-1 text-sm text-slate-400">La posición se recalcula después de cada partido finalizado.</p>
    </div>
    <div className="mt-4 overflow-x-auto">
      <svg className="min-w-[760px]" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Gráfico de evolución de posiciones">
        {history.players.map((_, index) => <g key={`grid-${index}`}>
          <line x1={padding.left} x2={width - padding.right} y1={yOf(index + 1)} y2={yOf(index + 1)} stroke="#30415d" strokeDasharray="5 8"/>
          <text x={padding.left - 18} y={yOf(index + 1) + 6} textAnchor="middle" fill="#94a3b8" fontSize="18">{index + 1}</text>
        </g>)}
        {tickIndexes.map((index) => <text key={`tick-${index}`} x={xOf(index)} y={height - 14} textAnchor="middle" fill="#94a3b8" fontSize="15">
          {new Date(history.snapshots[index].matchDate).toLocaleDateString()}
        </text>)}
        {history.players.map((player, playerIndex) => {
          const points = history.snapshots.map((snapshot, index) => {
            const position = snapshot.positions.find((item) => item.userId === player.userId)?.position ?? history.players.length;
            return `${xOf(index)},${yOf(position)}`;
          }).join(" ");
          const latestSnapshot = history.snapshots[history.snapshots.length - 1];
          const latestPosition = latestSnapshot.positions.find((item) => item.userId === player.userId)?.position ?? history.players.length;
          const color = colors[playerIndex % colors.length];
          return <g key={player.userId}>
            <polyline points={points} fill="none" stroke={color} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round"/>
            <circle cx={xOf(history.snapshots.length - 1)} cy={yOf(latestPosition)} r="6" fill={color}/>
            <text x={width - padding.right + 12} y={yOf(latestPosition) + 5} fill={color} fontSize="16" fontWeight="700">{player.name}</text>
          </g>;
        })}
      </svg>
    </div>
    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {history.players.slice().sort((a, b) => a.currentPosition - b.currentPosition).map((player, index) => <div className="flex items-center justify-between rounded-xl bg-[#16243a] px-3 py-2 text-sm" key={player.userId}>
        <span><strong style={{ color: colors[history.players.findIndex((item) => item.userId === player.userId) % colors.length] }}>#{player.currentPosition}</strong> {player.name}</span>
        <span className={player.movement > 0 ? "text-green-300" : player.movement < 0 ? "text-red-300" : "text-slate-400"}>
          {player.movement > 0 ? `Subió ${player.movement}` : player.movement < 0 ? `Bajó ${Math.abs(player.movement)}` : index === 0 && history.snapshots.length === 1 ? "Inicio" : "Sin cambio"}
        </span>
      </div>)}
    </div>
  </section>;
};
