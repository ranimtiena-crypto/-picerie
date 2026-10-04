import { jsxDEV } from "react/jsx-dev-runtime";
import { useMemo, useState } from "react";
import { db, commitSale } from "../db.ts";
import { Scanner, acceptBarcode } from "../Scanner.tsx";
import { useT } from "../i18n/I18nContext.tsx";
import { formatMoney } from "../i18n/format.ts";
import { ApiError } from "../api.ts";
function Cashier({ onPaid }) {
  const [cart, setCart] = useState([]), [scanner, setScanner] = useState(false), [barcode, setBarcode] = useState(""), [payOpen, setPayOpen] = useState(false), [message, setMessage] = useState("");
  const { t, lang } = useT();
  const total = useMemo(() => cart.reduce((sum, line) => sum + line.product.price * line.qty, 0), [cart]);
  async function addCode(raw) {
    const clean = raw.trim();
    setBarcode("");
    if (!acceptBarcode(clean)) return;
    const product = await db.products.where("barcode").equals(clean).first();
    if (!product) {
      setMessage(t("cashier.notIdentified"));
      return;
    }
    if (!product.id) return;
    const available = product.stockCache ?? 0, inCart = cart.filter((row) => row.product.id === product.id).reduce((sum, row) => sum + row.qty, 0);
    if (available <= inCart) {
      setMessage(t("errors.STOCK_INSUFFICIENT", { product: product.nameAr && lang === "ar" ? product.nameAr : product.name }));
      return;
    }
    setCart((current) => {
      const existing = current.find((row) => row.product.id === product.id);
      return existing ? current.map((row) => row.product.id === product.id ? { ...row, qty: row.qty + 1 } : row) : [...current, { product, qty: 1 }];
    });
    setMessage("");
  }
  async function pay(method) {
    try {
      await commitSale(cart, method);
      setCart([]);
      setPayOpen(false);
      setMessage(navigator.onLine ? t("cashier.paidOnline") : t("cashier.paidOffline"));
      onPaid();
      window.setTimeout(() => setMessage(""), 2800);
    } catch (error) {
      const message2 = error instanceof Error ? error.message : "UNKNOWN";
      if (message2.startsWith("STOCK_INSUFFICIENT|")) setMessage(t("errors.STOCK_INSUFFICIENT", { product: lang === "ar" ? message2.split("|")[2] || message2.split("|")[1] : message2.split("|")[1] }));
      else if (message2 === "INVALID_QUANTITY") setMessage(t("cashier.invalidQuantity"));
      else setMessage(t(error instanceof ApiError ? "errors." + error.code : "errors.UNKNOWN"));
    }
  }
  return /* @__PURE__ */ jsxDEV("section", { className: "screen cashier-screen", children: [
    /* @__PURE__ */ jsxDEV("form", { className: "scan-entry", onSubmit: (event) => {
      event.preventDefault();
      void addCode(barcode);
    }, children: [
      /* @__PURE__ */ jsxDEV("input", { "aria-label": t("cashier.barcode"), value: barcode, onChange: (event) => setBarcode(event.target.value), placeholder: t("cashier.barcode"), inputMode: "none", autoFocus: true }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 25,
        columnNumber: 102
      }, this),
      /* @__PURE__ */ jsxDEV("button", { type: "submit", className: "button primary", children: t("cashier.add") }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 25,
        columnNumber: 273
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 25,
      columnNumber: 5
    }, this),
    /* @__PURE__ */ jsxDEV("button", { className: "button scan-button", onClick: () => setScanner(true), children: [
      /* @__PURE__ */ jsxDEV("span", { className: "scan-glyph", children: "\u25A6" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 26,
        columnNumber: 75
      }, this),
      t("cashier.scan")
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 26,
      columnNumber: 5
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "cart-head", children: [
      /* @__PURE__ */ jsxDEV("h1", { children: t("cashier.cart") }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 27,
        columnNumber: 32
      }, this),
      /* @__PURE__ */ jsxDEV("span", { className: "pill", children: [
        cart.reduce((n, line) => n + line.qty, 0),
        " ",
        t("cashier.items")
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 27,
        columnNumber: 60
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 27,
      columnNumber: 5
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "cart-list", children: cart.length === 0 ? /* @__PURE__ */ jsxDEV("div", { className: "empty-state", children: [
      /* @__PURE__ */ jsxDEV("span", { className: "empty-icon", children: "\uFF0B" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 28,
        columnNumber: 78
      }, this),
      /* @__PURE__ */ jsxDEV("strong", { children: t("cashier.empty") }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 28,
        columnNumber: 115
      }, this),
      /* @__PURE__ */ jsxDEV("span", { className: "muted", children: t("cashier.start") }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 28,
        columnNumber: 152
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 28,
      columnNumber: 49
    }, this) : cart.map((line) => /* @__PURE__ */ jsxDEV("article", { className: "cart-row", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "cart-product", children: [
        /* @__PURE__ */ jsxDEV("strong", { children: line.product.nameAr && lang === "ar" ? line.product.nameAr : line.product.name }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 28,
          columnNumber: 309
        }, this),
        /* @__PURE__ */ jsxDEV("span", { className: "muted", children: [
          formatMoney(line.product.price, lang),
          " ",
          t("cashier.unit")
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 28,
          columnNumber: 398
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 28,
        columnNumber: 279
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "qty-control", children: [
        /* @__PURE__ */ jsxDEV("button", { "aria-label": "\u2212", onClick: () => setCart((rows) => rows.flatMap((row) => row.product.id !== line.product.id ? [row] : row.qty > 1 ? [{ ...row, qty: row.qty - 1 }] : [])), children: "\u2212" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 28,
          columnNumber: 522
        }, this),
        /* @__PURE__ */ jsxDEV("b", { children: line.qty }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 28,
          columnNumber: 684
        }, this),
        /* @__PURE__ */ jsxDEV("button", { "aria-label": "+", onClick: () => setCart((rows) => rows.map((row) => row.product.id === line.product.id ? { ...row, qty: row.qty + 1 } : row)), children: "\uFF0B" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 28,
          columnNumber: 701
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 28,
        columnNumber: 493
      }, this),
      /* @__PURE__ */ jsxDEV("strong", { className: "line-total", children: formatMoney(line.product.price * line.qty, lang) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 28,
        columnNumber: 848
      }, this)
    ] }, line.product.id, true, {
      fileName: "<stdin>",
      lineNumber: 28,
      columnNumber: 227
    }, this)) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 28,
      columnNumber: 5
    }, this),
    message && /* @__PURE__ */ jsxDEV("div", { className: message === t("cashier.paidOnline") || message === t("cashier.paidOffline") ? "notice success" : "notice warning", children: message }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 29,
      columnNumber: 15
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "checkout-bar", children: [
      /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("span", { className: "muted", children: t("cashier.total") }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 30,
          columnNumber: 40
        }, this),
        /* @__PURE__ */ jsxDEV("strong", { children: formatMoney(total, lang) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 30,
          columnNumber: 91
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 30,
        columnNumber: 35
      }, this),
      /* @__PURE__ */ jsxDEV("button", { className: "button checkout", disabled: !cart.length, onClick: () => setPayOpen(true), children: [
        t("cashier.checkout"),
        " ",
        /* @__PURE__ */ jsxDEV("span", { children: "\u2192" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 30,
          columnNumber: 254
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 30,
        columnNumber: 139
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 30,
      columnNumber: 5
    }, this),
    payOpen && /* @__PURE__ */ jsxDEV("div", { className: "modal-backdrop", children: /* @__PURE__ */ jsxDEV("section", { className: "payment-sheet", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "sheet-head", children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("span", { className: "muted", children: t("cashier.saleTotal") }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 31,
            columnNumber: 115
          }, this),
          /* @__PURE__ */ jsxDEV("h2", { children: formatMoney(total, lang) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 31,
            columnNumber: 170
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 31,
          columnNumber: 110
        }, this),
        /* @__PURE__ */ jsxDEV("button", { className: "icon-button", onClick: () => setPayOpen(false), "aria-label": t("common.close"), children: "\xD7" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 31,
          columnNumber: 210
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 31,
        columnNumber: 82
      }, this),
      /* @__PURE__ */ jsxDEV("p", { className: "muted", children: t("cashier.payment") }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 31,
        columnNumber: 321
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "payment-options", children: [
        /* @__PURE__ */ jsxDEV("button", { onClick: () => void pay("esp\xE8ces"), children: [
          "\u25A3 ",
          /* @__PURE__ */ jsxDEV("span", { children: t("cashier.cash") }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 31,
            columnNumber: 445
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 31,
          columnNumber: 401
        }, this),
        /* @__PURE__ */ jsxDEV("button", { onClick: () => void pay("mobile money"), children: [
          "\u25C9 ",
          /* @__PURE__ */ jsxDEV("span", { children: t("cashier.mobile") }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 31,
            columnNumber: 535
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 31,
          columnNumber: 486
        }, this),
        /* @__PURE__ */ jsxDEV("button", { onClick: () => void pay("carte"), children: [
          "\u25B1 ",
          /* @__PURE__ */ jsxDEV("span", { children: t("cashier.card") }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 31,
            columnNumber: 620
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 31,
          columnNumber: 578
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 31,
        columnNumber: 368
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 31,
      columnNumber: 47
    }, this) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 31,
      columnNumber: 15
    }, this),
    scanner && /* @__PURE__ */ jsxDEV(Scanner, { onScan: (code) => {
      setScanner(false);
      void addCode(code);
    }, onClose: () => setScanner(false) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 32,
      columnNumber: 15
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 24,
    columnNumber: 10
  }, this);
}
export {
  Cashier
};
