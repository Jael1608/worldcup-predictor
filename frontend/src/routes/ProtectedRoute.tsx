import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loading } from "../components/Loading";
export const ProtectedRoute = ({ admin = false }: { admin?: boolean }) => {
  const { loading, isAuthenticated, isAdmin } = useAuth();
  if (loading) return <Loading />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (admin && !isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
};
