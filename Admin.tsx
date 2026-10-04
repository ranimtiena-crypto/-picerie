import { jsxDEV } from "react/jsx-dev-runtime";
import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "../api.ts";
import { useT } from "../i18n/I18nContext.tsx";
import { formatDate, formatNumber } from "../i18n/format.ts";
function Admin({ onLogout }) {
  const { t, lang, setLang } = useT();
  const [shops, setShops] = useState([]), [email, setEmail] = useState(""), [password, setPassword] = useState(""), [shopName, setShopName] = useState(""), [preferredLang, setPreferredLang] = useState(lang), [error, setError] = useState(""), [message, setMessage] = useState(""), [passwordId, setPasswordId] = useState(null), [newPassword, setNewPassword] = useState("");
  async function load() {
    const result = await apiFetch("/admin/users");
    setShops(result.users);
  }
  useEffect(() => {
    void load().catch(() => setError(t("errors.UNKNOWN")));
  }, []);
  function translatedError(reason) {
    return t("errors." + (reason instanceof ApiError ? reason.code : "UNKNOWN"));
  }
  async function create(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await apiFetch("/admin/users", { method: "POST", body: JSON.stringify({ email, password, shopName, preferredLang }) });
      setEmail("");
      setPassword("");
      setShopName("");
      setPreferredLang(lang);
      setMessage(t("admin.created"));
      await load();
    } catch (reason) {
      setError(translatedError(reason));
    }
  }
  async function toggle(shop) {
    try {
      await apiFetch("/admin/users/" + shop.id, { method: "PATCH", body: JSON.stringify({ active: !shop.active }) });
      await load();
    } catch (reason) {
      setError(translatedError(reason));
    }
  }
  async function changePassword(id) {
    if (newPassword.length < 10) {
      setError(t("errors.INVALID_INPUT"));
      return;
    }
    try {
      await apiFetch("/admin/users/" + id, { method: "PATCH", body: JSON.stringify({ password: newPassword }) });
      setPasswordId(null);
      setNewPassword("");
      setMessage(t("admin.updated"));
    } catch (reason) {
      setError(translatedError(reason));
    }
  }
  return /* @__PURE__ */ jsxDEV("section", { className: "screen admin-screen", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "screen-title admin-title", children: [
      /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("span", { className: "eyebrow", children: t("admin.role") }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 15,
          columnNumber: 98
        }, this),
        /* @__PURE__ */ jsxDEV("h1", { children: t("admin.title") }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 15,
          columnNumber: 148
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 15,
        columnNumber: 93
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "admin-actions", children: [
        /* @__PURE__ */ jsxDEV("select", { "aria-label": t("auth.language"), value: lang, onChange: (event) => setLang(event.target.value), children: [
          /* @__PURE__ */ jsxDEV("option", { value: "fr", children: "FR" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 15,
            columnNumber: 325
          }, this),
          /* @__PURE__ */ jsxDEV("option", { value: "ar", children: "AR" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 15,
            columnNumber: 355
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 15,
          columnNumber: 212
        }, this),
        /* @__PURE__ */ jsxDEV("button", { className: "button secondary", onClick: onLogout, children: t("common.logout") }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 15,
          columnNumber: 394
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 15,
        columnNumber: 181
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 15,
      columnNumber: 51
    }, this),
    error && /* @__PURE__ */ jsxDEV("div", { className: "notice warning", children: error }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 15,
      columnNumber: 499
    }, this),
    message && /* @__PURE__ */ jsxDEV("div", { className: "notice success", children: message }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 15,
      columnNumber: 555
    }, this),
    /* @__PURE__ */ jsxDEV("form", { className: "form-card admin-form", onSubmit: create, children: [
      /* @__PURE__ */ jsxDEV("h2", { children: t("admin.create") }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 15,
        columnNumber: 660
      }, this),
      /* @__PURE__ */ jsxDEV("label", { children: [
        t("auth.email"),
        /* @__PURE__ */ jsxDEV("input", { required: true, type: "email", value: email, onChange: (event) => setEmail(event.target.value), dir: "ltr" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 15,
          columnNumber: 712
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 15,
        columnNumber: 688
      }, this),
      /* @__PURE__ */ jsxDEV("label", { children: [
        t("auth.password"),
        /* @__PURE__ */ jsxDEV("input", { required: true, type: "password", minLength: 10, value: password, onChange: (event) => setPassword(event.target.value), dir: "ltr" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 15,
          columnNumber: 850
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 15,
        columnNumber: 823
      }, this),
      /* @__PURE__ */ jsxDEV("label", { children: [
        t("admin.shopName"),
        /* @__PURE__ */ jsxDEV("input", { required: true, value: shopName, onChange: (event) => setShopName(event.target.value) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 15,
          columnNumber: 1013
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 15,
        columnNumber: 985
      }, this),
      /* @__PURE__ */ jsxDEV("label", { children: [
        t("auth.language"),
        /* @__PURE__ */ jsxDEV("select", { value: preferredLang, onChange: (event) => setPreferredLang(event.target.value), children: [
          /* @__PURE__ */ jsxDEV("option", { value: "fr", children: "Fran\xE7ais" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 15,
            columnNumber: 1233
          }, this),
          /* @__PURE__ */ jsxDEV("option", { value: "ar", children: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 15,
            columnNumber: 1269
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 15,
          columnNumber: 1134
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 15,
        columnNumber: 1107
      }, this),
      /* @__PURE__ */ jsxDEV("button", { className: "button primary full", children: t("admin.createAccount") }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 15,
        columnNumber: 1321
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 15,
      columnNumber: 603
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "shop-list", children: [
      shops.map((shop) => /* @__PURE__ */ jsxDEV("article", { className: "shop-card", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "shop-card-head", children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("strong", { children: shop.shopName }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 15,
              columnNumber: 1531
            }, this),
            /* @__PURE__ */ jsxDEV("span", { dir: "ltr", children: shop.email }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 15,
              columnNumber: 1563
            }, this)
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 15,
            columnNumber: 1526
          }, this),
          /* @__PURE__ */ jsxDEV("span", { className: shop.active ? "shop-status active" : "shop-status", children: shop.active ? t("admin.active") : t("admin.inactive") }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 15,
            columnNumber: 1604
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 15,
          columnNumber: 1494
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "shop-meta", children: [
          /* @__PURE__ */ jsxDEV("span", { children: [
            t("admin.createdAt"),
            " ",
            formatDate(shop.createdAt, lang, { dateStyle: "medium" })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 15,
            columnNumber: 1760
          }, this),
          /* @__PURE__ */ jsxDEV("span", { children: [
            formatNumber(shop.salesCount, lang),
            " ",
            t("admin.sales")
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 15,
            columnNumber: 1850
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 15,
          columnNumber: 1733
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "shop-actions", children: [
          /* @__PURE__ */ jsxDEV("button", { className: "button secondary", onClick: () => void toggle(shop), children: shop.active ? t("admin.deactivate") : t("admin.activate") }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 15,
            columnNumber: 1954
          }, this),
          /* @__PURE__ */ jsxDEV("button", { className: "button secondary", onClick: () => {
            setPasswordId(passwordId === shop.id ? null : shop.id);
            setNewPassword("");
          }, children: t("admin.changePassword") }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 15,
            columnNumber: 2087
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 15,
          columnNumber: 1924
        }, this),
        passwordId === shop.id && /* @__PURE__ */ jsxDEV("div", { className: "password-edit", children: [
          /* @__PURE__ */ jsxDEV("input", { type: "password", minLength: 10, placeholder: t("admin.newPassword"), value: newPassword, onChange: (event) => setNewPassword(event.target.value), dir: "ltr" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 15,
            columnNumber: 2305
          }, this),
          /* @__PURE__ */ jsxDEV("button", { className: "button primary", onClick: () => void changePassword(shop.id), children: t("common.save") }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 15,
            columnNumber: 2466
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 15,
          columnNumber: 2274
        }, this)
      ] }, shop.id, true, {
        fileName: "<stdin>",
        lineNumber: 15,
        columnNumber: 1449
      }, this)),
      !shops.length && !error && /* @__PURE__ */ jsxDEV("div", { className: "empty-state compact", children: t("admin.empty") }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 15,
        columnNumber: 2614
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 15,
      columnNumber: 1403
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 15,
    columnNumber: 10
  }, this);
}
export {
  Admin
};
