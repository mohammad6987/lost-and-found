import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import TopBar from "./TopBar";
import AppFooter from "./AppFooter";
import "./AppLayout.css";
import { useAuth } from "../context/AuthContext";

function AuthSync() {
  const location = useLocation();
  const { refresh } = useAuth();

  useEffect(() => {
    refresh();
  }, [location.pathname, refresh]);

  return null;
}

export default function AppLayout() {
  return (
    <AuthProvider>
      <div className="app-shell">
        <TopBar />
        <AuthSync />
        <div className="app-shell__content">
          <Outlet />
        </div>
        <AppFooter />
      </div>
    </AuthProvider>
  );
}
