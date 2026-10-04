var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import Dexie from "https://esm.sh/dexie@4.0.8?bundle";
class GroceryDB extends Dexie {
  constructor(name = "epicerie-offline") {
    super(name);
    __publicField(this, "products");
    __publicField(this, "stockMovements");
    __publicField(this, "sales");
    __publicField(this, "saleItems");
    __publicField(this, "syncQueue");
    this.version(1).stores({ products: "++id,&barcode,name,updatedAt", stockMovements: "++id,&uuid,productId,createdAt,type,synced", sales: "++id,&uuid,createdAt,synced", saleItems: "++id,saleId,productId", syncQueue: "++id,&uuid,status,createdAt" });
    this.version(2).stores({ products: "++id,&barcode,name,updatedAt", stockMovements: "++id,&uuid,productId,createdAt,type,synced,[productId+createdAt]", sales: "++id,&uuid,createdAt,synced", saleItems: "++id,saleId,productId,[saleId+productId]", syncQueue: "++id,&uuid,status,createdAt" });
    this.version(3).stores({ products: "++id,&barcode,name,updatedAt", stockMovements: "++id,&uuid,productId,createdAt,type,synced,[productId+createdAt]", sales: "++id,&uuid,createdAt,synced", saleItems: "++id,saleId,productId,[saleId+productId]", syncQueue: "++id,&uuid,status,createdAt" }).upgrade(async (tx) => {
      const products = await tx.table("products").toArray();
      const movements = await tx.table("stockMovements").toArray();
      const totals = /* @__PURE__ */ new Map();
      for (const movement of movements) totals.set(movement.productId, (totals.get(movement.productId) ?? 0) + movement.qty);
      await Promise.all(products.map((product) => tx.table("products").update(product.id, { nameAr: product.nameAr ?? "", stockCache: totals.get(product.id) ?? 0 })));
    });
  }
}
const savedUserId = localStorage.getItem("epicerie.userId");
const db = new GroceryDB(savedUserId ? "epicerie-offline-shop-" + savedUserId : "epicerie-offline");
const makeUuid = () => crypto.randomUUID();
const nowIso = () => (/* @__PURE__ */ new Date()).toISOString();
async function migrateLegacyShopData(userId, role) {
  if (role !== "shop" || localStorage.getItem("epicerie.legacyOwner")) return;
  const legacy = new GroceryDB("epicerie-offline");
  try {
    await legacy.open();
    const tables = ["products", "stockMovements", "sales", "saleItems", "syncQueue"];
    const [legacyRows, targetCounts] = await Promise.all([Promise.all(tables.map((name) => legacy.table(name).toArray())), Promise.all(tables.map((name) => db.table(name).count()))]);
    if (targetCounts.every((count) => count === 0) && legacyRows.some((rows) => rows.length)) {
      await db.transaction("rw", ...tables.map((name) => db.table(name)), async () => {
        for (let index = 0; index < tables.length; index++) if (legacyRows[index].length) await db.table(tables[index]).bulkPut(legacyRows[index]);
      });
    }
    localStorage.setItem("epicerie.legacyOwner", String(userId));
  } finally {
    legacy.close();
  }
}
async function stockFor(productId) {
  const rows = await db.stockMovements.where("productId").equals(productId).toArray();
  return rows.reduce((sum, row) => sum + row.qty, 0);
}
async function saveProduct(input) {
  return db.transaction("rw", db.products, db.syncQueue, async () => {
    const existing = input.id ? await db.products.get(input.id) : void 0;
    const product = { ...existing, ...input, nameAr: input.nameAr ?? existing?.nameAr ?? "", stockCache: existing?.stockCache ?? 0, updatedAt: nowIso() };
    const id = await db.products.put(product);
    await db.syncQueue.add({ uuid: makeUuid(), action: "product.upsert", payload: { ...product, id }, status: "pending", retries: 0, createdAt: nowIso() });
    return id;
  });
}
async function commitSale(lines, paymentMethod) {
  if (!lines.length) throw new Error("INVALID_QUANTITY");
  return db.transaction("rw", db.products, db.stockMovements, db.sales, db.saleItems, db.syncQueue, async () => {
    const quantities = /* @__PURE__ */ new Map();
    for (const line of lines) {
      if (!line.product.id || !Number.isInteger(line.qty) || line.qty < 1) throw new Error("INVALID_QUANTITY");
      quantities.set(line.product.id, (quantities.get(line.product.id) ?? 0) + line.qty);
    }
    for (const [productId, qty] of quantities) {
      const movements2 = await db.stockMovements.where("productId").equals(productId).toArray();
      const available = movements2.reduce((sum, movement) => sum + movement.qty, 0);
      if (available < qty) {
        const product = await db.products.get(productId);
        throw new Error("STOCK_INSUFFICIENT|" + (product?.name ?? "") + "|" + (product?.nameAr ?? ""));
      }
    }
    const saleUuid = makeUuid();
    const sale = { uuid: saleUuid, total: lines.reduce((sum, line) => sum + line.product.price * line.qty, 0), paymentMethod, createdAt: nowIso(), synced: false };
    const saleId = await db.sales.add(sale);
    const items = [];
    const movements = [];
    for (const [productId, qty] of quantities) {
      const line = lines.find((entry) => entry.product.id === productId);
      items.push({ saleId, productId, qty, unitPrice: line.product.price, cost: line.product.cost });
      movements.push({ uuid: makeUuid(), productId, qty: -qty, type: "vente", refId: saleUuid, createdAt: sale.createdAt, synced: false });
    }
    await db.saleItems.bulkAdd(items);
    await db.stockMovements.bulkAdd(movements);
    for (const [productId, qty] of quantities) {
      const ledger = await db.stockMovements.where("productId").equals(productId).toArray();
      await db.products.update(productId, { stockCache: ledger.reduce((sum, row) => sum + row.qty, 0) });
    }
    await db.syncQueue.add({ uuid: saleUuid, action: "sale.create", payload: { sale, items, movements }, status: "pending", retries: 0, createdAt: sale.createdAt });
    return sale;
  });
}
async function receiveStock(productId, qty) {
  if (!Number.isInteger(qty) || qty < 1) throw new Error("INVALID_QUANTITY");
  const movement = { uuid: makeUuid(), productId, qty, type: "achat", refId: makeUuid(), createdAt: nowIso(), synced: false };
  await db.transaction("rw", db.products, db.stockMovements, db.syncQueue, async () => {
    await db.stockMovements.add(movement);
    const rows = await db.stockMovements.where("productId").equals(productId).toArray();
    await db.products.update(productId, { stockCache: rows.reduce((sum, row) => sum + row.qty, 0) });
    await db.syncQueue.add({ uuid: movement.uuid, action: "movement.create", payload: movement, status: "pending", retries: 0, createdAt: movement.createdAt });
  });
  return movement;
}
async function insertRemoteMovements(remote) {
  return db.transaction("rw", db.products, db.stockMovements, async () => {
    const affected = /* @__PURE__ */ new Set();
    for (const row of remote) {
      if (await db.stockMovements.where("uuid").equals(row.uuid).first()) continue;
      const product = await db.products.where("barcode").equals(row.barcode).first();
      if (!product?.id) continue;
      await db.stockMovements.add({ ...row, productId: product.id, synced: true });
      affected.add(product.id);
    }
    for (const productId of affected) {
      const rows = await db.stockMovements.where("productId").equals(productId).toArray();
      await db.products.update(productId, { stockCache: rows.reduce((sum, row) => sum + row.qty, 0) });
    }
    return affected.size;
  });
}
export {
  commitSale,
  db,
  insertRemoteMovements,
  makeUuid,
  migrateLegacyShopData,
  nowIso,
  receiveStock,
  saveProduct,
  stockFor
};
