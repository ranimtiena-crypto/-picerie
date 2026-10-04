import { jsxDEV } from "react/jsx-dev-runtime";
import { useState } from "react";
import { apiFetch, ApiError, saveSession } from "../api.ts";
import { useAuth } from "../auth/AuthContext.tsx";
import { useT } from "../i18n/I18nContext.tsx";
function Login({ expired = false }) {
  const { t, lang, setLang } = useT(), auth = useAuth();
  const [email, setEmail] = useState(""), [password, setPassword] = useState(""), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ email, password }), unauthenticated: true });
      const user = { ...result.user, preferredLang: lang };
      saveSession(result.token, user);
      if (lang !== result.user.preferredLang) try {
        await apiFetch("/auth/language", { method: "PATCH", body: JSON.stringify({ lang }) });
        localStorage.removeItem("epicerie.langPending");
      } catch {
        localStorage.setItem("epicerie.langPending", lang);
      }
      setLang(lang, false);
      auth.login(result.token, user);
    } catch (reason) {
      const code = reason instanceof ApiError ? reason.code : "UNKNOWN";
      setError(t("errors." + code));
    } finally {
      setBusy(false);
    }
  }
  return /* @__PURE__ */ jsxDEV("main", { className: "auth-page", children: /* @__PURE__ */ jsxDEV("section", { className: "auth-card", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "brand-mark auth-mark", children: "\xC9" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 11,
      columnNumber: 69
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "screen-title", children: [
      /* @__PURE__ */ jsxDEV("span", { className: "eyebrow", children: t("brand.subtitle") }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 11,
        columnNumber: 144
      }, this),
      /* @__PURE__ */ jsxDEV("h1", { children: t("app.name") }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 11,
        columnNumber: 198
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 11,
      columnNumber: 114
    }, this),
    /* @__PURE__ */ jsxDEV("label", { className: "language-switch", children: [
      t("auth.language"),
      /* @__PURE__ */ jsxDEV("select", { value: lang, onChange: (event) => setLang(event.target.value, false), children: [
        /* @__PURE__ */ jsxDEV("option", { value: "fr", children: "Fran\xE7ais" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 11,
          columnNumber: 370
        }, this),
        /* @__PURE__ */ jsxDEV("option", { value: "ar", children: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 11,
          columnNumber: 406
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 11,
        columnNumber: 283
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 11,
      columnNumber: 228
    }, this),
    (expired || error) && /* @__PURE__ */ jsxDEV("div", { className: "notice warning", children: expired ? t("auth.expired") : error }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 11,
      columnNumber: 477
    }, this),
    /* @__PURE__ */ jsxDEV("form", { onSubmit: submit, children: [
      /* @__PURE__ */ jsxDEV("label", { children: [
        t("auth.email"),
        /* @__PURE__ */ jsxDEV("input", { required: true, type: "email", autoComplete: "username", value: email, onChange: (event) => setEmail(event.target.value), dir: "ltr" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 11,
          columnNumber: 597
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 11,
        columnNumber: 573
      }, this),
      /* @__PURE__ */ jsxDEV("label", { children: [
        t("auth.password"),
        /* @__PURE__ */ jsxDEV("input", { required: true, type: "password", autoComplete: "current-password", value: password, onChange: (event) => setPassword(event.target.value), dir: "ltr" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 11,
          columnNumber: 759
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 11,
        columnNumber: 732
      }, this),
      /* @__PURE__ */ jsxDEV("button", { className: "button primary full", disabled: busy, children: busy ? t("common.loading") : t("auth.signIn") }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 11,
        columnNumber: 911
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 11,
      columnNumber: 549
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 11,
    columnNumber: 38
  }, this) }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 11,
    columnNumber: 10
  }, this);
}
export {
  Login
};
