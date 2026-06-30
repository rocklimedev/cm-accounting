import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("erp_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("erp_token");
    if (token) {
      api.get("/auth/me").then((res) => {
        setUser(res.data);
        localStorage.setItem("erp_user", JSON.stringify(res.data));
      }).catch(() => {}).finally(() => setLoading(false));
      api.get("/settings").then((res) => setSettings(res.data)).catch(() => {});
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("erp_token", res.data.access_token);
    localStorage.setItem("erp_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    api.get("/settings").then((r) => setSettings(r.data)).catch(() => {});
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem("erp_token");
    localStorage.removeItem("erp_user");
    setUser(null);
    window.location.href = "/login";
  };

  const isSuperAdmin = user?.role === "super_admin";
  const isAdmin = user?.role === "super_admin" || user?.role === "admin";
  const can = (perm) => {
    if (isSuperAdmin) return true;
    if (user?.role === "admin") return perm !== "manage_users" && perm !== "manage_permissions";
    return (user?.permissions || []).includes(perm);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, isAdmin, isSuperAdmin, can, settings }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
