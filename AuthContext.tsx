import { jsxDEV } from "react/jsx-dev-runtime";
import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch, clearSession, savedUser, saveSession } from "../api.ts";
const AuthContext = createContext(null);
function AuthProvider({ children }) {
  const [user, setUser] = useState(() => savedUser());
  const [checking, setChecking] = useState(true);
  const [expired, setExpired] = useState(false);
  const logout = (wasExpired = false) => {
    clearSession();
    setUser(null);
    setExpired(wasExpired);
  };
  const login = (token, next) => {
    saveSession(token, next);
    setUser(next);
    setExpired(false);
    window.dispatchEvent(new CustomEvent("auth:language", { detail: next.preferredLang }));
    window.location.reload();
  };
  useEffect(() => {
    let alive = true;
    const validate = async () => {
      if (!navigator.onLine || !localStorage.getItem("epicerie.token")) {
        if (alive) setChecking(false);
        return;
      }
      try {
        const next = await apiFetch("/auth/me");
        if (!alive) return;
        const pending = localStorage.getItem("epicerie.langPending");
        const preferred = pending === "fr" || pending === "ar" ? pending : next.preferredLang;
        const effective = { ...next, preferredLang: preferred };
        localStorage.setItem("epicerie.user", JSON.stringify(effective));
        setUser(effective);
        setExpired(false);
        window.dispatchEvent(new CustomEvent("auth:language", { detail: preferred }));
        if (pending === preferred) void apiFetch("/auth/language", { method: "PATCH", body: JSON.stringify({ lang: preferred }) }).then(() => localStorage.removeItem("epicerie.langPending")).catch(() => {
        });
      } catch {
      } finally {
        if (alive) setChecking(false);
      }
    };
    const onOnline = () => {
      setChecking(true);
      void validate();
    };
    const onExpired = () => logout(true);
    void validate();
    window.addEventListener("online", onOnline);
    window.addEventListener("auth:expired", onExpired);
    return () => {
      alive = false;
      window.removeEventListener("online", onOnline);
      window.removeEventListener("auth:expired", onExpired);
    };
  }, []);
  return /* @__PURE__ */ jsxDEV(AuthContext.Provider, { value: { user, checking, expired, login, logout }, children }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 23,
    columnNumber: 10
  }, this);
}
function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider is missing");
  return value;
}
export {
  AuthProvider,
  useAuth
};
