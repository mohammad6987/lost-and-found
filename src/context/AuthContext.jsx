import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { clearAuth, getUserData, isAuthenticated } from "../services/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(() => isAuthenticated());
  const [user, setUser] = useState(() => (isAuthenticated() ? getUserData() : null));

  const refresh = useCallback(() => {
    const authed = isAuthenticated();
    setIsLoggedIn(authed);
    setUser(authed ? getUserData() : null);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    refresh();
  }, [refresh]);

  useEffect(() => {
    refresh();
    const handleStorage = () => refresh();
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [refresh]);

  const value = useMemo(
    () => ({ isLoggedIn, user, refresh, logout }),
    [isLoggedIn, user, refresh, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
