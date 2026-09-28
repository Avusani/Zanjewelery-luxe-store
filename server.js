require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

/* ---------------- Config ---------------- */
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ChangeMeNow!';
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const DATA_DIR = path.join(__dirname, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const UPLOAD_DIR = path.join(__dirname, 'public', 'assets', 'images', 'uploads');

[DATA_DIR, UPLOAD_DIR].forEach((d) => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});
if (!fs.existsSync(PRODUCTS_FILE)) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify([], null, 2));
}

/* ---------------- Middleware ---------------- */
app.set('trust proxy', 1);
app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(SESSION_SECRET));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

/* ---------------- Uploads ---------------- */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-z0-9.\-_]/gi, '_');
    cb(null, `${Date.now()}-${safe}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

/* ---------------- Helpers ---------------- */
const readProducts = () => {
  try { return JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8')); }
  catch { return []; }
};
const writeProducts = (list) =>
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(list, null, 2));

function makeToken() {
  const payload = `${Date.now()}:${crypto.randomBytes(8).toString('hex')}`;
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('hex');
  return `${payload}.${sig}`;
}
function verifyToken(token) {
  if (!token || typeof token !== 'string') return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const expected = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('hex');
  if (sig !== expected) return false;
  const ts = parseInt(payload.split(':')[0], 10);
  return Date.now() - ts < 7 * 24 * 60 * 60 * 1000;
}
const requireAuth = (req, res, next) => {
  if (verifyToken(req.cookies.zan_admin)) return next();
  return res.status(401).json({ error: 'Unauthorized' });
};

/* ---------------- Health check (Railway uses this) ---------------- */
app.get('/healthz', (_req, res) => res.json({ ok: true }));

/* ---------------- Public API ---------------- */
app.get('/api/products', (req, res) => {
  const { category, gem } = req.query;
  let list = readProducts();
  if (category && category !== 'All') list = list.filter((p) => p.category === category);
  if (gem && gem !== 'All') list = list.filter((p) => p.gem === gem);
  res.json(list);
});

/* ---------------- Auth ---------------- */
app.post('/api/login', (req, res) => {
  const { password } = req.body || {};
  if (password === ADMIN_PASSWORD) {
    const token = makeToken();
    res.cookie('zan_admin', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.json({ ok: true });
  }
  return res.status(401).json({ error: 'Invalid password' });
});
app.post('/api/logout', (_req, res) => {
  res.clearCookie('zan_admin');
  res.json({ ok: true });
});
app.get('/api/me', (req, res) => {
  res.json({ authed: verifyToken(req.cookies.zan_admin) });
});

/* ---------------- Admin CRUD ---------------- */
app.get('/api/admin/products', requireAuth, (_req, res) => res.json(readProducts()));

app.post('/api/admin/products', requireAuth, upload.single('imageFile'), (req, res) => {
  const list = readProducts();
  const b = req.body;
  const product = {
    id: b.id || crypto.randomUUID(),
    name: b.name,
    category: b.category,
    gem: b.gem,
    price: b.price === '' || b.price == null ? null : Number(b.price),
    stock: Number(b.stock || 0),
    image: req.file ? `/assets/images/uploads/${req.file.filename}` : b.image,
    description: b.description,
  };
  const idx = list.findIndex((p) => p.id === product.id);
  if (idx >= 0) list[idx] = product;
  else list.push(product);
  writeProducts(list);
  res.json(product);
});

app.delete('/api/admin/products/:id', requireAuth, (req, res) => {
  const list = readProducts().filter((p) => p.id !== req.params.id);
  writeProducts(list);
  res.json({ ok: true });
});

/* ---------------- Admin page ---------------- */
app.get('/admin', (_req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'admin.html'))
);

app.use((_req, res) => res.status(404).send('Not found'));

app.listen(PORT, () => console.log(`✨ ZanJewelry running on port ${PORT}`));
