import { jsxDEV } from "react/jsx-dev-runtime";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Cashier } from "./src/screens/Cashier.tsx";
import { Receiving } from "./src/screens/Receiving.tsx";
import { Products } from "./src/screens/Products.tsx";
import { Reports } from "./src/screens/Reports.tsx";
import { SyncScreen } from "./src/screens/SyncScreen.tsx";
import { Login } from "./src/screens/Login.tsx";
import { Admin } from "./src/screens/Admin.tsx";
import { AuthProvider, useAuth } from "./src/auth/AuthContext.tsx";
import { I18nProvider, useT } from "./src/i18n/I18nContext.tsx";
import { migrateLegacyShopData } from "./src/db.ts";
import { flushSync, purgeCompletedQueue } from "./src/sync.ts";
import { apiFetch } from "./src/api.ts";
import { useSyncStatus } from "./src/useSyncStatus.ts";
function App() {
  const { user, checking, expired, logout } = useAuth(), { t, lang } = useT(), status = useSyncStatus();
  const [tab, setTab] = useState("cash"), [refresh, setRefresh] = useState(0), [registration, setRegistration] = useState(null), [localReady, setLocalReady] = useState(false);
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let alive = true;
    void navigator.serviceWorker.register("/sw.js").then(async (reg) => {
      const ready = await navigator.serviceWorker.ready;
      if (!alive) return;
      setRegistration(ready);
      const urls = performance.getEntriesByType("resource").map((entry) => entry.name);
      ready.active?.postMessage({ type: "CACHE_URLS", urls });
    }).catch(() => {
    });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (status.pending <= 0 || !registration) return;
    const sync = registration.sync;
    if (sync?.register) void sync.register("epicerie-sync").catch(() => {
    });
  }, [status.pending, registration]);
  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setLocalReady(false);
      return;
    }
    if (user.role !== "shop") {
      setLocalReady(true);
      return;
    }
    void migrateLegacyShopData(user.id, user.role).then(() => {
      if (!cancelled) setLocalReady(true);
    }).catch(() => {
      if (!cancelled) setLocalReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role]);
  useEffect(() => {
    if (!user || !localReady) return;
    void purgeCompletedQueue();
    if (user.role === "shop" && status.online) void flushSync().catch(() => {
    });
  }, [user?.id, localReady, status.online]);
  async function signOut() {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
    }
    logout();
    setTab("cash");
  }
  if (checking) return /* @__PURE__ */ jsxDEV("main", { className: "auth-page", children: /* @__PURE__ */ jsxDEV("div", { className: "auth-loading", children: t("common.loading") }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 26,
    columnNumber: 50
  }, this) }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 26,
    columnNumber: 22
  }, this);
  if (!user) return /* @__PURE__ */ jsxDEV(Login, { expired }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 27,
    columnNumber: 19
  }, this);
  if (user.role === "admin") return /* @__PURE__ */ jsxDEV(Admin, { onLogout: () => void signOut() }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 28,
    columnNumber: 33
  }, this);
  if (!localReady) return /* @__PURE__ */ jsxDEV("main", { className: "auth-page", children: /* @__PURE__ */ jsxDEV("div", { className: "auth-loading", children: t("common.loading") }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 29,
    columnNumber: 53
  }, this) }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 29,
    columnNumber: 25
  }, this);
  const tabs = [{ id: "cash", label: t("nav.cash"), symbol: "\u25A3" }, { id: "receive", label: t("nav.receive"), symbol: "\u2193" }, { id: "products", label: t("nav.products"), symbol: "\u25A4" }, { id: "reports", label: t("nav.reports"), symbol: "\u2301" }, { id: "sync", label: t("nav.sync"), symbol: "\u21BB" }];
  return /* @__PURE__ */ jsxDEV("div", { className: "app-shell", children: [
    /* @__PURE__ */ jsxDEV("header", { className: "topbar", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "brand-mark", children: "\xC9" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 31,
        columnNumber: 64
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "brand-copy", children: [
        /* @__PURE__ */ jsxDEV("strong", { children: user.shopName || t("app.name") }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 31,
          columnNumber: 127
        }, this),
        /* @__PURE__ */ jsxDEV("span", { children: t("brand.subtitle") }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 31,
          columnNumber: 174
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 31,
        columnNumber: 99
      }, this),
      /* @__PURE__ */ jsxDEV("button", { className: "connection", onClick: () => setTab("sync"), children: [
        /* @__PURE__ */ jsxDEV("i", { className: status.online ? "state-dot online" : "state-dot" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 31,
          columnNumber: 274
        }, this),
        /* @__PURE__ */ jsxDEV("span", { children: status.online ? t("common.online") : t("common.offline") }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 31,
          columnNumber: 335
        }, this),
        status.pendingSales > 0 && /* @__PURE__ */ jsxDEV("b", { children: [
          status.pendingSales,
          " ",
          t("sync.pendingSales")
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 31,
          columnNumber: 426
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 31,
        columnNumber: 214
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 31,
      columnNumber: 37
    }, this),
    !status.online && /* @__PURE__ */ jsxDEV("div", { className: "offline-session-banner", children: t("auth.offline") }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 32,
      columnNumber: 22
    }, this),
    /* @__PURE__ */ jsxDEV("main", { children: [
      tab === "cash" && /* @__PURE__ */ jsxDEV(Cashier, { onPaid: () => setRefresh((n) => n + 1) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 33,
        columnNumber: 44
      }, this),
      tab === "receive" && /* @__PURE__ */ jsxDEV(Receiving, {}, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 33,
        columnNumber: 107
      }, this),
      tab === "products" && /* @__PURE__ */ jsxDEV(Products, {}, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 33,
        columnNumber: 139
      }, this),
      tab === "reports" && /* @__PURE__ */ jsxDEV(Reports, {}, refresh, false, {
        fileName: "<stdin>",
        lineNumber: 33,
        columnNumber: 169
      }, this),
      tab === "sync" && /* @__PURE__ */ jsxDEV(SyncScreen, { onLogout: () => void signOut() }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 33,
        columnNumber: 209
      }, this)
    ] }, tab + refresh, true, {
      fileName: "<stdin>",
      lineNumber: 33,
      columnNumber: 5
    }, this),
    /* @__PURE__ */ jsxDEV("nav", { className: "bottom-nav", "aria-label": t("app.name"), children: tabs.map((item) => /* @__PURE__ */ jsxDEV("button", { className: tab === item.id ? "nav-item active" : "nav-item", onClick: () => setTab(item.id), children: [
      /* @__PURE__ */ jsxDEV("span", { className: "nav-symbol", children: item.symbol }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 34,
        columnNumber: 185
      }, this),
      /* @__PURE__ */ jsxDEV("span", { children: item.label }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 34,
        columnNumber: 234
      }, this),
      item.id === "sync" && status.pending > 0 && /* @__PURE__ */ jsxDEV("i", { className: "nav-badge" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 34,
        columnNumber: 296
      }, this)
    ] }, item.id, true, {
      fileName: "<stdin>",
      lineNumber: 34,
      columnNumber: 78
    }, this)) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 34,
      columnNumber: 5
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 31,
    columnNumber: 10
  }, this);
}
createRoot(document.getElementById("root")).render(/* @__PURE__ */ jsxDEV(I18nProvider, { children: /* @__PURE__ */ jsxDEV(AuthProvider, { children: /* @__PURE__ */ jsxDEV(App, {}, void 0, false, {
  fileName: "<stdin>",
  lineNumber: 37,
  columnNumber: 81
}) }, void 0, false, {
  fileName: "<stdin>",
  lineNumber: 37,
  columnNumber: 67
}) }, void 0, false, {
  fileName: "<stdin>",
  lineNumber: 37,
  columnNumber: 53
}));
