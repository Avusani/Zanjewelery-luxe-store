/* ============================================================
   ZanJewelry — server + database + admin API
   ============================================================ */
const express = require("express");
const Database = require("better-sqlite3");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "ZanJewelry2025!";
const WHATSAPP = process.env.WHATSAPP_NUMBER || "27703887170";
const DB_PATH = path.join(DATA_DIR, "zanjewelry.db");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/* ---------- Database ---------- */
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'ring',
  material TEXT NOT NULL DEFAULT 'gold',
  price REAL,
  stock INTEGER NOT NULL DEFAULT 0,
  image TEXT DEFAULT '',
  description TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);
`);

/* Seed sample catalogue on first run */
const count = db.prepare("SELECT COUNT(*) AS c FROM products").get().c;
if (count === 0) {
  const seed = [
    ["Halo Cluster Engagement Ring","engagement","diamond",null,2,"cluster-1.jpg","A brilliant round cluster centre framed by a double halo, with pavé-set shoulders."],
    ["Sapphire Halo Engagement Ring","engagement","gemstone",null,1,"gemstone-1.jpg","A rich centre gem framed by a fine halo. Choose your centre stone on WhatsApp."],
    ["Baguette Eternity Wedding Band","wedding","diamond",null,1,"diamond-1.jpg","Alternating baguette and round diamonds set all the way around."],
    ["Classic Gold Wedding Bands (Pair)","wedding","gold",null,3,"gold-1.jpg","A pair of polished gold bands — hers with a single diamond, his classic comfort fit."],
    ["Platinum Comfort-Fit Band","wedding","platinum",null,2,"gold-1.jpg","A sleek platinum band with a soft inner curve for all-day comfort."],
    ["Sterling Silver Pavé Band","ring","silver",450,6,"diamond-1.jpg","Sterling silver band with pavé-style detailing. Perfect for stacking."],
    ["Amethyst Halo Ring","ring","gemstone",null,3,"gemstone-1.jpg","A centre amethyst framed by a fine halo — a rich splash of colour."],
    ["Gold Snowflake Ring","ring","gold",null,4,"cluster-1.jpg","Hand-finished gold band with a delicate snowflake silhouette."],
    ["Glow Lip Gloss Trio","cosmetic","none",220,8,"cosmetics-1.jpg","Three shades of high-shine gloss in one gift-ready set."],
    ["Rosewater Face Mist","cosmetic","none",180,10,"cosmetics-1.jpg","A light hydrating mist with rosewater to refresh skin any time of day."],
    ["Shea Whip Body Butter","cosmetic","none",195,6,"cosmetics-1.jpg","Whipped shea butter that melts into skin — rich moisture, no grease."],
    ["Velvet Matte Lipstick","cosmetic","none",160,12,"cosmetics-1.jpg","A comfortable, long-wear matte with a soft velvet finish."]
  ];
  const ins = db.prepare("INSERT INTO products (name,type,material,price,stock,image,description) VALUES (?,?,?,?,?,?,?)");
  seed.forEach(s => ins.run(...s));
}

/* ---------- App ---------- */
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(UPLOAD_DIR));
app.get("/admin", (req, res) => res.redirect("/admin.html"));

/* ---------- Image uploads ---------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname).toLowerCase() || ".jpg");
    const safe = file.originalname.replace(/[^a-z0-9\-_]/gi, "-").replace(/\.[^.]+$/, "").toLowerCase().slice(0, 40);
    cb(null, Date.now() + "-" + (safe || "photo") + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPG, PNG, WEBP or GIF images are allowed"));
  }
});

/* ---------- Auth (simple token sessions) ---------- */
const sessions = new Map();
function auth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (token && sessions.has(token)) { req.token = token; next(); }
  else res.status(401).json({ error: "Please log in again" });
}

app.post("/api/login", (req, res) => {
  if ((req.body || {}).password === ADMIN_PASSWORD) {
    const token = crypto.randomBytes(32).toString("hex");
    sessions.set(token, Date.now());
    res.json({ token });
  } else res.status(401).json({ error: "Wrong password" });
});

app.post("/api/logout", auth, (req, res) => { sessions.delete(req.token); res.json({ ok: true }); });

/* ---------- Public API ---------- */
app.get("/api/config", (req, res) => res.json({ whatsapp: WHATSAPP }));

app.get("/api/products", (req, res) => {
  res.json(db.prepare("SELECT * FROM products ORDER BY id DESC").all());
});

/* ---------- Admin API ---------- */
function parseProduct(body) {
  const name = String(body.name || "").trim();
  const type = ["ring","engagement","wedding","cosmetic"].includes(body.type) ? body.type : "ring";
  const material = ["diamond","gold","gemstone","silver","rose-gold","platinum","none"].includes(body.material) ? body.material : "gold";
  let price = body.price === "" || body.price == null ? null : Number(body.price);
  if (!Number.isFinite(price)) price = null;
  let stock = Number(body.stock);
  if (!Number.isFinite(stock) || stock < 0) stock = 0;
  const description = String(body.description || "").trim();
  const image = String(body.image || "").trim();
  return { name, type, material, price, stock, description, image };
}

app.post("/api/products", auth, upload.single("imageFile"), (req, res) => {
  const p = parseProduct(req.body);
  if (!p.name) return res.status(400).json({ error: "Name is required" });
  if (req.file) p.image = "/uploads/" + req.file.filename;
  const info = db.prepare(
    "INSERT INTO products (name,type,material,price,stock,image,description) VALUES (?,?,?,?,?,?,?)"
  ).run(p.name, p.type, p.material, p.price, p.stock, p.image, p.description);
  res.json(db.prepare("SELECT * FROM products WHERE id = ?").get(info.lastInsertRowid));
});

app.put("/api/products/:id", auth, upload.single("imageFile"), (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
  if (!existing) return res.status(404).json({ error: "Product not found" });
  const p = parseProduct(req.body);
  if (!p.name) return res.status(400).json({ error: "Name is required" });
  if (req.file) p.image = "/uploads/" + req.file.filename;
  else if (!p.image) p.image = existing.image;
  db.prepare(
    "UPDATE products SET name=?,type=?,material=?,price=?,stock=?,image=?,description=? WHERE id=?"
  ).run(p.name, p.type, p.material, p.price, p.stock, p.image, p.description, id);
  res.json(db.prepare("SELECT * FROM products WHERE id = ?").get(id));
});

app.delete("/api/products/:id", auth, (req, res) => {
  db.prepare("DELETE FROM products WHERE id = ?").run(Number(req.params.id));
  res.json({ ok: true });
});

/* Error handler (bad uploads etc.) */
app.use((err, req, res, next) => res.status(400).json({ error: err.message }));

app.listen(PORT, () => console.log(`ZanJewelry running → http://localhost:${PORT}`));
