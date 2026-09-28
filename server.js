/* ============================================================
   ZanJewelry — merged server (cookies + Bearer, volume-aware,
   type/material fields, legacy category/gem auto-migration)
   ============================================================ */
try { require('dotenv').config(); } catch (_) { /* .env optional */ }

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

/* ---------------- Config ---------------- */
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ChangeMeNow!';
const WHATSAPP = process.env.WHATSAPP_NUMBER || '27703887170';
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
/* Respect the Railway volume: set DATA_DIR=/data in Variables */
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');

[DATA_DIR, UPLOAD_DIR].forEach((d) => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

/* ---------------- Database (JSON file on your volume) ---------------- */
const readProducts = () => {
  try { return JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8')); }
  catch { return []; }
};
const writeProducts = (list) => fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(list, null, 2));

/* Field maps: accepts old (category/gem) AND new (type/material) input */
const TYPES = ['ring', 'engagement', 'wedding', 'cosmetic'];
const MATERIALS = ['diamond', 'gold', 'gemstone', 'silver', 'rose-gold', 'platinum', 'none'];
const TYPE_MAP = {
  rings: 'ring', ring: 'ring', engagement: 'engagement', 'engagement ring': 'engagement',
  wedding: 'wedding', 'wedding ring': 'wedding', cosmetics: 'cosmetic', cosmetic: 'cosmetic',
  'lotions, washes & soaps': 'cosmetic', 'body care': 'cosmetic'
};
const MAT_MAP = {
  diamond: 'diamond', gold: 'gold', silver: 'silver', platinum: 'platinum',
  'rose gold': 'rose-gold', 'rose-gold': 'rose-gold', gemstone: 'gemstone',
  gemstones: 'gemstone', 'coloured gemstones': 'gemstone', amethyst: 'gemstone',
  'silver / diamond': 'silver', none: 'none'
};
function normalizeProduct(b, existing) {
  const typeRaw = String(b.type || b.category || '').trim().toLowerCase();
  const matRaw = String(b.material || b.gem || '').trim().toLowerCase();
  let type = TYPE_MAP[typeRaw] || (TYPES.includes(typeRaw) ? typeRaw : null);
  let material = MAT_MAP[matRaw] || (MATERIALS.includes(matRaw) ? matRaw : null);
  if (!type) type = existing?.type || 'ring';
  if (!material) material = existing?.material || (type === 'cosmetic' ? 'none' : 'gold');
  let price = (b.price === '' || b.price == null) ? null : Number(b.price);
  if (!Number.isFinite(price)) price = null;
  let stock = Number(b.stock);
  if (!Number.isFinite(stock) || stock < 0) stock = 0;
  return {
    id: b.id || crypto.randomUUID(),
    name: String(b.name || '').trim() || (existing?.name || 'Untitled'),
    type, material, price, stock,
    image: String(b.image || existing?.image || '').trim(),
    description: String(b.description || existing?.description || '').trim()
  };
}

/* Migrate any old-format products (category/gem) into the new fields */
let products = readProducts();
if (!Array.isArray(products)) products = [];
let migrated = false;
products = products.map((p) => {
  if (!p.type || !p.material) { migrated = true; return normalizeProduct(p, p); }
  return p;
});

/* Seed catalogue on first run */
if (products.length === 0) {
  products = [
    { name: 'Halo Cluster Engagement Ring', type: 'engagement', material: 'diamond', price: null, stock: 2, image: 'cluster-1.jpg', description: 'A brilliant round cluster centre framed by a double halo, with pavé-set shoulders.' },
    { name: 'Sapphire Halo Engagement Ring', type: 'engagement', material: 'gemstone', price: null, stock: 1, image: 'gemstone-1.jpg', description: 'A rich centre gem framed by a fine halo. Choose your centre stone on WhatsApp.' },
    { name: 'Baguette Eternity Wedding Band', type: 'wedding', material: 'diamond', price: null, stock: 1, image: 'diamond-1.jpg', description: 'Alternating baguette and round diamonds set all the way around.' },
    { name: 'Classic Gold Wedding Bands (Pair)', type: 'wedding', material: 'gold', price: null, stock: 3, image: 'gold-1.jpg', description: 'A pair of polished gold bands — hers with a single diamond, his classic comfort fit.' },
    { name: 'Platinum Comfort-Fit Band', type: 'wedding', material: 'platinum', price: null, stock: 2, image: 'gold-1.jpg', description: 'A sleek platinum band with a soft inner curve for all-day comfort.' },
    { name: 'Sterling Silver Pavé Band', type: 'ring', material: 'silver', price: 450, stock: 6, image: 'diamond-1.jpg', description: 'Sterling silver band with pavé-style detailing. Perfect for stacking.' },
    { name: 'Amethyst Halo Ring', type: 'ring', material: 'gemstone', price: null, stock: 3, image: 'gemstone-1.jpg', description: 'A centre amethyst framed by a fine halo — a rich splash of colour.' },
    { name: 'Gold Snowflake Ring', type: 'ring', material: 'gold', price: null, stock: 4, image: 'cluster-1.jpg', description: 'Hand-finished gold band with a delicate snowflake silhouette.' },
    { name: 'Glow Lip Gloss Trio', type: 'cosmetic', material: 'none', price: 220, stock: 8, image: 'cosmetics-1.jpg', description: 'Three shades of high-shine gloss in one gift-ready set — nude, rose and berry.' },
    { name: 'Rosewater Face Mist', type: 'cosmetic', material: 'none', price: 180, stock: 10, image: 'cosmetics-1.jpg', description: 'A light hydrating mist with rosewater to refresh skin any time of day.' },
    { name: 'Shea Whip Body Butter', type: 'cosmetic', material: 'none', price: 195, stock: 6, image: 'cosmetics-1.jpg', description: 'Whipped shea butter that melts into skin — rich moisture, no grease.' },
    { name: 'Velvet Matte Lipstick', type: 'cosmetic', material: 'none', price: 160, stock: 12, image: 'cosmetics-1.jpg', description: 'A comfortable, long-wear matte with a soft velvet finish.' }
  ].map((p) => ({ id: crypto.randomUUID(), ...p }));
}
/* Ensure cosmetics exist even on older databases */
if (!products.some((p) => p.type === 'cosmetic')) {
  [
    { name: 'Glow Lip Gloss Trio', price: 220, stock: 8, description: 'Three shades of high-shine gloss in one gift-ready set — nude, rose and berry.' },
    { name: 'Rosewater Face Mist', price: 180, stock: 10, description: 'A light hydrating mist with rosewater to refresh skin any time of day.' },
    { name: 'Shea Whip Body Butter', price: 195, stock: 6, description: 'Whipped shea butter that melts into skin — rich moisture, no grease.' },
    { name: 'Velvet Matte Lipstick', price: 160, stock: 12, description: 'A comfortable, long-wear matte with a soft velvet finish.' }
  ].forEach((c) => products.push({ id: crypto.randomUUID(), type: 'cosmetic', material: 'none', image: 'cosmetics-1.jpg', ...c }));
}
writeProducts(products);

/* ---------------- Middleware ---------------- */
app.set('trust proxy', 1);
app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));
app.use('/uploads', express.static(UPLOAD_DIR));

