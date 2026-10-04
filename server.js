export const schema = `
  CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, barcode TEXT NOT NULL, name TEXT NOT NULL, price REAL NOT NULL, cost REAL NOT NULL, min_stock INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL, UNIQUE(user_id, barcode));
  CREATE INDEX IF NOT EXISTS products_user_updated ON products(user_id, updated_at);
  CREATE TABLE IF NOT EXISTS product_links (user_id TEXT NOT NULL, local_id INTEGER NOT NULL, product_id INTEGER NOT NULL, PRIMARY KEY(user_id, local_id));
  CREATE TABLE IF NOT EXISTS sales (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, uuid TEXT NOT NULL, total REAL NOT NULL, payment_method TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(user_id, uuid));
  CREATE INDEX IF NOT EXISTS sales_user_date ON sales(user_id, created_at);
  CREATE TABLE IF NOT EXISTS sale_items (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, sale_id INTEGER NOT NULL, product_id INTEGER NOT NULL, qty INTEGER NOT NULL, unit_price REAL NOT NULL, cost REAL NOT NULL);
  CREATE TABLE IF NOT EXISTS stock_movements (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, uuid TEXT NOT NULL, product_id INTEGER NOT NULL, qty INTEGER NOT NULL, type TEXT NOT NULL, ref_id TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(user_id, uuid));
  CREATE INDEX IF NOT EXISTS movements_user_product ON stock_movements(user_id, product_id);
  CREATE TABLE IF NOT EXISTS sync_receipts (user_id TEXT NOT NULL, kind TEXT NOT NULL, uuid TEXT NOT NULL, PRIMARY KEY(user_id, kind, uuid));
`;

