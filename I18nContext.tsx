import { jsxDEV } from "react/jsx-dev-runtime";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translations } from "./translations.ts";
import { apiFetch } from "../api.ts";
const Context = createContext(null);
const storedLang = () => localStorage.getItem("epicerie.lang") === "ar" ? "ar" : "fr";
function I18nProvider({ children }) {
  const [lang, setLangState] = useState(storedLang);
  const setLang = (next, sync = true) => {
    setLangState(next);
    localStorage.setItem("epicerie.lang", next);
    if (sync && localStorage.getItem("epicerie.token")) void apiFetch("/auth/language", { method: "PATCH", body: JSON.stringify({ lang: next }) }).then(() => localStorage.removeItem("epicerie.langPending")).catch(() => localStorage.setItem("epicerie.langPending", next));
  };
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.title = translations[lang]["app.name"];
    const syncLanguage = (event) => {
      const preferred = event.detail;
      if (preferred === "fr" || preferred === "ar") setLang(preferred, false);
    };
    const retryPending = () => {
      const pending = localStorage.getItem("epicerie.langPending");
      if (navigator.onLine && pending && localStorage.getItem("epicerie.token")) void apiFetch("/auth/language", { method: "PATCH", body: JSON.stringify({ lang: pending }) }).then(() => localStorage.removeItem("epicerie.langPending")).catch(() => {
      });
    };
    window.addEventListener("auth:language", syncLanguage);
    window.addEventListener("online", retryPending);
    return () => {
      window.removeEventListener("auth:language", syncLanguage);
      window.removeEventListener("online", retryPending);
    };
  }, [lang]);
  const value = useMemo(() => ({ lang, dir: lang === "ar" ? "rtl" : "ltr", setLang, t: (key, vars = {}) => {
    let text = translations[lang][key] ?? translations.fr[key] ?? key;
    for (const [name, replacement] of Object.entries(vars)) text = text.replaceAll("{" + name + "}", String(replacement));
    return text;
  } }), [lang]);
  return /* @__PURE__ */ jsxDEV(Context.Provider, { value, children }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 21,
    columnNumber: 10
  }, this);
}
function useT() {
  const value = useContext(Context);
  if (!value) throw new Error("I18nProvider is missing");
  return value;
}
export {
  I18nProvider,
  useT
};
