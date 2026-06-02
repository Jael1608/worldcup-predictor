import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { errorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
export const LoginPage = () => {
  const { login, isAuthenticated } = useAuth(); const navigate = useNavigate();
  const [username, setUsername] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  if (isAuthenticated) return <Navigate to="/" replace />;
  const submit = async (event: FormEvent) => { event.preventDefault(); setSaving(true); setError(""); try { await login(username, password); navigate("/"); } catch (e) { setError(errorMessage(e)); } finally { setSaving(false); } };
  return <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,_#173b73,_#07111f_55%)] px-4"><form className="panel w-full max-w-sm p-6" onSubmit={submit}><p className="text-xs font-black uppercase tracking-[0.25em] text-blue-300">Grupo privado</p><h1 className="mt-2 text-3xl font-black">Quiniela<br/><span className="text-blue-400">Mundial 2026</span></h1><p className="mt-3 text-sm text-slate-400">Ingresa para cargar tus resultados y seguir la tabla.</p><div className="mt-6 grid gap-3"><input required placeholder="Usuario" value={username} onChange={(e) => setUsername(e.target.value)}/><input required type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)}/><button className="button-primary" disabled={saving}>{saving ? "Ingresando..." : "Ingresar"}</button>{error && <p className="text-sm text-red-300">{error}</p>}</div></form></main>;
};