const json = (body, status = 200) => Response.json(body, { status });
const isUuid = (value) => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const finite = (value) => typeof value === "number" && Number.isFinite(value);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const userId = request.headers.get("x-websim-user-id");
    if (request.method === "GET" && url.pathname === "/api/products") {
      if (!userId) return json({ error: "Connexion requise." }, 401);
      const since = url.searchParams.get("since") || "1970-01-01T00:00:00.000Z";
      const { results } = await env.DB.prepare("SELECT p.barcode, p.name, p.price, p.cost, p.min_stock AS minStock, p.updated_at AS updatedAt, COALESCE(SUM(m.qty),0) AS stock FROM products p LEFT JOIN stock_movements m ON m.product_id=p.id AND m.user_id=p.user_id WHERE p.user_id = ? AND p.updated_at >= ? GROUP BY p.id ORDER BY p.updated_at LIMIT 500").bind(userId, since).all();
      return json({ products: results });
    }
    if (request.method === "GET" && url.pathname === "/api/movements") {
      if (!userId) return json({ error: "Connexion requise." }, 401);
      const since = url.searchParams.get("since") || "1970-01-01T00:00:00.000Z";
      const { results } = await env.DB.prepare("SELECT m.uuid, p.barcode, m.qty, m.type, m.ref_id AS refId, m.created_at AS createdAt FROM stock_movements m JOIN products p ON p.id=m.product_id AND p.user_id=m.user_id WHERE m.user_id=? AND m.created_at>=? ORDER BY m.created_at LIMIT 5000").bind(userId, since).all();
      return json({ movements: results });
    }
    if (request.method === "GET" && url.pathname === "/api/reports/daily") {
      if (!userId) return json({ error: "Connexion requise." }, 401);
      const date = url.searchParams.get("date");
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ error: "Date invalide." }, 400);
      const from = date + "T00:00:00.000Z";
      const to = new Date(Date.parse(from) + 86400000).toISOString();
      const totals = await env.DB.prepare("SELECT COUNT(*) AS count, COALESCE(SUM(total),0) AS revenue FROM sales WHERE user_id = ? AND created_at >= ? AND created_at < ?").bind(userId, from, to).first();
      const margin = await env.DB.prepare("SELECT COALESCE(SUM((unit_price-cost)*qty),0) AS margin FROM sale_items WHERE user_id = ? AND sale_id IN (SELECT id FROM sales WHERE user_id = ? AND created_at >= ? AND created_at < ?)").bind(userId, userId, from, to).first("margin");
      const { results: top } = await env.DB.prepare("SELECT p.name, SUM(i.qty) AS qty, SUM(i.qty*i.unit_price) AS total FROM sale_items i JOIN products p ON p.id=i.product_id AND p.user_id=i.user_id JOIN sales s ON s.id=i.sale_id AND s.user_id=i.user_id WHERE i.user_id=? AND s.created_at>=? AND s.created_at<? GROUP BY p.id ORDER BY qty DESC LIMIT 5").bind(userId, from, to).all();
      return json({ revenue: totals?.revenue || 0, margin: margin || 0, salesCount: totals?.count || 0, top });
    }
    if (request.method === "POST" && url.pathname === "/api/sync") {
      if (!userId) return json({ error: "Connectez-vous pour synchroniser les données." }, 401);
      let body;
      try { body = await request.json(); } catch { return json({ error: "Corps JSON invalide." }, 400); }
      const products = Array.isArray(body.products) ? body.products : [];
      const sales = Array.isArray(body.sales) ? body.sales : [];
      const movements = Array.isArray(body.movements) ? body.movements : [];
      if (products.length + sales.length + movements.length > 300) return json({ error: "Limite de 300 éléments par lot." }, 413);
      let processed = 0;
      let ignored = 0;
      const receiptExists = async (kind, uuid) => !!(await env.DB.prepare("SELECT 1 FROM sync_receipts WHERE user_id=? AND kind=? AND uuid=?").bind(userId, kind, uuid).first());
      const commitOnce = async (kind, uuid, statements) => {
        try { await env.DB.batch(statements); return true; }
        catch (error) { if (await receiptExists(kind, uuid)) return false; throw error; }
      };

      for (const product of products) {
        if (!product || !isUuid(product.uuid) || !Number.isSafeInteger(product.id) || typeof product.barcode !== "string" || !product.barcode || typeof product.name !== "string" || !finite(product.price) || !finite(product.cost) || !Number.isInteger(product.minStock)) return json({ error: "Produit invalide." }, 400);
        if (await receiptExists("product", product.uuid)) { ignored++; continue; }
        const inserted = await commitOnce("product", product.uuid, [
          env.DB.prepare("INSERT INTO products(user_id,barcode,name,price,cost,min_stock,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(user_id,barcode) DO UPDATE SET name=excluded.name,price=excluded.price,cost=excluded.cost,min_stock=excluded.min_stock,updated_at=excluded.updated_at WHERE excluded.updated_at>=products.updated_at").bind(userId, product.barcode, product.name.slice(0, 180), product.price, product.cost, Math.max(0, product.minStock), product.updatedAt || new Date().toISOString()),
          env.DB.prepare("INSERT INTO product_links(user_id,local_id,product_id) SELECT ?, ?, id FROM products WHERE user_id=? AND barcode=? ON CONFLICT(user_id,local_id) DO UPDATE SET product_id=excluded.product_id").bind(userId, product.id, userId, product.barcode),
          env.DB.prepare("INSERT INTO sync_receipts(user_id,kind,uuid) VALUES(?,?,?)").bind(userId, "product", product.uuid)
        ]);
        if (inserted) processed++; else ignored++;
      }

      for (const sale of sales) {
        if (!sale || !isUuid(sale.uuid) || !finite(sale.total) || sale.total < 0 || typeof sale.createdAt !== "string" || !["espèces", "mobile money", "carte"].includes(sale.paymentMethod)) return json({ error: "Vente invalide." }, 400);
        if (await receiptExists("sale", sale.uuid)) { ignored++; continue; }
        const localItems = Array.isArray(sale.items) ? sale.items : [];
        // Les lignes peuvent aussi être fournies à la racine par le client.
        const items = localItems.length ? localItems : (Array.isArray(body.saleItems) ? body.saleItems.filter((item) => item.saleUuid === sale.uuid) : []);
        const mapped = [];
        for (const item of items) {
          const link = item.barcode ? await env.DB.prepare("SELECT id FROM products WHERE user_id=? AND barcode=?").bind(userId, item.barcode).first("id") : await env.DB.prepare("SELECT product_id FROM product_links WHERE user_id=? AND local_id=?").bind(userId, item.productId).first("product_id");
          if (!link) return json({ error: "Produit absent du serveur; relancez la synchronisation." }, 409);
          if (!Number.isInteger(item.qty) || item.qty < 1 || !finite(item.unitPrice) || !finite(item.cost)) return json({ error: "Ligne de vente invalide." }, 400);
          mapped.push({ ...item, serverProductId: link });
        }
        const insertions = [
          env.DB.prepare("INSERT INTO sales(user_id,uuid,total,payment_method,created_at) VALUES(?,?,?,?,?)").bind(userId, sale.uuid, sale.total, sale.paymentMethod, sale.createdAt),
          env.DB.prepare("INSERT INTO sync_receipts(user_id,kind,uuid) VALUES(?,?,?)").bind(userId, "sale", sale.uuid)
        ];
        for (const item of mapped) insertions.push(env.DB.prepare("INSERT INTO sale_items(user_id,sale_id,product_id,qty,unit_price,cost) SELECT ?, id, ?, ?, ?, ? FROM sales WHERE user_id=? AND uuid=?").bind(userId, item.serverProductId, item.qty, item.unitPrice, item.cost, userId, sale.uuid));
        const inserted = await commitOnce("sale", sale.uuid, insertions);
        if (inserted) processed++; else ignored++;
      }

      for (const movement of movements) {
        if (!movement || !isUuid(movement.uuid) || !Number.isSafeInteger(movement.productId) || !Number.isInteger(movement.qty) || movement.qty === 0 || !["achat", "vente", "ajustement"].includes(movement.type) || typeof movement.refId !== "string" || typeof movement.createdAt !== "string") return json({ error: "Mouvement invalide." }, 400);
        if (await receiptExists("movement", movement.uuid)) { ignored++; continue; }
        const productId = movement.barcode ? await env.DB.prepare("SELECT id FROM products WHERE user_id=? AND barcode=?").bind(userId, movement.barcode).first("id") : await env.DB.prepare("SELECT product_id FROM product_links WHERE user_id=? AND local_id=?").bind(userId, movement.productId).first("product_id");
        if (!productId) return json({ error: "Produit absent du serveur; relancez la synchronisation." }, 409);
        const inserted = await commitOnce("movement", movement.uuid, [
          env.DB.prepare("INSERT INTO stock_movements(user_id,uuid,product_id,qty,type,ref_id,created_at) VALUES(?,?,?,?,?,?,?)").bind(userId, movement.uuid, productId, movement.qty, movement.type, movement.refId.slice(0, 100), movement.createdAt),
          env.DB.prepare("INSERT INTO sync_receipts(user_id,kind,uuid) VALUES(?,?,?)").bind(userId, "movement", movement.uuid)
        ]);
        if (inserted) processed++; else ignored++;
      }
      return json({ ok: true, processed, ignored });
    }
    return json({ error: "Route introuvable." }, 404);
  }
};
