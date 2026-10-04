import { jsxDEV } from "react/jsx-dev-runtime";
import { useEffect, useState } from "react";
import { db, saveProduct } from "../db.ts";
import { useT } from "../i18n/I18nContext.tsx";
import { formatMoney, formatNumber } from "../i18n/format.ts";
function Products() {
  const { t, lang } = useT();
  const [products, setProducts] = useState([]), [query, setQuery] = useState(""), [editing, setEditing] = useState(null), [message, setMessage] = useState("");
  async function load() {
    setProducts(await db.products.orderBy("name").toArray());
  }
  useEffect(() => {
    void load();
    const timer = window.setInterval(load, 1600);
    return () => clearInterval(timer);
  }, []);
  const filtered = products.filter((product) => (product.name + product.nameAr + product.barcode).toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  async function save(event) {
    event.preventDefault();
    if (!editing) return;
    await saveProduct({ id: editing.id, barcode: editing.barcode, name: editing.name.trim(), nameAr: editing.nameAr?.trim(), price: Number(editing.price), cost: editing.cost, minStock: Number(editing.minStock) });
    setEditing(null);
    setMessage(t("products.updated"));
    void load();
    window.setTimeout(() => setMessage(""), 1800);
  }
  return /* @__PURE__ */ jsxDEV("section", { className: "screen products-screen", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "screen-title", children: [
      /* @__PURE__ */ jsxDEV("span", { className: "eyebrow", children: t("products.eyebrow") }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 11,
        columnNumber: 84
      }, this),
      /* @__PURE__ */ jsxDEV("h1", { children: [
        t("products.title"),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "count-label", children: products.length }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 11,
          columnNumber: 166
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 11,
        columnNumber: 140
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 11,
      columnNumber: 54
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "search-box", children: [
      /* @__PURE__ */ jsxDEV("span", { children: "\u2315" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 11,
        columnNumber: 259
      }, this),
      /* @__PURE__ */ jsxDEV("input", { value: query, onChange: (event) => setQuery(event.target.value), placeholder: t("products.search") }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 11,
        columnNumber: 273
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 11,
      columnNumber: 231
    }, this),
    message && /* @__PURE__ */ jsxDEV("div", { className: "notice success", children: message }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 11,
      columnNumber: 395
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "product-list", children: [
      filtered.map((product) => /* @__PURE__ */ jsxDEV("button", { className: "product-row", onClick: () => setEditing({ ...product }), children: [
        /* @__PURE__ */ jsxDEV("span", { className: "product-initial", children: (product.nameAr && lang === "ar" ? product.nameAr : product.name).slice(0, 1).toLocaleUpperCase() }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 11,
          columnNumber: 586
        }, this),
        /* @__PURE__ */ jsxDEV("span", { className: "product-info", children: [
          /* @__PURE__ */ jsxDEV("strong", { children: product.nameAr && lang === "ar" ? product.nameAr : product.name }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 11,
            columnNumber: 748
          }, this),
          /* @__PURE__ */ jsxDEV("span", { className: "muted", children: formatMoney(product.price, lang) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 11,
            columnNumber: 822
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 11,
          columnNumber: 717
        }, this),
        /* @__PURE__ */ jsxDEV("span", { className: (product.stockCache ?? 0) < product.minStock ? "stock-tag low" : "stock-tag", children: [
          formatNumber(product.stockCache ?? 0, lang),
          " ",
          /* @__PURE__ */ jsxDEV("small", { children: t("products.stock") }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 11,
            columnNumber: 1023
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 11,
          columnNumber: 893
        }, this),
        /* @__PURE__ */ jsxDEV("span", { className: "chevron", children: "\u203A" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 11,
          columnNumber: 1066
        }, this)
      ] }, product.id, true, {
        fileName: "<stdin>",
        lineNumber: 11,
        columnNumber: 498
      }, this)),
      !filtered.length && /* @__PURE__ */ jsxDEV("div", { className: "empty-state compact", children: t("products.none") }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 11,
        columnNumber: 1130
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 11,
      columnNumber: 443
    }, this),
    editing && /* @__PURE__ */ jsxDEV("div", { className: "modal-backdrop", children: /* @__PURE__ */ jsxDEV("form", { className: "edit-sheet", onSubmit: save, children: [
      /* @__PURE__ */ jsxDEV("div", { className: "sheet-head", children: [
        /* @__PURE__ */ jsxDEV("h2", { children: t("products.edit") }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 12,
          columnNumber: 120
        }, this),
        /* @__PURE__ */ jsxDEV("button", { type: "button", className: "icon-button", onClick: () => setEditing(null), "aria-label": t("common.close"), children: "\xD7" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 12,
          columnNumber: 149
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 12,
        columnNumber: 92
      }, this),
      /* @__PURE__ */ jsxDEV("label", { children: [
        t("products.name"),
        /* @__PURE__ */ jsxDEV("input", { required: true, value: editing.name, onChange: (event) => setEditing({ ...editing, name: event.target.value }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 12,
          columnNumber: 300
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 12,
        columnNumber: 273
      }, this),
      /* @__PURE__ */ jsxDEV("label", { children: [
        t("receive.nameAr"),
        /* @__PURE__ */ jsxDEV("input", { dir: "rtl", value: editing.nameAr ?? "", onChange: (event) => setEditing({ ...editing, nameAr: event.target.value }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 12,
          columnNumber: 443
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 12,
        columnNumber: 415
      }, this),
      /* @__PURE__ */ jsxDEV("label", { children: [
        t("products.price"),
        /* @__PURE__ */ jsxDEV("input", { required: true, type: "number", min: "0", value: editing.price, onChange: (event) => setEditing({ ...editing, price: Number(event.target.value) }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 12,
          columnNumber: 595
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 12,
        columnNumber: 567
      }, this),
      /* @__PURE__ */ jsxDEV("label", { children: [
        t("products.threshold"),
        /* @__PURE__ */ jsxDEV("input", { required: true, type: "number", min: "0", value: editing.minStock, onChange: (event) => setEditing({ ...editing, minStock: Number(event.target.value) }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 12,
          columnNumber: 774
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 12,
        columnNumber: 742
      }, this),
      /* @__PURE__ */ jsxDEV("button", { className: "button primary full", children: t("common.save") }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 12,
        columnNumber: 927
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 12,
      columnNumber: 47
    }, this) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 12,
      columnNumber: 15
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 11,
    columnNumber: 10
  }, this);
}
export {
  Products
};
