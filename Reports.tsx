import { jsxDEV } from "react/jsx-dev-runtime";
import { useEffect, useState } from "react";
import { db } from "../db.ts";
import { useT } from "../i18n/I18nContext.tsx";
import { formatDate, formatMoney, formatNumber } from "../i18n/format.ts";
function rangeFor(day, period) {
  const start = /* @__PURE__ */ new Date(day + "T00:00:00"), end = new Date(start);
  if (period === "day") end.setDate(end.getDate() + 1);
  if (period === "week") {
    const weekday = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - weekday);
    end.setTime(start.getTime());
    end.setDate(end.getDate() + 7);
  }
  if (period === "month") {
    start.setDate(1);
    end.setFullYear(start.getFullYear(), start.getMonth() + 1, 1);
  }
  return { start: start.toISOString(), end: end.toISOString() };
}
function Reports() {
  const { t, lang } = useT();
  const [date, setDate] = useState((/* @__PURE__ */ new Date()).toLocaleDateString("sv-SE")), [period, setPeriod] = useState("day"), [summary, setSummary] = useState({ revenue: 0, margin: 0, count: 0, top: [] });
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const range = rangeFor(date, period);
      const sales = await db.sales.where("createdAt").between(range.start, range.end, true, false).toArray();
      const saleIds = sales.map((sale) => sale.id).filter(Boolean);
      const items = saleIds.length ? await db.saleItems.where("saleId").anyOf(saleIds).toArray() : [];
      const products = new Map((await db.products.toArray()).map((product) => [product.id, lang === "ar" && product.nameAr ? product.nameAr : product.name]));
      const totals = /* @__PURE__ */ new Map();
      for (const item of items) {
        const row = totals.get(item.productId) ?? { name: products.get(item.productId) ?? "", qty: 0, total: 0 };
        row.qty += item.qty;
        row.total += item.qty * item.unitPrice;
        totals.set(item.productId, row);
      }
      if (!cancelled) setSummary({ revenue: sales.reduce((sum, sale) => sum + sale.total, 0), margin: items.reduce((sum, item) => sum + (item.unitPrice - item.cost) * item.qty, 0), count: sales.length, top: [...totals.values()].sort((a, b) => b.qty - a.qty).slice(0, 5) });
    })();
    return () => {
      cancelled = true;
    };
  }, [date, period, lang]);
  async function exportCsv() {
    const range = rangeFor(date, period), sales = await db.sales.where("createdAt").between(range.start, range.end, true, false).toArray(), saleIds = sales.map((sale) => sale.id).filter(Boolean), bySale = new Map(sales.map((sale) => [sale.id, sale])), items = saleIds.length ? await db.saleItems.where("saleId").anyOf(saleIds).toArray() : [], products = new Map((await db.products.toArray()).map((p) => [p.id, lang === "ar" && p.nameAr ? p.nameAr : p.name]));
    const rows = [[t("reports.date"), t("reports.saleId"), t("products.title"), t("reports.quantity"), t("receive.price"), t("receive.cost"), t("cashier.total"), t("cashier.payment")], ...items.map((item) => {
      const sale = bySale.get(item.saleId);
      return [formatDate(sale.createdAt, lang), sale.uuid, products.get(item.productId) ?? "", String(item.qty), String(item.unitPrice), String(item.cost), String(item.qty * item.unitPrice), sale.paymentMethod];
    })];
    const csv = "\uFEFF" + rows.map((row) => row.map((cell) => '"' + cell.replaceAll('"', '""') + '"').join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "epicerie-" + date + ".csv";
    link.click();
    URL.revokeObjectURL(url);
  }
  const periodLabel = period === "day" ? t("reports.today") : period === "week" ? t("reports.thisWeek") : t("reports.thisMonth");
  return /* @__PURE__ */ jsxDEV("section", { className: "screen reports-screen", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "screen-title", children: [
      /* @__PURE__ */ jsxDEV("span", { className: "eyebrow", children: t("reports.eyebrow") }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 12,
        columnNumber: 83
      }, this),
      /* @__PURE__ */ jsxDEV("h1", { children: t("reports.title") }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 12,
        columnNumber: 138
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 12,
      columnNumber: 53
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "report-controls", children: [
      /* @__PURE__ */ jsxDEV("input", { "aria-label": t("reports.title"), type: "date", value: date, onChange: (event) => setDate(event.target.value) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 12,
        columnNumber: 206
      }, this),
      /* @__PURE__ */ jsxDEV("select", { value: period, onChange: (event) => setPeriod(event.target.value), children: [
        /* @__PURE__ */ jsxDEV("option", { value: "day", children: t("reports.day") }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 12,
          columnNumber: 402
        }, this),
        /* @__PURE__ */ jsxDEV("option", { value: "week", children: t("reports.week") }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 12,
          columnNumber: 449
        }, this),
        /* @__PURE__ */ jsxDEV("option", { value: "month", children: t("reports.month") }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 12,
          columnNumber: 498
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 12,
        columnNumber: 319
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 12,
      columnNumber: 173
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "metric-grid", children: [
      /* @__PURE__ */ jsxDEV("article", { className: "metric-card main-metric", children: [
        /* @__PURE__ */ jsxDEV("span", { children: t("reports.revenue") }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 12,
          columnNumber: 638
        }, this),
        /* @__PURE__ */ jsxDEV("strong", { children: formatMoney(summary.revenue, lang) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 12,
          columnNumber: 673
        }, this),
        /* @__PURE__ */ jsxDEV("em", { children: periodLabel }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 12,
          columnNumber: 725
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 12,
        columnNumber: 593
      }, this),
      /* @__PURE__ */ jsxDEV("article", { className: "metric-card", children: [
        /* @__PURE__ */ jsxDEV("span", { children: t("reports.sales") }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 12,
          columnNumber: 790
        }, this),
        /* @__PURE__ */ jsxDEV("strong", { children: formatNumber(summary.count, lang) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 12,
          columnNumber: 823
        }, this),
        /* @__PURE__ */ jsxDEV("em", { children: t("reports.transactions") }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 12,
          columnNumber: 874
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 12,
        columnNumber: 757
      }, this),
      /* @__PURE__ */ jsxDEV("article", { className: "metric-card", children: [
        /* @__PURE__ */ jsxDEV("span", { children: t("reports.margin") }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 12,
          columnNumber: 953
        }, this),
        /* @__PURE__ */ jsxDEV("strong", { children: formatMoney(summary.margin, lang) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 12,
          columnNumber: 987
        }, this),
        /* @__PURE__ */ jsxDEV("em", { children: t("reports.marginHint") }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 12,
          columnNumber: 1038
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 12,
        columnNumber: 920
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 12,
      columnNumber: 564
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "section-heading", children: [
      /* @__PURE__ */ jsxDEV("h2", { children: t("reports.top") }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 12,
        columnNumber: 1121
      }, this),
      /* @__PURE__ */ jsxDEV("span", { children: t("reports.quantity") }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 12,
        columnNumber: 1148
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 12,
      columnNumber: 1088
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "top-list", children: [
      summary.top.map((item, index) => /* @__PURE__ */ jsxDEV("div", { className: "top-row", children: [
        /* @__PURE__ */ jsxDEV("span", { className: "rank", children: formatNumber(index + 1, lang) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 12,
          columnNumber: 1294
        }, this),
        /* @__PURE__ */ jsxDEV("strong", { children: item.name }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 12,
          columnNumber: 1352
        }, this),
        /* @__PURE__ */ jsxDEV("span", { children: [
          formatNumber(item.qty, lang),
          " ",
          t("reports.sold")
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 12,
          columnNumber: 1380
        }, this)
      ] }, item.name + index, true, {
        fileName: "<stdin>",
        lineNumber: 12,
        columnNumber: 1247
      }, this)),
      !summary.top.length && /* @__PURE__ */ jsxDEV("div", { className: "empty-state compact", children: t("reports.none") }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 12,
        columnNumber: 1472
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 12,
      columnNumber: 1190
    }, this),
    /* @__PURE__ */ jsxDEV("button", { className: "button secondary full export-button", onClick: () => void exportCsv(), children: [
      "\u2193 ",
      t("reports.export")
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 12,
      columnNumber: 1541
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 12,
    columnNumber: 10
  }, this);
}
export {
  Reports
};
