import { jsxDEV } from "react/jsx-dev-runtime";
import { useEffect, useState } from "react";
import { db } from "../db.ts";
import { useSyncStatus } from "../useSyncStatus.ts";
import { useT } from "../i18n/I18nContext.tsx";
import { formatDate, formatNumber } from "../i18n/format.ts";
function SyncScreen({ onLogout }) {
  const status = useSyncStatus(), { t, lang } = useT();
  const [items, setItems] = useState([]);
  async function load() {
    setItems(await db.syncQueue.orderBy("createdAt").reverse().limit(40).toArray());
  }
  useEffect(() => {
    void load();
    const timer = setInterval(load, 1600);
    return () => clearInterval(timer);
  }, [status.pending, status.errors]);
  return /* @__PURE__ */ jsxDEV("section", { className: "screen sync-screen", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "screen-title", children: [
      /* @__PURE__ */ jsxDEV("span", { className: "eyebrow", children: t("sync.eyebrow") }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 10,
        columnNumber: 80
      }, this),
      /* @__PURE__ */ jsxDEV("h1", { children: t("sync.title") }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 10,
        columnNumber: 132
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 10,
      columnNumber: 50
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "sync-summary", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "sync-count", children: [
        /* @__PURE__ */ jsxDEV("strong", { children: formatNumber(status.pending, lang) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 10,
          columnNumber: 222
        }, this),
        /* @__PURE__ */ jsxDEV("span", { children: t("sync.pending") }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 10,
          columnNumber: 274
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 10,
        columnNumber: 194
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "sync-divider" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 10,
        columnNumber: 312
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "sync-count error-count", children: [
        /* @__PURE__ */ jsxDEV("strong", { children: formatNumber(status.errors, lang) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 10,
          columnNumber: 383
        }, this),
        /* @__PURE__ */ jsxDEV("span", { children: t("sync.errors") }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 10,
          columnNumber: 434
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 10,
        columnNumber: 343
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 10,
      columnNumber: 164
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "sync-state", children: [
      /* @__PURE__ */ jsxDEV("span", { className: status.online ? "state-dot online" : "state-dot" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 10,
        columnNumber: 505
      }, this),
      /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("strong", { children: status.online ? t("sync.available") : t("common.offline") }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 10,
          columnNumber: 574
        }, this),
        /* @__PURE__ */ jsxDEV("span", { children: status.online ? t("sync.auto") : t("sync.local") }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 10,
          columnNumber: 646
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 10,
        columnNumber: 569
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 10,
      columnNumber: 477
    }, this),
    /* @__PURE__ */ jsxDEV("button", { className: "button primary full", disabled: !status.online || status.syncing || !status.pending, onClick: () => void status.syncNow(), children: status.syncing ? t("sync.working") : t("sync.now") }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 10,
      columnNumber: 717
    }, this),
    status.lastError && /* @__PURE__ */ jsxDEV("div", { className: "notice warning", children: t("errors." + status.lastError.split("|")[0], { product: status.lastError.split("|")[1] ?? "" }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 10,
      columnNumber: 928
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "section-heading queue-heading", children: [
      /* @__PURE__ */ jsxDEV("h2", { children: t("sync.activity") }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 10,
        columnNumber: 1104
      }, this),
      /* @__PURE__ */ jsxDEV("span", { children: [
        formatNumber(items.length, lang),
        " ",
        t("sync.elements")
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 10,
        columnNumber: 1133
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 10,
      columnNumber: 1057
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "queue-list", children: [
      items.map((item) => /* @__PURE__ */ jsxDEV("article", { className: "queue-row", children: [
        /* @__PURE__ */ jsxDEV("span", { className: "queue-dot " + item.status }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 10,
          columnNumber: 1298
        }, this),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("strong", { children: item.action === "sale.create" ? t("sync.sale") : item.action === "movement.create" ? t("sync.movement") : t("sync.product") }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 10,
            columnNumber: 1347
          }, this),
          /* @__PURE__ */ jsxDEV("span", { children: formatDate(item.createdAt, lang) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 10,
            columnNumber: 1477
          }, this),
          item.error && /* @__PURE__ */ jsxDEV("small", { className: "error-text", children: t("errors." + item.error.split("|")[0], { product: item.error.split("|")[1] ?? "" }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 10,
            columnNumber: 1536
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 10,
          columnNumber: 1342
        }, this),
        /* @__PURE__ */ jsxDEV("span", { className: "queue-status", children: item.status === "done" ? t("sync.sent") : item.status === "failed" ? t("sync.failed") : item.status === "syncing" ? t("sync.running") : t("sync.waiting") }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 10,
          columnNumber: 1659
        }, this)
      ] }, item.id, true, {
        fileName: "<stdin>",
        lineNumber: 10,
        columnNumber: 1253
      }, this)),
      !items.length && /* @__PURE__ */ jsxDEV("div", { className: "empty-state compact", children: t("sync.done") }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 10,
        columnNumber: 1862
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 10,
      columnNumber: 1206
    }, this),
    /* @__PURE__ */ jsxDEV("button", { className: "button secondary full logout-button", onClick: onLogout, children: t("common.logout") }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 10,
      columnNumber: 1928
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 10,
    columnNumber: 10
  }, this);
}
export {
  SyncScreen
};
