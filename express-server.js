// Backend autonome Railway/Render : Express + SQLite + bcrypt + sessions JWT.
const express = require("express");
const Database = require("better-sqlite3");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("node:path");
const app = express();
const db = new Database(process.env.DB_FILE || path.join(__dirname, "epicerie.sqlite"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error("JWT_SECRET doit contenir au moins 32 caractères.");
app.use(express.json({ limit: "1mb" }));
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "").split(",").map((value) => value.trim()).filter(Boolean);
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (allowedOrigins.includes(origin) || allowedOrigins.includes("*"))) { res.setHeader("Access-Control-Allow-Origin", allowedOrigins.includes("*") ? "*" : origin); res.setHeader("Vary", "Origin"); }
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type"); res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204); next();
});
function ensureColumn(table, column, declaration) {
  const tableExists = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(table);
  if (!tableExists) return;
  const exists = db.prepare("PRAGMA table_info(" + table + ")").all().some((row) => row.name === column);
  if (!exists) db.exec("ALTER TABLE " + table + " ADD COLUMN " + column + " " + declaration);
}
function migrateLegacyBarcodeUniqueness() {
  const legacyIndex = db.prepare("PRAGMA index_list(products)").all().find((index) => {
    if (!index.unique) return false;
    const columns = db.prepare("PRAGMA index_info('" + String(index.name).replaceAll("'", "''") + "')").all();
    return columns.length === 1 && columns[0].name === "barcode";
  });
  if (!legacyIndex) return;
  db.pragma("foreign_keys = OFF");
  try {
    db.exec("BEGIN IMMEDIATE; ALTER TABLE products RENAME TO products_legacy_v1; CREATE TABLE products (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,barcode TEXT NOT NULL,name TEXT NOT NULL,name_ar TEXT,price REAL NOT NULL,cost REAL NOT NULL,min_stock INTEGER NOT NULL DEFAULT 0,updated_at TEXT NOT NULL,UNIQUE(user_id,barcode)); INSERT INTO products(id,user_id,barcode,name,name_ar,price,cost,min_stock,updated_at) SELECT id,user_id,barcode,name,name_ar,price,cost,min_stock,updated_at FROM products_legacy_v1; DROP TABLE products_legacy_v1; COMMIT;");
    db.exec("CREATE INDEX IF NOT EXISTS products_user ON products(user_id); CREATE INDEX IF NOT EXISTS products_user_updated ON products(user_id,updated_at);");
  } catch (error) { try { db.exec("ROLLBACK"); } catch {} throw error; }
  finally { db.pragma("foreign_keys = ON"); }
}
function migrateLegacyUuidConstraints() {
  const migrations = [
    {table:"sales",columns:["uuid"],create:"CREATE TABLE sales_rebuilt(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,uuid TEXT NOT NULL,total REAL NOT NULL,payment_method TEXT NOT NULL,created_at TEXT NOT NULL,UNIQUE(user_id,uuid))",copy:"INSERT INTO sales_rebuilt(id,user_id,uuid,total,payment_method,created_at) SELECT id,user_id,uuid,total,payment_method,created_at FROM sales_legacy_v1",indexes:"CREATE INDEX IF NOT EXISTS sales_user ON sales(user_id); CREATE INDEX IF NOT EXISTS sales_user_date ON sales(user_id,created_at)"},
    {table:"stock_movements",columns:["uuid"],create:"CREATE TABLE movements_rebuilt(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,uuid TEXT NOT NULL,product_id INTEGER NOT NULL,qty INTEGER NOT NULL,type TEXT NOT NULL,ref_id TEXT NOT NULL,created_at TEXT NOT NULL,UNIQUE(user_id,uuid))",copy:"INSERT INTO movements_rebuilt(id,user_id,uuid,product_id,qty,type,ref_id,created_at) SELECT id,user_id,uuid,product_id,qty,type,ref_id,created_at FROM stock_movements_legacy_v1",indexes:"CREATE INDEX IF NOT EXISTS movements_user ON stock_movements(user_id); CREATE INDEX IF NOT EXISTS movements_user_date ON stock_movements(user_id,created_at); CREATE INDEX IF NOT EXISTS movements_user_product ON stock_movements(user_id,product_id)"},
    {table:"sync_receipts",columns:["kind","uuid"],create:"CREATE TABLE receipts_rebuilt(user_id INTEGER NOT NULL,kind TEXT NOT NULL,uuid TEXT NOT NULL,PRIMARY KEY(user_id,kind,uuid))",copy:"INSERT INTO receipts_rebuilt(user_id,kind,uuid) SELECT user_id,kind,uuid FROM sync_receipts_legacy_v1",indexes:"CREATE INDEX IF NOT EXISTS sync_receipts_user ON sync_receipts(user_id)"}
  ];
  for (const migration of migrations) {
    const exists=db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(migration.table);if(!exists)continue;
    const legacy=db.prepare("PRAGMA index_list("+migration.table+")").all().some((index)=>{if(!index.unique)return false;const columns=db.prepare("PRAGMA index_info('"+String(index.name).replaceAll("'","''")+"')").all().map((column)=>column.name);return columns.length===migration.columns.length&&migration.columns.every((column,index)=>columns[index]===column);});
    if(!legacy)continue;
    db.pragma("foreign_keys = OFF");
    try{db.exec("BEGIN IMMEDIATE; ALTER TABLE "+migration.table+" RENAME TO "+migration.table+"_legacy_v1; "+migration.create+"; "+migration.copy+"; DROP TABLE "+migration.table+"_legacy_v1; ALTER TABLE "+migration.table.replace("stock_movements","movements").replace("sync_receipts","receipts")+"_rebuilt RENAME TO "+migration.table+"; COMMIT;");db.exec(migration.indexes);}catch(error){try{db.exec("ROLLBACK");}catch{}throw error;}finally{db.pragma("foreign_keys = ON");}
  }
}
function initializeSchema() {
  // Ajouter les colonnes avant les nouveaux index pour les bases existantes.
  ensureColumn("products", "user_id", "INTEGER NOT NULL DEFAULT 1"); ensureColumn("products", "name_ar", "TEXT");
  ensureColumn("sales", "user_id", "INTEGER NOT NULL DEFAULT 1"); ensureColumn("sale_items", "user_id", "INTEGER NOT NULL DEFAULT 1");
  ensureColumn("stock_movements", "user_id", "INTEGER NOT NULL DEFAULT 1"); ensureColumn("sync_receipts", "user_id", "INTEGER NOT NULL DEFAULT 1");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('admin','shop')),shop_name TEXT,preferred_lang TEXT NOT NULL DEFAULT 'fr' CHECK(preferred_lang IN ('fr','ar')),created_at TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires_at TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY,value TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
    CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL REFERENCES users(id),barcode TEXT NOT NULL,name TEXT NOT NULL,name_ar TEXT,price REAL NOT NULL,cost REAL NOT NULL,min_stock INTEGER NOT NULL DEFAULT 0,updated_at TEXT NOT NULL,UNIQUE(user_id,barcode));
    CREATE INDEX IF NOT EXISTS products_user ON products(user_id);
    CREATE INDEX IF NOT EXISTS products_user_updated ON products(user_id,updated_at);
    CREATE TABLE IF NOT EXISTS product_links (user_id INTEGER NOT NULL,local_id INTEGER NOT NULL,product_id INTEGER NOT NULL REFERENCES products(id),PRIMARY KEY(user_id,local_id));
    CREATE TABLE IF NOT EXISTS sales (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL REFERENCES users(id),uuid TEXT NOT NULL,total REAL NOT NULL,payment_method TEXT NOT NULL,created_at TEXT NOT NULL,UNIQUE(user_id,uuid));
    CREATE INDEX IF NOT EXISTS sales_user ON sales(user_id);
    CREATE INDEX IF NOT EXISTS sales_user_date ON sales(user_id,created_at);
    CREATE TABLE IF NOT EXISTS sale_items (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL REFERENCES users(id),sale_id INTEGER NOT NULL REFERENCES sales(id),product_id INTEGER NOT NULL REFERENCES products(id),qty INTEGER NOT NULL,unit_price REAL NOT NULL,cost REAL NOT NULL);
    CREATE INDEX IF NOT EXISTS sale_items_user ON sale_items(user_id);
    CREATE TABLE IF NOT EXISTS stock_movements (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL REFERENCES users(id),uuid TEXT NOT NULL,product_id INTEGER NOT NULL REFERENCES products(id),qty INTEGER NOT NULL,type TEXT NOT NULL,ref_id TEXT NOT NULL,created_at TEXT NOT NULL,UNIQUE(user_id,uuid));
    CREATE INDEX IF NOT EXISTS movements_user ON stock_movements(user_id);
    CREATE INDEX IF NOT EXISTS movements_user_date ON stock_movements(user_id,created_at);
    CREATE INDEX IF NOT EXISTS movements_user_product ON stock_movements(user_id,product_id);
    CREATE TABLE IF NOT EXISTS sync_receipts (user_id INTEGER NOT NULL REFERENCES users(id),kind TEXT NOT NULL,uuid TEXT NOT NULL,PRIMARY KEY(user_id,kind,uuid));
    CREATE INDEX IF NOT EXISTS sync_receipts_user ON sync_receipts(user_id);
  `);
  // Colonnes de transition pour la base historique mono-boutique.
  ensureColumn("products", "user_id", "INTEGER NOT NULL DEFAULT 1"); ensureColumn("products", "name_ar", "TEXT");
  ensureColumn("sales", "user_id", "INTEGER NOT NULL DEFAULT 1"); ensureColumn("sale_items", "user_id", "INTEGER NOT NULL DEFAULT 1");
  ensureColumn("stock_movements", "user_id", "INTEGER NOT NULL DEFAULT 1"); ensureColumn("sync_receipts", "user_id", "INTEGER NOT NULL DEFAULT 1");
  migrateLegacyBarcodeUniqueness();
  migrateLegacyUuidConstraints();
}
const userInfo = (row) => ({ id: row.id, email: row.email, role: row.role, shopName: row.shop_name, preferredLang: row.preferred_lang, active: Boolean(row.active) });
let findUser, insertSession, hasReceipt, addReceipt, findProduct;
const issueToken = (user) => jwt.sign({ sub: String(user.id), role: user.role }, process.env.JWT_SECRET, { expiresIn: "30d", issuer: "epicerie" });
function auth(requiredRole) {
  return (req, res, next) => {
    const token = /^Bearer (.+)$/i.exec(req.get("authorization") || "")?.[1];
    if (!token) return res.status(401).json({ error: "TOKEN_EXPIRED" });
    let claims;
    try { claims = jwt.verify(token, process.env.JWT_SECRET, { issuer: "epicerie" }); }
    catch (error) { return res.status(401).json({ error: error.name === "TokenExpiredError" ? "TOKEN_EXPIRED" : "INVALID_TOKEN" }); }
    const session = db.prepare("SELECT expires_at FROM sessions WHERE token=? AND user_id=?").get(token, Number(claims.sub));
    if (!session || Date.parse(session.expires_at) <= Date.now()) { db.prepare("DELETE FROM sessions WHERE token=?").run(token); return res.status(401).json({ error: "TOKEN_EXPIRED" }); }
    const user = findUser.get(Number(claims.sub));
    if (!user?.active) return res.status(401).json({ error: "TOKEN_EXPIRED" });
    req.userId=user.id; req.role=user.role; req.user=user; req.authToken=token;
    if (requiredRole && req.role !== requiredRole) return res.status(403).json({ error: "FORBIDDEN" }); next();
  };
}
app.post("/api/auth/login", async (req,res) => {
  const email=String(req.body?.email || "").trim().toLowerCase(), password=String(req.body?.password || "");
  const user=db.prepare("SELECT * FROM users WHERE email=?").get(email);
  if (!user?.active || !(await bcrypt.compare(password,user.password_hash))) return res.status(401).json({error:"INVALID_CREDENTIALS"});
  const token=issueToken(user), now=new Date().toISOString(); insertSession.run(token,user.id,new Date(Date.now()+30*86400000).toISOString(),now);
  res.json({token,user:userInfo(user)});
});
app.use("/api", (req,res,next) => req.path === "/auth/login" ? next() : auth()(req,res,next));
app.post("/api/auth/logout", (req,res) => { db.prepare("DELETE FROM sessions WHERE token=?").run(req.authToken); res.status(204).end(); });
app.get("/api/auth/me", (req,res) => res.json(userInfo(req.user)));
app.patch("/api/auth/language", (req,res) => { const lang=req.body?.lang; if (!["fr","ar"].includes(lang)) return res.status(400).json({error:"INVALID_INPUT"}); db.prepare("UPDATE users SET preferred_lang=? WHERE id=?").run(lang,req.userId); res.json({preferredLang:lang}); });

app.post("/api/admin/users", auth("admin"), async (req,res) => {
  const email=String(req.body?.email || "").trim().toLowerCase(), password=String(req.body?.password || ""), shopName=String(req.body?.shopName || "").trim(), lang=req.body?.preferredLang === "ar" ? "ar" : "fr";
  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 10 || !shopName) return res.status(400).json({error:!shopName?"SHOP_NAME_REQUIRED":"INVALID_INPUT"});
  try { const hash=await bcrypt.hash(password,12); const result=db.prepare("INSERT INTO users(email,password_hash,role,shop_name,preferred_lang,created_at,active) VALUES(?,?,'shop',?,?,?,1)").run(email,hash,shopName,lang,new Date().toISOString()); res.status(201).json(userInfo(findUser.get(result.lastInsertRowid))); }
  catch (error) { if (String(error.code).includes("CONSTRAINT")) return res.status(409).json({error:"EMAIL_IN_USE"}); throw error; }
});
app.get("/api/admin/users", auth("admin"), (req,res) => {
  const users=db.prepare("SELECT u.id,u.email,u.shop_name,u.preferred_lang,u.created_at,u.active,COUNT(s.id) AS sales_count FROM users u LEFT JOIN sales s ON s.user_id=u.id WHERE u.role='shop' GROUP BY u.id ORDER BY u.created_at DESC").all();
  res.json({users:users.map((row)=>({id:row.id,email:row.email,shopName:row.shop_name,preferredLang:row.preferred_lang,createdAt:row.created_at,active:Boolean(row.active),salesCount:row.sales_count}))});
});
app.patch("/api/admin/users/:id", auth("admin"), async (req,res) => {
  const id=Number(req.params.id), target=findUser.get(id), updates=req.body || {}; if (!target || target.role !== "shop") return res.status(404).json({error:"USER_NOT_FOUND"});
  if (typeof updates.active === "boolean") db.prepare("UPDATE users SET active=? WHERE id=?").run(updates.active?1:0,id);
  if (typeof updates.shopName === "string" && updates.shopName.trim()) db.prepare("UPDATE users SET shop_name=? WHERE id=?").run(updates.shopName.trim(),id);
  if (typeof updates.password === "string") { if (updates.password.length<10) return res.status(400).json({error:"INVALID_INPUT"}); const hash=await bcrypt.hash(updates.password,12); db.prepare("UPDATE users SET password_hash=? WHERE id=?").run(hash,id); db.prepare("DELETE FROM sessions WHERE user_id=?").run(id); }
  res.json(userInfo(findUser.get(id)));
});

app.post("/api/sync", (req,res) => {
  const {products=[],sales=[],movements=[]}=req.body || {}; if (![products,sales,movements].every(Array.isArray)||products.length+sales.length+movements.length>300) return res.status(400).json({error:"INVALID_INPUT"});
  let processed=0,ignored=0;
  try { db.transaction(()=>{
    for (const p of products) {
      if (!p.uuid||!Number.isSafeInteger(p.id)||!p.barcode||!p.name||!Number.isFinite(p.price)||!Number.isFinite(p.cost)) throw Object.assign(new Error(),{code:"INVALID_INPUT"});
      if (hasReceipt.get(req.userId,"product",p.uuid)){ignored++;continue;}
      db.prepare("INSERT INTO products(user_id,barcode,name,name_ar,price,cost,min_stock,updated_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(user_id,barcode) DO UPDATE SET name=excluded.name,name_ar=excluded.name_ar,price=excluded.price,cost=excluded.cost,min_stock=excluded.min_stock,updated_at=excluded.updated_at WHERE excluded.updated_at>=products.updated_at").run(req.userId,p.barcode,p.name.slice(0,180),p.nameAr||null,p.price,p.cost,Math.max(0,p.minStock|0),p.updatedAt||new Date().toISOString());
      const found=findProduct.get(req.userId,p.barcode); db.prepare("INSERT INTO product_links(user_id,local_id,product_id) VALUES(?,?,?) ON CONFLICT(user_id,local_id) DO UPDATE SET product_id=excluded.product_id").run(req.userId,p.id,found.id); addReceipt.run(req.userId,"product",p.uuid); processed++;
    }
    for (const sale of sales) {
      if (!sale.uuid||!Number.isFinite(sale.total)||!["espèces","mobile money","carte"].includes(sale.paymentMethod)) throw Object.assign(new Error(),{code:"INVALID_INPUT"});
      if (hasReceipt.get(req.userId,"sale",sale.uuid)){ignored++;continue;}
      const saved=db.prepare("INSERT INTO sales(user_id,uuid,total,payment_method,created_at) VALUES(?,?,?,?,?)").run(req.userId,sale.uuid,sale.total,sale.paymentMethod,sale.createdAt);
      for (const item of sale.items||[]) { const product=item.barcode?findProduct.get(req.userId,item.barcode):db.prepare("SELECT product_id AS id FROM product_links WHERE user_id=? AND local_id=?").get(req.userId,item.productId); if (!product) throw Object.assign(new Error(),{code:"PRODUCT_NOT_FOUND"}); db.prepare("INSERT INTO sale_items(user_id,sale_id,product_id,qty,unit_price,cost) VALUES(?,?,?,?,?,?)").run(req.userId,saved.lastInsertRowid,product.id,item.qty,item.unitPrice,item.cost); }
      addReceipt.run(req.userId,"sale",sale.uuid); processed++;
    }
    for (const m of movements) {
      if (!m.uuid||!Number.isInteger(m.qty)||!m.qty||!["achat","vente","ajustement"].includes(m.type)) throw Object.assign(new Error(),{code:"INVALID_INPUT"});
      if (hasReceipt.get(req.userId,"movement",m.uuid)){ignored++;continue;}
      const product=m.barcode?findProduct.get(req.userId,m.barcode):db.prepare("SELECT product_id AS id FROM product_links WHERE user_id=? AND local_id=?").get(req.userId,m.productId); if (!product) throw Object.assign(new Error(),{code:"PRODUCT_NOT_FOUND"});
      if(m.type==="vente"){const current=db.prepare("SELECT COALESCE(SUM(qty),0) AS qty FROM stock_movements WHERE user_id=? AND product_id=?").get(req.userId,product.id).qty;if(current+m.qty<0){const names=db.prepare("SELECT name,name_ar FROM products WHERE user_id=? AND id=?").get(req.userId,product.id);const name=req.get("accept-language")==="ar"?(names?.name_ar||names?.name):names?.name||"";throw Object.assign(new Error(),{code:"STOCK_INSUFFICIENT",productName:name});}}
      db.prepare("INSERT INTO stock_movements(user_id,uuid,product_id,qty,type,ref_id,created_at) VALUES(?,?,?,?,?,?,?)").run(req.userId,m.uuid,product.id,m.qty,m.type,m.refId,m.createdAt); addReceipt.run(req.userId,"movement",m.uuid); processed++;
    }
  })(); res.json({ok:true,processed,ignored}); } catch(error) { res.status(error.code==="PRODUCT_NOT_FOUND"?409:400).json({error:error.code||"INVALID_INPUT",...(error.productName?{productName:error.productName}:{})}); }
});
app.get("/api/products", (req,res) => { const since=req.query.since||"1970-01-01T00:00:00.000Z"; const products=db.prepare("SELECT p.id,p.barcode,p.name,p.name_ar AS nameAr,p.price,p.cost,p.min_stock AS minStock,p.updated_at AS updatedAt,COALESCE(SUM(m.qty),0) AS stock FROM products p LEFT JOIN stock_movements m ON m.product_id=p.id AND m.user_id=p.user_id WHERE p.user_id=? AND p.updated_at>=? GROUP BY p.id ORDER BY p.updated_at LIMIT 1000").all(req.userId,since); res.json({products}); });
app.get("/api/movements", (req,res) => { const since=req.query.since||"1970-01-01T00:00:00.000Z"; const movements=db.prepare("SELECT m.uuid,p.barcode,m.qty,m.type,m.ref_id AS refId,m.created_at AS createdAt FROM stock_movements m JOIN products p ON p.id=m.product_id AND p.user_id=m.user_id WHERE m.user_id=? AND m.created_at>=? ORDER BY m.created_at LIMIT 5000").all(req.userId,since); res.json({movements}); });
app.get("/api/reports/daily", (req,res) => {
  const date=req.query.date; if (!/^\d{4}-\d{2}-\d{2}$/.test(date||"")) return res.status(400).json({error:"INVALID_INPUT"}); const from=date+"T00:00:00.000Z",to=new Date(Date.parse(from)+86400000).toISOString();
  const totals=db.prepare("SELECT COUNT(*) AS salesCount,COALESCE(SUM(total),0) AS revenue FROM sales WHERE user_id=? AND created_at>=? AND created_at<?").get(req.userId,from,to), margin=db.prepare("SELECT COALESCE(SUM((unit_price-cost)*qty),0) AS margin FROM sale_items WHERE user_id=? AND sale_id IN (SELECT id FROM sales WHERE user_id=? AND created_at>=? AND created_at<?)").get(req.userId,req.userId,from,to).margin;
  const top=db.prepare("SELECT p.name,p.name_ar AS nameAr,SUM(i.qty) AS qty,SUM(i.qty*i.unit_price) AS total FROM sale_items i JOIN products p ON p.id=i.product_id AND p.user_id=i.user_id JOIN sales s ON s.id=i.sale_id AND s.user_id=i.user_id WHERE i.user_id=? AND s.created_at>=? AND s.created_at<? GROUP BY p.id ORDER BY qty DESC LIMIT 5").all(req.userId,from,to); res.json({...totals,margin,top});
});
app.use("/api", (req,res) => res.status(404).json({error:"NOT_FOUND"}));
app.use("/api", (error, req, res, next) => { if (res.headersSent) return next(error); console.error("API error", error); res.status(500).json({ error: "UNKNOWN" }); });

async function start(){
  initializeSchema();
  findUser=db.prepare("SELECT id,email,role,shop_name,preferred_lang,active FROM users WHERE id=?");
  insertSession=db.prepare("INSERT INTO sessions(token,user_id,expires_at,created_at) VALUES(?,?,?,?)");
  hasReceipt=db.prepare("SELECT 1 FROM sync_receipts WHERE user_id=? AND kind=? AND uuid=?");
  addReceipt=db.prepare("INSERT INTO sync_receipts(user_id,kind,uuid) VALUES(?,?,?)");
  findProduct=db.prepare("SELECT id FROM products WHERE user_id=? AND barcode=?");
  if(!process.env.ADMIN_EMAIL||!process.env.ADMIN_PASSWORD) throw new Error("Configurer ADMIN_EMAIL et ADMIN_PASSWORD pour créer le compte administrateur initial.");
  if(!db.prepare("SELECT 1 FROM users WHERE role='admin'").get()) db.prepare("INSERT INTO users(email,password_hash,role,shop_name,preferred_lang,created_at,active) VALUES(?,?,'admin',NULL,'fr',?,1)").run(process.env.ADMIN_EMAIL.trim().toLowerCase(),await bcrypt.hash(process.env.ADMIN_PASSWORD,12),new Date().toISOString());
  if(process.env.LEGACY_SHOP_EMAIL&&process.env.LEGACY_SHOP_PASSWORD&&process.env.LEGACY_SHOP_NAME&&!db.prepare("SELECT 1 FROM app_meta WHERE key='legacy-store-moved'").get()){
    const oldRows=db.prepare("SELECT (SELECT COUNT(*) FROM products WHERE user_id=1)+(SELECT COUNT(*) FROM sales WHERE user_id=1)+(SELECT COUNT(*) FROM stock_movements WHERE user_id=1) AS total").get().total;
    if(oldRows){let shop=db.prepare("SELECT id FROM users WHERE email=? AND role='shop'").get(process.env.LEGACY_SHOP_EMAIL.trim().toLowerCase());if(!shop){const hash=await bcrypt.hash(process.env.LEGACY_SHOP_PASSWORD,12),created=db.prepare("INSERT INTO users(email,password_hash,role,shop_name,preferred_lang,created_at,active) VALUES(?,?,'shop',?,'fr',?,1)").run(process.env.LEGACY_SHOP_EMAIL.trim().toLowerCase(),hash,process.env.LEGACY_SHOP_NAME.trim(),new Date().toISOString());shop={id:created.lastInsertRowid};}const moveLegacy=db.transaction(()=>{for(const table of ["products","sales","sale_items","stock_movements","sync_receipts","product_links"])db.prepare("UPDATE "+table+" SET user_id=? WHERE user_id=1").run(shop.id);db.prepare("INSERT INTO app_meta(key,value) VALUES('legacy-store-moved',?)").run(String(shop.id));});moveLegacy();}
  }
  db.prepare("DELETE FROM sessions WHERE expires_at<=?").run(new Date().toISOString()); const port=Number(process.env.PORT||3001); app.listen(port,"0.0.0.0",()=>console.log("Épicerie API en écoute sur "+port));
}
start().catch((error)=>{console.error(error);process.exit(1);});
