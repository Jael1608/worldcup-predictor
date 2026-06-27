import { FormEvent, useEffect, useMemo, useState } from "react";
import { api, errorMessage } from "../api/client";
import { AdminMatchForm } from "../components/AdminMatchForm";
import { KnockoutSyncResponse, Match, OfficialChampionState, ResultPreview, ResultPreviewResponse, UnmatchedResult } from "../types";

const sample = `{"matches":[{"externalId":"match-001","homeTeam":"Alemania","awayTeam":"Curazao","matchDate":"2026-06-15T18:00:00.000Z","stage":"GROUP","groupName":"Grupo A"}]}`;

export const AdminPage = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [message, setMessage] = useState("");
  const [json, setJson] = useState(sample);
  const [officialChampion, setOfficialChampion] = useState<OfficialChampionState>();
  const [championTeam, setChampionTeam] = useState("");
  const [resultPreview, setResultPreview] = useState<ResultPreview[]>([]);
  const [unmatchedResults, setUnmatchedResults] = useState<UnmatchedResult[]>([]);
  const [selectedResults, setSelectedResults] = useState<number[]>([]);
  const [searchingResults, setSearchingResults] = useState(false);
  const [syncingKnockout, setSyncingKnockout] = useState(false);
  const [resultApiMessage, setResultApiMessage] = useState("");
  const [matchSearch, setMatchSearch] = useState("");
  const [user, setUser] = useState({ name: "", username: "", password: "", role: "PLAYER" });
  const [result, setResult] = useState({ matchId: "", homeScore: "", awayScore: "" });

  const load = async () => {
    const { data } = await api.get<Match[]>("/matches");
    setMatches(data);
  };
  const loadChampion = async () => {
    const { data } = await api.get<OfficialChampionState>("/admin/official-champion");
    setOfficialChampion(data);
    setChampionTeam(data.team ?? "");
  };
  useEffect(() => { void load(); void loadChampion(); }, []);

  const pendingMatches = useMemo(() => matches
    .filter((match) => match.status !== "FINISHED" && match.homeScore === null && match.awayScore === null)
    .filter((match) => `${match.homeTeam} ${match.awayTeam}`.toLowerCase().includes(matchSearch.trim().toLowerCase()))
    .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()), [matches, matchSearch]);

  const run = async (action: () => Promise<unknown>, success: string) => {
    setMessage("");
    try {
      await action();
      setMessage(success);
      await load();
    } catch (error) {
      setMessage(errorMessage(error));
    }
  };

  const createUser = (event: FormEvent) => {
    event.preventDefault();
    void run(() => api.post("/users", user), "Usuario creado");
  };
  const saveResult = (event: FormEvent) => {
    event.preventDefault();
    void run(async () => {
      await api.patch(`/matches/${result.matchId}/result`, { homeScore: Number(result.homeScore), awayScore: Number(result.awayScore) });
      setResult({ matchId: "", homeScore: "", awayScore: "" });
    }, "Resultado guardado, puntos recalculados y cruces actualizados");
  };
  const syncKnockoutBracket = async () => {
    setSyncingKnockout(true);
    setMessage("");
    try {
      const { data } = await api.post<KnockoutSyncResponse>("/admin/sync-knockout-bracket");
      const detail = data.updated
        ? `Cruces actualizados: ${data.updated} partido(s).`
        : data.completedGroups < 12
          ? `No hay cruces nuevos todavía. Grupos completos: ${data.completedGroups}/12.`
          : data.thirdPlaceSlotsReady
            ? "Los cruces ya estaban al día."
            : "Todavía no se pudieron ubicar los mejores terceros.";
      setMessage(detail);
      await load();
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setSyncingKnockout(false);
    }
  };
  const searchResults = async () => {
    setSearchingResults(true);
    setMessage("");
    setResultApiMessage("");
    try {
      const { data } = await api.get<ResultPreviewResponse>("/admin/results-preview");
      const newResults = data.results.filter((item) => !item.alreadyLoaded);
      setResultPreview(data.results);
      setUnmatchedResults(data.unmatchedResults);
      setSelectedResults(newResults.map((item) => item.matchId));
      const statuses = Object.entries(data.statusSummary).map(([status, count]) => `${status}: ${count}`).join(", ");
      const detail = newResults.length
        ? `${newResults.length} resultado(s) nuevo(s) listo(s) para confirmar.`
        : data.results.length
          ? "Todos los resultados encontrados ya estaban cargados."
          : data.externalCount
            ? `La API trajo ${data.externalCount} resultado(s) finalizado(s), pero no coincidieron con el fixture.`
            : data.apiMatchCount
              ? `La API respondió con ${data.apiMatchCount} partido(s), pero ninguno figura finalizado. Estados: ${statuses}.`
              : "La API respondió, pero no devolvió partidos para este torneo.";
      setResultApiMessage(detail);
      setMessage(detail);
    } catch (error) {
      const detail = errorMessage(error);
      setUnmatchedResults([]);
      setResultApiMessage(detail);
      setMessage(detail);
    } finally {
      setSearchingResults(false);
    }
  };
  const toggleResult = (matchId: number) => setSelectedResults((current) =>
    current.includes(matchId) ? current.filter((id) => id !== matchId) : [...current, matchId]
  );

  return <>
    <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">Gestión</p>
    <h1 className="mt-1 text-3xl font-black">Panel admin</h1>
    {message && <p className="my-4 rounded-xl bg-blue-500/10 p-3 text-sm text-blue-200">{message}</p>}

    <section className="mt-5 grid gap-4 lg:grid-cols-2">
      <div className="panel lg:col-span-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">Operación diaria</p>
            <h2 className="mt-1 text-xl font-black">Resultados desde API</h2>
            <p className="mt-2 text-sm text-slate-400">Busca marcadores finalizados, revisa los nuevos y confírmalos.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="button-secondary" disabled={searchingResults} onClick={() => void searchResults()}>{searchingResults ? "Buscando..." : "Buscar resultados ahora"}</button>
            <button className="button-secondary" disabled={syncingKnockout} onClick={() => void syncKnockoutBracket()}>{syncingKnockout ? "Actualizando..." : "Actualizar cruces"}</button>
            <button className="button-primary" disabled={!selectedResults.length} onClick={() => void run(async () => {
              await api.post("/admin/results-apply", { matchIds: selectedResults });
              setResultPreview([]);
              setUnmatchedResults([]);
              setSelectedResults([]);
              setResultApiMessage("");
            }, "Resultados aplicados, puntos recalculados y cruces actualizados")}>Confirmar nuevos ({selectedResults.length})</button>
          </div>
        </div>
        {resultApiMessage && <p className="mt-3 rounded-xl bg-[#16243a] p-3 text-sm text-slate-200">{resultApiMessage}</p>}
        {unmatchedResults.length > 0 && <div className="mt-4 rounded-xl border border-yellow-400/30 bg-yellow-400/10 p-3 text-sm text-yellow-100">
          <strong>Resultados sin coincidencia:</strong>
          <div className="mt-2 space-y-1">{unmatchedResults.map((item) => <p key={`${item.externalId ?? ""}-${item.homeTeam}-${item.awayTeam}`}>{item.homeTeam} {item.homeScore} - {item.awayScore} {item.awayTeam}{item.matchDate ? ` · ${new Date(item.matchDate).toLocaleString()}` : ""}</p>)}</div>
        </div>}
        {resultPreview.length > 0 && <div className="mt-4 max-h-96 space-y-2 overflow-auto">
          {resultPreview.map((item) => <label key={item.matchId} className={`flex items-center justify-between gap-3 rounded-xl p-3 text-sm ${item.alreadyLoaded ? "bg-[#111d2d] opacity-60" : "cursor-pointer bg-[#16243a]"}`}>
            <span><input className="mr-2" type="checkbox" checked={selectedResults.includes(item.matchId)} disabled={item.alreadyLoaded} onChange={() => toggleResult(item.matchId)}/>{item.homeTeam} {item.homeScore} - {item.awayScore} {item.awayTeam}<span className="ml-2 text-xs text-slate-400">{new Date(item.matchDate).toLocaleDateString()}</span></span>
            <strong className={item.alreadyLoaded ? "text-green-300" : "text-blue-300"}>{item.alreadyLoaded ? "Ya cargado" : item.currentScore ? `Actual: ${item.currentScore}` : "Nuevo"}</strong>
          </label>)}
        </div>}
      </div>

      <div className="panel lg:col-span-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Cargar resultado oficial</h2>
            <p className="mt-1 text-sm text-slate-400">Solo aparecen partidos que todavía no tienen resultado.</p>
          </div>
          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-sm font-bold text-blue-200">{pendingMatches.length} pendientes</span>
        </div>
        <form className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_140px_140px_auto]" onSubmit={saveResult}>
          <input placeholder="Buscar por selección" value={matchSearch} onChange={(event) => setMatchSearch(event.target.value)}/>
          <select required value={result.matchId} onChange={(event) => setResult({ ...result, matchId: event.target.value })}>
            <option value="">Seleccionar partido pendiente</option>
            {pendingMatches.map((match) => <option key={match.id} value={match.id}>{new Date(match.matchDate).toLocaleString()} · {match.homeTeam} vs {match.awayTeam}</option>)}
          </select>
          <input required min="0" type="number" placeholder="Goles local" value={result.homeScore} onChange={(event) => setResult({ ...result, homeScore: event.target.value })}/>
          <input required min="0" type="number" placeholder="Goles visitante" value={result.awayScore} onChange={(event) => setResult({ ...result, awayScore: event.target.value })}/>
          <button className="button-primary">Guardar</button>
        </form>
        {!pendingMatches.length && <p className="mt-3 text-sm text-green-300">{matchSearch ? "No hay pendientes que coincidan con la búsqueda." : "Todos los partidos cargados tienen resultado."}</p>}
      </div>

      <div className="panel lg:col-span-2">
        <h2 className="text-lg font-black">Campeón oficial</h2>
        <p className="my-2 text-sm text-slate-400">Quienes lo predijeron reciben {officialChampion?.bonusPoints ?? 15} puntos en la tabla general.</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <select className="min-w-0 flex-1" value={championTeam} onChange={(event) => setChampionTeam(event.target.value)}><option value="">Seleccionar selección</option>{officialChampion?.teams.map((team) => <option key={team}>{team}</option>)}</select>
          <button className="button-primary" disabled={!championTeam} onClick={() => void run(async () => { await api.put("/admin/official-champion", { team: championTeam }); await loadChampion(); }, "Campeón oficial guardado")}>Guardar campeón</button>
          <button className="button-secondary" disabled={!officialChampion?.team} onClick={() => void run(async () => { await api.delete("/admin/official-champion"); await loadChampion(); }, "Campeón oficial eliminado")}>Limpiar</button>
        </div>
      </div>

      <div className="panel">
        <h2 className="mb-4 text-lg font-black">Crear usuario</h2>
        <form className="grid gap-3" onSubmit={createUser}>
          <input required placeholder="Nombre" value={user.name} onChange={(event) => setUser({ ...user, name: event.target.value })}/>
          <input required placeholder="Usuario" value={user.username} onChange={(event) => setUser({ ...user, username: event.target.value })}/>
          <input required minLength={6} type="password" placeholder="Contraseña" value={user.password} onChange={(event) => setUser({ ...user, password: event.target.value })}/>
          <select value={user.role} onChange={(event) => setUser({ ...user, role: event.target.value })}><option value="PLAYER">Jugador</option><option value="ADMIN">Administrador</option></select>
          <button className="button-primary">Crear usuario</button>
        </form>
      </div>

      <div className="panel">
        <h2 className="mb-4 text-lg font-black">Crear partido</h2>
        <AdminMatchForm onCreated={load}/>
      </div>

      <div className="panel">
        <h2 className="mb-4 text-lg font-black">Importar partidos por JSON</h2>
        <textarea className="min-h-40 w-full font-mono text-xs" value={json} onChange={(event) => setJson(event.target.value)}/>
        <button className="button-primary mt-3 w-full" onClick={() => void run(() => api.post("/admin/import-matches-json", JSON.parse(json)), "Importación completada")}>Importar JSON</button>
      </div>

      <div className="panel">
        <h2 className="text-lg font-black">Mantenimiento</h2>
        <p className="my-2 text-sm text-slate-400">Restaura el fixture oficial o recalcula los puntos.</p>
        <div className="flex flex-wrap gap-2">
          <button className="button-secondary" onClick={() => void run(() => api.post("/admin/import-matches"), "Fixture oficial importado")}>Importar fixture oficial</button>
          <button className="button-secondary" onClick={() => void run(() => api.post("/admin/recalculate-points"), "Puntos recalculados")}>Recalcular puntos</button>
        </div>
      </div>
    </section>
  </>;
};
