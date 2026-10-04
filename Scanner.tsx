import { jsxDEV } from "react/jsx-dev-runtime";
import { useEffect, useRef, useState } from "react";
import { useT } from "./i18n/I18nContext.tsx";
const recent = /* @__PURE__ */ new Map();
function acceptBarcode(code) {
  const now = Date.now();
  if (!code || now - (recent.get(code) ?? 0) < 2e3) return false;
  if (recent.size >= 200) recent.clear();
  recent.set(code, now);
  return true;
}
function Scanner({ onScan, onClose }) {
  const { t } = useT();
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const host = useRef(null);
  const [error, setError] = useState("");
  const done = useRef(false);
  useEffect(() => {
    let scanner, disposed = false;
    import("https://esm.sh/html5-qrcode@2.3.8?bundle").then(async ({ Html5Qrcode }) => {
      if (disposed || !host.current) return;
      scanner = new Html5Qrcode(host.current.id);
      try {
        await scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 150 }, formatsToSupport: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] }, (code) => {
          if (!done.current) {
            done.current = true;
            onScanRef.current(code);
          }
        }, () => {
        });
      } catch {
        setError(t("scanner.camera"));
      }
    }).catch(() => setError(t("scanner.load")));
    return () => {
      disposed = true;
      if (scanner?.isScanning) void scanner.stop().catch(() => {
      });
    };
  }, []);
  return /* @__PURE__ */ jsxDEV("div", { className: "modal-backdrop", onMouseDown: (event) => event.target === event.currentTarget && onClose(), children: /* @__PURE__ */ jsxDEV("section", { className: "scanner-sheet", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "sheet-head", children: [
      /* @__PURE__ */ jsxDEV("strong", { children: t("scanner.title") }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 25,
        columnNumber: 174
      }, this),
      /* @__PURE__ */ jsxDEV("button", { className: "icon-button", onClick: onClose, "aria-label": t("common.close"), children: "\xD7" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 25,
        columnNumber: 211
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 25,
      columnNumber: 146
    }, this),
    /* @__PURE__ */ jsxDEV("div", { id: "camera-reader", ref: host, className: "camera-reader" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 25,
      columnNumber: 308
    }, this),
    /* @__PURE__ */ jsxDEV("p", { className: "muted", children: t("scanner.hint") }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 25,
      columnNumber: 370
    }, this),
    error && /* @__PURE__ */ jsxDEV("p", { className: "error-text", children: error }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 25,
      columnNumber: 422
    }, this),
    /* @__PURE__ */ jsxDEV("button", { className: "secondary full", onClick: onClose, children: t("scanner.fallback") }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 25,
      columnNumber: 460
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 25,
    columnNumber: 111
  }, this) }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 25,
    columnNumber: 10
  }, this);
}
export {
  Scanner,
  acceptBarcode
};
