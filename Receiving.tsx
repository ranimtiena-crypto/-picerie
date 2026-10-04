import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import { useState } from "react";
import { db, receiveStock, saveProduct } from "../db.ts";
import { Scanner, acceptBarcode } from "../Scanner.tsx";
import { useT } from "../i18n/I18nContext.tsx";
function Receiving() {
  const { t, lang } = useT();
  const [barcode, setBarcode] = useState(""), [qty, setQty] = useState("1"), [product, setProduct] = useState(null), [scanner, setScanner] = useState(false);
  const [name, setName] = useState(""), [nameAr, setNameAr] = useState(""), [cost, setCost] = useState(""), [price, setPrice] = useState(""), [message, setMessage] = useState(""), [error, setError] = useState(false);
  async function lookup(raw) {
    const code = raw.trim();
    if (!acceptBarcode(code)) return;
    setBarcode(code);
    const found = await db.products.where("barcode").equals(code).first();
    setProduct(found ?? null);
    setName(found?.name ?? "");
    setNameAr(found?.nameAr ?? "");
    setCost(found ? String(found.cost) : "");
    setPrice(found ? String(found.price) : "");
    setMessage(found ? t("receive.known") : t("receive.new"));
    setError(false);
  }
  async function submit(event) {
    event.preventDefault();
    setMessage("");
    setError(false);
    try {
      let productId = product?.id;
      if (!productId) {
        if (!name.trim() || cost === "" || price === "") throw new Error("PRODUCT_FIELDS_REQUIRED");
        productId = await saveProduct({ barcode, name: name.trim(), nameAr: nameAr.trim(), price: Number(price), cost: Number(cost), minStock: 3 });
      }
      await receiveStock(productId, Number(qty));
      const label = nameAr && lang === "ar" ? nameAr : name;
      setMessage(t("receive.saved", { qty, product: label }));
      setBarcode("");
      setQty("1");
      setProduct(null);
      setName("");
      setNameAr("");
      setCost("");
      setPrice("");
    } catch (reason) {
      const code = reason instanceof Error ? reason.message : "UNKNOWN";
      setMessage(code === "INVALID_QUANTITY" ? t("receive.qtyError") : code === "PRODUCT_FIELDS_REQUIRED" ? t("receive.complete") : t("errors." + code));
      setError(true);
    }
  }
  return /* @__PURE__ */ jsxDEV("section", { className: "screen form-screen", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "screen-title", children: [
      /* @__PURE__ */ jsxDEV("span", { className: "eyebrow", children: t("receive.eyebrow") }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 11,
        columnNumber: 80
      }, this),
      /* @__PURE__ */ jsxDEV("h1", { children: t("receive.title") }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 11,
        columnNumber: 135
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 11,
      columnNumber: 50
    }, this),
    /* @__PURE__ */ jsxDEV("form", { onSubmit: submit, className: "form-card", children: [
      /* @__PURE__ */ jsxDEV("label", { children: [
        t("receive.barcode"),
        /* @__PURE__ */ jsxDEV("div", { className: "input-with-action", children: [
          /* @__PURE__ */ jsxDEV("input", { required: true, value: barcode, onChange: (event) => setBarcode(event.target.value), onKeyDown: (event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void lookup(barcode);
            }
          }, placeholder: t("receive.scan") }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 11,
            columnNumber: 280
          }, this),
          /* @__PURE__ */ jsxDEV("button", { type: "button", onClick: () => setScanner(true), className: "icon-button scan-small", "aria-label": t("scanner.title"), children: "\u25A6" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 11,
            columnNumber: 489
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 11,
          columnNumber: 245
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 11,
        columnNumber: 216
      }, this),
      barcode && /* @__PURE__ */ jsxDEV(Fragment, { children: [
        /* @__PURE__ */ jsxDEV("label", { children: [
          t("receive.name"),
          /* @__PURE__ */ jsxDEV("input", { required: true, value: name, onChange: (event) => setName(event.target.value) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 12,
            columnNumber: 43
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 12,
          columnNumber: 17
        }, this),
        /* @__PURE__ */ jsxDEV("label", { children: [
          t("receive.nameAr"),
          /* @__PURE__ */ jsxDEV("input", { dir: "rtl", value: nameAr, onChange: (event) => setNameAr(event.target.value) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 12,
            columnNumber: 157
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 12,
          columnNumber: 129
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "field-grid", children: [
          /* @__PURE__ */ jsxDEV("label", { children: [
            t("receive.cost"),
            /* @__PURE__ */ jsxDEV("input", { required: true, type: "number", min: "0", step: "1", value: cost, onChange: (event) => setCost(event.target.value), placeholder: "0" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 12,
              columnNumber: 302
            }, this)
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 12,
            columnNumber: 276
          }, this),
          /* @__PURE__ */ jsxDEV("label", { children: [
            t("receive.price"),
            /* @__PURE__ */ jsxDEV("input", { required: true, type: "number", min: "0", step: "1", value: price, onChange: (event) => setPrice(event.target.value), placeholder: "0" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 12,
              columnNumber: 462
            }, this)
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 12,
            columnNumber: 435
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 12,
          columnNumber: 248
        }, this),
        /* @__PURE__ */ jsxDEV("label", { children: [
          t("receive.qty"),
          /* @__PURE__ */ jsxDEV("input", { required: true, type: "number", min: "1", step: "1", value: qty, onChange: (event) => setQty(event.target.value) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 12,
            columnNumber: 628
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 12,
          columnNumber: 603
        }, this),
        /* @__PURE__ */ jsxDEV("button", { className: "button primary full", type: "submit", children: t("receive.submit") }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 12,
          columnNumber: 743
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 12,
        columnNumber: 15
      }, this),
      message && /* @__PURE__ */ jsxDEV("div", { className: error ? "notice warning" : "notice success", children: message }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 13,
        columnNumber: 15
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 11,
      columnNumber: 170
    }, this),
    scanner && /* @__PURE__ */ jsxDEV(Scanner, { onScan: (code) => {
      setScanner(false);
      void lookup(code);
    }, onClose: () => setScanner(false) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 13,
      columnNumber: 105
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 11,
    columnNumber: 10
  }, this);
}
export {
  Receiving
};
