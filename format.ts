function formatNumber(value, lang) {
  return new Intl.NumberFormat(lang === "ar" ? "ar" : "fr-FR", { maximumFractionDigits: 0 }).format(value);
}
function formatMoney(value, lang) {
  return new Intl.NumberFormat(lang === "ar" ? "ar" : "fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(value);
}
function formatDate(value, lang, options) {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar" : "fr-FR", options ?? { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
export {
  formatDate,
  formatMoney,
  formatNumber
};