/* ---------------- Uploads ---------------- */
const upload = multer({
  storage: multer.diskStorage({
    destination: (_r, _f, cb) => cb(null, UPLOAD_DIR),
    filename: (_r, file, cb) => {
      const safe = file.originalname.replace(/[^a-z0-9.\-_]/gi, '_').toLowerCase();
      cb(null, `${Date.now()}-${safe}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_r, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG, PNG, WEBP or GIF images are allowed'));
  }
});

/* ---------------- Auth (cookie AND Bearer — both admins work) ---------------- */
function makeToken() {
  const payload = `${Date.now()}:${crypto.randomBytes(8).toString('hex')}`;
  return `${payload}.${crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex')}`;
}
function verifyToken(token) {
  if (!token || typeof token !== 'string') return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  if (sig !== expected) return false;
  return Date.now() - parseInt(payload.split(':')[0], 10) < 7 * 24 * 60 * 60 * 1000;
}
function getCookie(req, name) {
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}
const requireAuth = (req, res, next) => {
  const bearer = (req.headers.authorization || '').replace('Bearer ', '');
  if (verifyToken(bearer) || verifyToken(getCookie(req, 'zan_admin'))) return next();
  return res.status(401).json({ error: 'Unauthorized' });
};

/* ---------------- Health check ---------------- */
app.get('/healthz', (_req, res) => res.json({ ok: true }));

/* ---------------- Public API ---------------- */
app.get('/api/config', (_req, res) => res.json({ whatsapp: WHATSAPP }));
app.get('/api/products', (req, res) => {
  let list = products.map((p) => ({ ...p, category: p.type, gem: p.material })); // legacy fields included
  const { category, gem, type, material } = req.query;
  if (category && category !== 'All') list = list.filter((p) => p.type === category || p.category === category);
  if (type && type !== 'All') list = list.filter((p) => p.type === type);
  if (gem && gem !== 'All') list = list.filter((p) => p.material === gem || p.gem === gem);
  if (material && material !== 'All') list = list.filter((p) => p.material === material);
  res.json(list);
});

/* ---------------- Auth routes ---------------- */
app.post('/api/login', (req, res) => {
  if ((req.body || {}).password === ADMIN_PASSWORD) {
    const token = makeToken();
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.setHeader('Set-Cookie', `zan_admin=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}${secure}`);
    return res.json({ ok: true, token }); // token for Bearer-style admin too
  }
  return res.status(401).json({ error: 'Invalid password' });
});
app.post('/api/logout', (_req, res) => {
  res.setHeader('Set-Cookie', 'zan_admin=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  res.json({ ok: true });
});
app.get('/api/me', (req, res) => {
  const bearer = (req.headers.authorization || '').replace('Bearer ', '');
  res.json({ authed: verifyToken(bearer) || verifyToken(getCookie(req, 'zan_admin')) });
});

/* ---------------- Admin CRUD (both route styles supported) ---------------- */
const saveProduct = (req, res) => {
  const b = req.body || {};
  const existing = b.id ? products.find((p) => p.id === b.id) : null;
  const product = normalizeProduct(b, existing);
  if (req.file) product.image = `/uploads/${req.file.filename}`;
  const idx = products.findIndex((p) => p.id === product.id);
  if (idx >= 0) products[idx] = product; else products.unshift(product);
  writeProducts(products);
  res.json({ ...product, category: product.type, gem: product.material });
};
app.post('/api/products', requireAuth, upload.single('imageFile'), saveProduct);
app.put('/api/products/:id', requireAuth, upload.single('imageFile'), (req, res) => {
  req.body.id = req.params.id;
  return saveProduct(req, res);
});
app.delete('/api/products/:id', requireAuth, (req, res) => {
  const item = products.find((p) => p.id === req.params.id);
  if (item?.image?.startsWith('/uploads/')) {
    fs.promises.unlink(path.join(UPLOAD_DIR, path.basename(item.image))).catch(() => {});
  }
  products = products.filter((p) => p.id !== req.params.id);
  writeProducts(products);
  res.json({ ok: true });
});
/* Legacy aliases (older admin pages) */
app.get('/api/admin/products', requireAuth, (_req, res) => res.json(products));
app.post('/api/admin/products', requireAuth, upload.single('imageFile'), saveProduct);
app.delete('/api/admin/products/:id', requireAuth, (req, res) => {
  req.params.id = req.params.id;
  products = products.filter((p) => p.id !== req.params.id);
  writeProducts(products);
  res.json({ ok: true });
});

/* ---------------- Admin page ---------------- */
app.get('/admin', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

app.use((_req, res) => res.status(404).send('Not found'));
app.listen(PORT, () => console.log(`✨ ZanJewelry running on port ${PORT}`));
