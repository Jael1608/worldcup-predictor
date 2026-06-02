import axios from "axios";
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001/api" });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export const errorMessage = (error: unknown) => axios.isAxiosError(error) ? error.response?.data?.message || "No se pudo conectar con el servidor" : "Ocurrió un error";
