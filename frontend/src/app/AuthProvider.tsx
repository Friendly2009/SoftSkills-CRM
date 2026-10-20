import { ApiError, errorMessage, request } from "@/shared/api/client";
import { Alert } from "@/shared/ui/Alert";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
export interface Profile {
  fullname: string;
  email: string;
  rank: number;
  companyName: string;
}
const AuthContext = createContext<{
  profile: Profile | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
} | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await request<{ success: boolean; data: Profile }>(
        "/getglobalinfo",
        { silent: true },
      );
      setProfile(result.data);
    } catch (e) {
      setProfile(null);
      if (!(e instanceof ApiError && e.status === 401))
        setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    const expired = () => setProfile(null);
    window.addEventListener("auth:expired", expired);
    return () => window.removeEventListener("auth:expired", expired);
  }, [refresh]);
  const logout = async () => {
    await request("/logout");
    localStorage.removeItem("sessionId");
    setProfile(null);
  };
  return (
    <AuthContext.Provider value={{ profile, loading, error, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("AuthProvider is required");
  return auth;
}
export function RequireAuth() {
  const { profile, loading, error, refresh } = useAuth();
  const location = useLocation();
  if (loading)
    return (
      <p className="ui-empty" role="status">
        Проверка сессии…
      </p>
    );
  if (error) return <Alert onRetry={() => void refresh()}>{error}</Alert>;
  return profile ? (
    <Outlet />
  ) : (
    <Navigate to="/authorization" state={{ from: location.pathname }} replace />
  );
}
