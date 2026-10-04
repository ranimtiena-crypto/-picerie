class ApiError extends Error {
  constructor(code, status, productName) {
    super(code);
    this.code = code;
    this.status = status;
    this.productName = productName;
  }
}
function apiBase() {
  const configured = import.meta.env?.VITE_API_URL;
  return (configured || "/api").replace(/\/$/, "");
}
async function apiFetch(path, options = {}) {
  const { unauthenticated, ...init } = options;
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  const token = localStorage.getItem("epicerie.token");
  headers.set("accept-language", localStorage.getItem("epicerie.lang") || "fr");
  if (!unauthenticated && token) headers.set("authorization", "Bearer " + token);
  let response;
  try {
    response = await fetch(apiBase() + path, { ...init, headers });
  } catch {
    throw new ApiError("NETWORK", 0);
  }
  if (response.status === 401 && !path.startsWith("/auth/login")) window.dispatchEvent(new Event("auth:expired"));
  if (!response.ok) {
    let body = {};
    try {
      body = await response.json();
    } catch {
    }
    throw new ApiError(body.error || (response.status === 401 ? "TOKEN_EXPIRED" : "UNKNOWN"), response.status, body.productName);
  }
  if (response.status === 204) return void 0;
  return response.json();
}
function saveSession(token, user) {
  localStorage.setItem("epicerie.token", token);
  localStorage.setItem("epicerie.user", JSON.stringify(user));
  localStorage.setItem("epicerie.userId", String(user.id));
}
function clearSession() {
  localStorage.removeItem("epicerie.token");
  localStorage.removeItem("epicerie.user");
  localStorage.removeItem("epicerie.userId");
}
function savedUser() {
  try {
    return JSON.parse(localStorage.getItem("epicerie.user") || "null");
  } catch {
    return null;
  }
}
export {
  ApiError,
  apiBase,
  apiFetch,
  clearSession,
  saveSession,
  savedUser
};
