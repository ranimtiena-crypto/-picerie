import { apiFetch, ApiError } from "./api.ts";
import { db, insertRemoteMovements, nowIso } from "./db.ts";
let activeSync = null;
async function pendingCount() {
  return db.syncQueue.where("status").anyOf("pending", "failed", "syncing").count();
}
async function purgeCompletedQueue() {
  const cutoff = new Date(Date.now() - 30 * 864e5).toISOString();
  await db.syncQueue.where("status").equals("done").and((item) => item.createdAt < cutoff).delete();
}
async function flushSync() {
  if (activeSync) return activeSync;
  activeSync = runSync().finally(() => {
    activeSync = null;
  });
  return activeSync;
}
async function runSync() {
  if (!navigator.onLine) throw new ApiError("NETWORK", 0);
  const queue = await db.syncQueue.where("status").anyOf("pending", "failed", "syncing").toArray();
  queue.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  if (!queue.length) {
    await pullRemoteChanges();
    return { processed: 0, ignored: 0 };
  }
  const queueIds = queue.map((item) => item.id).filter(Boolean);
  await db.syncQueue.where("id").anyOf(queueIds).modify({ status: "syncing", error: void 0 });
  const productByUuid = /* @__PURE__ */ new Map();
  const sales = [];
  const movements = [];
  try {
    for (const entry of queue) {
      const payload = entry.payload;
      if (entry.action === "product.upsert") productByUuid.set(entry.uuid, { ...payload, uuid: entry.uuid });
      if (entry.action === "sale.create") {
        const items = await Promise.all(payload.items.map(async (item) => ({ ...item, barcode: (await db.products.get(item.productId))?.barcode })));
        sales.push({ ...payload.sale, items });
        movements.push(...await Promise.all(payload.movements.map(async (movement) => ({ ...movement, barcode: (await db.products.get(movement.productId))?.barcode }))));
      }
      if (entry.action === "movement.create") movements.push({ ...payload, barcode: (await db.products.get(payload.productId))?.barcode });
    }
    const result = await apiFetch("/sync", { method: "POST", body: JSON.stringify({ sales, movements, products: [...productByUuid.values()] }) });
    const syncedAt = nowIso();
    await db.transaction("rw", db.syncQueue, db.sales, db.stockMovements, db.products, async () => {
      for (const entry of queue) await db.syncQueue.update(entry.id, { status: "done", error: void 0 });
      for (const sale of sales) await db.sales.where("uuid").equals(sale.uuid).modify({ synced: true });
      for (const movement of movements) await db.stockMovements.where("uuid").equals(movement.uuid).modify({ synced: true });
      for (const product of productByUuid.values()) if (product.id) await db.products.update(product.id, { syncedAt });
    });
    await pullRemoteChanges();
    return { processed: result.processed ?? queue.length, ignored: result.ignored ?? 0 };
  } catch (error) {
    const code = error instanceof ApiError ? error.productName ? error.code + "|" + error.productName : error.code : error instanceof Error ? error.message : "UNKNOWN";
    await db.transaction("rw", db.syncQueue, async () => {
      for (const entry of queue) {
        const retries = entry.retries + 1;
        await db.syncQueue.update(entry.id, { status: retries >= 5 ? "failed" : "pending", retries, error: code });
      }
    });
    throw error;
  }
}
async function pullRemoteChanges() {
  await pullRemoteProducts();
  const account = localStorage.getItem("epicerie.userId") || "guest";
  const cursorKey = "epicerie.remoteMovementSince." + account;
  const knownMovements = await db.stockMovements.count();
  const since = knownMovements === 0 ? "1970-01-01T00:00:00.000Z" : localStorage.getItem(cursorKey) || "1970-01-01T00:00:00.000Z";
  const { movements = [] } = await apiFetch("/movements?since=" + encodeURIComponent(since));
  if (!movements.length) return;
  await insertRemoteMovements(movements);
  const newest = movements.reduce((latest, movement) => movement.createdAt > latest ? movement.createdAt : latest, since);
  localStorage.setItem(cursorKey, newest);
}
async function pullRemoteProducts() {
  const productsInDb = await db.products.toArray();
  const synced = productsInDb.filter((product) => product.syncedAt).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const since = synced?.updatedAt ?? "1970-01-01T00:00:00.000Z";
  const { products = [] } = await apiFetch("/products?since=" + encodeURIComponent(since));
  for (const product of products) {
    if (!product.barcode) continue;
    const local = await db.products.where("barcode").equals(product.barcode).first();
    const hasPending = local?.id ? await db.syncQueue.filter((row) => row.status !== "done" && row.payload?.id === local.id).count() : 0;
    if (!hasPending) {
      const values = { name: product.name, nameAr: product.nameAr ?? "", price: product.price, cost: product.cost, minStock: product.minStock, updatedAt: product.updatedAt, syncedAt: nowIso() };
      if (local?.id) await db.products.update(local.id, values);
      else await db.products.add({ ...values, barcode: product.barcode, stockCache: 0 });
    }
  }
}
export {
  flushSync,
  pendingCount,
  pullRemoteChanges,
  purgeCompletedQueue
};
