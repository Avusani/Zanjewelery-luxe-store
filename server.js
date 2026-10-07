/* ============================================================
   ZanJewelry CMS server — complete backend (final)
   Users · Products · Diamonds · Categories · Reviews · Pages
   Blog · Settings · Subscribers · Multi-hero · Site images
   ============================================================ */
try { require('dotenv').config(); } catch (_) {}
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ChangeMeNow!'; // legacy fallback
const WHATSAPP = process.env.WHATSAPP_NUMBER || '27703887170';
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const FILES = {
  products: path.join(DATA_DIR, 'products.json'),
  categories: path.join(DATA_DIR, 'categories.json'),
  content: path.join(DATA_DIR, 'content.json'),
  siteImages: path.join(DATA_DIR, 'site-images.json'),
  users: path.join(DATA_DIR, 'users.json'),
  diamonds: path.join(DATA_DIR, 'diamonds.json'),
  reviews: path.join(DATA_DIR, 'reviews.json'),
  pages: path.join(DATA_DIR, 'pages.json'),
  blog: path.join(DATA_DIR, 'blog.json'),
  settings: path.join(DATA_DIR, 'settings.json'),
  subscribers: path.join(DATA_DIR, 'subscribers.json')
};
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const readJSON = (f, fb) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return fb; } };
const writeJSON = (f, d) => fs.writeFileSync(f, JSON.stringify(d, null, 2));
const delFile = (p) => { if (p && p.startsWith('/uploads/')) fs.promises.unlink(path.join(UPLOAD_DIR, path.basename(p))).catch(() => {}); };
const uid = () => crypto.randomUUID();

/* ================= PASSWORD HASHING ================= */
const hashPw = (pw) => {
  const salt = crypto.randomBytes(16).toString('hex');
  return salt + ':' + crypto.scryptSync(String(pw), salt, 64).toString('hex');
};
const checkPw = (pw, stored) => {
  try {
    const [salt, hex] = String(stored).split(':');
    return crypto.timingSafeEqual(Buffer.from(hex, 'hex'), crypto.scryptSync(String(pw), salt, 64));
  } catch { return false; }
};

/* ================= USERS ================= */
let users = readJSON(FILES.users, []);
if (!Array.isArray(users)) users = [];
if (!users.length) {
  users = [{ username: 'Awonke', password: hashPw('Awonke@2026'), owner: true, createdAt: Date.now() }];
  writeJSON(FILES.users, users);
  console.log('✓ Seeded admin user: Awonke');
}
const findUser = (name) => users.find((u) => (u.username || '').toLowerCase() === String(name || '').toLowerCase());

/* ================= CATEGORY TREE ================= */
const SEED_CATEGORIES = [
  { slug: 'jewellery', name: 'Jewellery', parent: null, productType: 'jewellery', order: 0, description: 'Fine jewellery, made and curated with care.' },
  { slug: 'rings', name: 'Rings', parent: 'jewellery', productType: 'jewellery', order: 1, description: 'You can never have enough — fine pieces made to order.' },
  { slug: 'engagement', name: 'Engagement Rings', parent: 'rings', productType: 'jewellery', order: 2, description: 'Solitaires, halos and clusters — choose your style.' },
  { slug: 'wedding', name: 'Wedding Rings', parent: 'rings', productType: 'jewellery', order: 3, description: 'Classic bands, eternity styles and matching sets.' },
  { slug: 'earrings', name: 'Earrings', parent: 'jewellery', productType: 'jewellery', order: 4, description: 'Studs, hoops and drops for every day.' },
  { slug: 'necklaces', name: 'Necklaces', parent: 'jewellery', productType: 'jewellery', order: 5, description: 'Chains, pendants and name pieces.' },
  { slug: 'pendants', name: 'Pendants', parent: 'jewellery', productType: 'jewellery', order: 6, description: 'Pendants that hold your story.' },
  { slug: 'bracelets', name: 'Bracelets', parent: 'jewellery', productType: 'jewellery', order: 7, description: 'Bangles and chains, layered or alone.' },
  { slug: 'cosmetics', name: 'Cosmetics', parent: null, productType: 'cosmetic', order: 10, description: 'Beauty for your every day.' },
  { slug: 'makeup', name: 'Makeup', parent: 'cosmetics', productType: 'cosmetic', order: 11, description: 'Colour for lips, face and eyes.' },
  { slug: 'lip-products', name: 'Lip Products', parent: 'makeup', productType: 'cosmetic', order: 12, description: 'Gloss, lipstick, liner and oil.' },
  { slug: 'skincare', name: 'Skincare', parent: 'cosmetics', productType: 'cosmetic', order: 13, description: 'Mists, serums and moisturisers.' },
  { slug: 'fragrance', name: 'Fragrance', parent: 'cosmetics', productType: 'cosmetic', order: 14, description: 'Signature scents and body mists.' },
  { slug: 'body-care', name: 'Body Care', parent: 'cosmetics', productType: 'cosmetic', order: 15, description: 'Butters, washes and soaps.' }
];
let categories = readJSON(FILES.categories, null);
if (!Array.isArray(categories) || !categories.length) { categories = SEED_CATEGORIES.map((c) => ({ active: true, ...c })); writeJSON(FILES.categories, categories); }
else if (!categories.some((c) => c.slug === 'pendants')) { categories.push({ active: true, slug: 'pendants', name: 'Pendants', parent: 'jewellery', productType: 'jewellery', order: 6, description: 'Pendants that hold your story.' }); writeJSON(FILES.categories, categories); }
const catBySlug = (s) => categories.find((c) => c.slug === s);
const ancestorsOf = (slug) => { const out = []; let c = catBySlug(slug), g = 0; while (c && c.parent && g++ < 10) { out.push(c.parent); c = catBySlug(c.parent); } return out; };
const childrenOf = (slug) => categories.filter((c) => c.parent === slug).sort((a, b) => (a.order || 99) - (b.order || 99));
const typeOfCategory = (slug) => catBySlug(slug)?.productType || 'jewellery';
const catPath = (slug) => { const out = []; let c = catBySlug(slug), g = 0; while (c && g++ < 10) { out.unshift({ slug: c.slug, name: c.name }); c = catBySlug(c.parent); } return out; };

/* ================= PRODUCTS ================= */
const MATERIALS = ['none', 'gold', 'silver', 'rose-gold', 'platinum', 'diamond', 'gemstone'];
const GEMSTONES = ['amethyst', 'ruby', 'sapphire', 'emerald', 'topaz', 'other'];
const OLD_TYPE_MAP = { ring: 'rings', rings: 'rings', engagement: 'engagement', wedding: 'wedding', pendant: 'pendants', pendants: 'pendants', cosmetic: 'makeup', cosmetics: 'makeup' };
let refCounter = 0;
const nextRef = () => 'ZJ-' + String(++refCounter).padStart(4, '0');

let products = readJSON(FILES.products, []);
if (!Array.isArray(products)) products = [];
let migrated = false;
products = products.map((p) => {
  if (p.category && catBySlug(p.category) && Array.isArray(p.images)) return p;
  migrated = true;
  const old = String(p.type || '').toLowerCase();
  const category = OLD_TYPE_MAP[old] || (catBySlug(p.category) ? p.category : 'rings');
  const q = {
    id: p.id || uid(), name: p.name || 'Untitled', description: p.description || '',
    price: Number.isFinite(Number(p.price)) && p.price !== '' && p.price !== null ? Number(p.price) : null,
    category, subcategory: p.subcategory || '',
    material: MATERIALS.includes(p.material) ? p.material : 'none',
    gemstone: GEMSTONES.includes(p.gemstone) ? p.gemstone : '',
    images: Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []),
    featured: !!p.featured, published: p.published !== false,
    stockStatus: ['in-stock', 'out-of-stock', 'sold'].includes(p.stockStatus) ? p.stockStatus : (Number(p.stock) > 0 || p.stock == null ? 'in-stock' : 'out-of-stock'),
    createdAt: p.createdAt || Date.now()
  };
  q.productType = typeOfCategory(q.category);
  return q;
});
products.forEach((p) => {
  if (!p.reference) { p.reference = nextRef(); migrated = true; }
  const n = parseInt(p.reference.replace('ZJ-', ''), 10); if (n > refCounter) refCounter = n;
});
if (products.length === 0) {
  products = [
    { name: 'Halo Cluster Engagement Ring', category: 'engagement', material: 'diamond', featured: true, images: ['cluster-1.jpg'], description: 'A brilliant round cluster centre framed by a double halo, with pavé-set shoulders.' },
    { name: 'Sapphire Halo Engagement Ring', category: 'engagement', material: 'gemstone', gemstone: 'sapphire', images: ['gemstone-1.jpg'], description: 'A rich centre gem framed by a fine halo. Choose your centre stone on WhatsApp.' },
    { name: 'Baguette Eternity Wedding Band', category: 'wedding', material: 'diamond', images: ['diamond-1.jpg'], description: 'Alternating baguette and round diamonds set all the way around.' },
    { name: 'Classic Gold Wedding Bands (Pair)', category: 'wedding', material: 'gold', images: ['gold-1.jpg'], description: 'A pair of polished gold bands — hers with a single diamond, his a classic comfort fit.' },
    { name: 'Sterling Silver Pavé Band', category: 'rings', material: 'silver', price: 450, images: ['diamond-1.jpg'], description: 'Sterling silver band with pavé-style detailing. Perfect for stacking.' },
    { name: 'Amethyst Halo Ring', category: 'rings', material: 'gemstone', gemstone: 'amethyst', images: ['gemstone-1.jpg'], description: 'A centre amethyst framed by a fine halo — a rich splash of colour.' },
    { name: 'Gold Snowflake Pendant', category: 'pendants', material: 'gold', images: ['gold-1.jpg'], description: 'A delicate gold pendant with a snowflake silhouette on a fine chain.' },
    { name: 'Glow Lip Gloss Trio', category: 'lip-products', subcategory: 'Lip Gloss', price: 220, images: ['cosmetics-1.jpg'], description: 'Three shades of high-shine gloss in one gift-ready set — nude, rose and berry.' },
    { name: 'Rosewater Face Mist', category: 'skincare', subcategory: 'Face Mist', price: 180, images: ['cosmetics-1.jpg'], description: 'A light hydrating mist with rosewater to refresh skin any time of day.' },
    { name: 'Shea Whip Body Butter', category: 'body-care', subcategory: 'Body Butter', price: 195, images: ['cosmetics-1.jpg'], description: 'Whipped shea butter that melts into skin — rich moisture, no grease.' },
    { name: 'Velvet Matte Lipstick', category: 'lip-products', subcategory: 'Lipstick', price: 160, images: ['cosmetics-1.jpg'], description: 'A comfortable, long-wear matte with a soft velvet finish.' }
  ].map((p) => { const d = { id: uid(), reference: nextRef(), published: true, featured: false, subcategory: '', gemstone: '', stockStatus: 'in-stock', price: null, images: [], description: '', createdAt: Date.now(), ...p }; d.productType = typeOfCategory(d.category); return d; });
  migrated = true;
}
if (migrated) writeJSON(FILES.products, products);

function normalizeProduct(b = {}, existing = null, files = []) {
  const category = catBySlug(String(b.category || '')) ? b.category
    : (existing && catBySlug(existing.category) ? existing.category : 'rings');
  const productType = typeOfCategory(category);
  let material = String(b.material || '');
  if (!MATERIALS.includes(material)) material = (existing && MATERIALS.includes(existing.material)) ? existing.material : 'none';
  let images = [];
  try { const arr = typeof b.images === 'string' ? JSON.parse(b.images) : b.images; if (Array.isArray(arr)) images = arr.filter((x) => typeof x === 'string'); } catch {}
  if (!images.length && existing?.images?.length) images = existing.images.slice();
  if (!images.length && existing?.image) images = [existing.image];
  files.forEach((f) => images.push('/uploads/' + f.filename));
  return {
    id: existing?.id || b.id || uid(),
    reference: existing?.reference || nextRef(),
    name: String(b.name || existing?.name || '').trim() || 'Untitled',
    description: String(b.description ?? existing?.description ?? '').trim(),
    price: (b.price === '' || b.price == null || !Number.isFinite(Number(b.price))) ? null : Number(b.price),
    productType, category,
    subcategory: String(b.subcategory ?? existing?.subcategory ?? '').trim(),
    material: productType === 'cosmetic' ? 'none' : material,
    gemstone: GEMSTONES.includes(String(b.gemstone || '')) ? b.gemstone : (existing?.gemstone || ''),
    images,
    featured: b.featured === undefined ? !!existing?.featured : ['true', 'on', true, 1].includes(b.featured),
    published: b.published === undefined ? existing?.published !== false : !['false', false, 0].includes(b.published),
    stockStatus: ['in-stock', 'out-of-stock', 'sold'].includes(String(b.stockStatus || '')) ? b.stockStatus : (existing?.stockStatus || 'in-stock'),
    createdAt: existing?.createdAt || Date.now()
  };
}

/* ================= CONTENT + SITE IMAGES ================= */
let content = readJSON(FILES.content, null) || {
  hero: { image: '', images: [], eyebrow: 'ZanJewelry Manufacturing · Est. 2021', heading: 'Rings for your moments. Beauty for your every day.', sub: 'Fine engagement, wedding and everyday pieces — plus our cosmetics line. Enquire directly on WhatsApp.', ctaText: 'Shop rings', ctaLink: '#/shop/rings', cta2Text: 'Shop cosmetics', cta2Link: '#/shop/cosmetics' },
  banners: {}
};
let siteImages = readJSON(FILES.siteImages, {});
const SITE_SLOTS = ['logo', 'story', 'bridal-engagement', 'bridal-wedding'];

/* ================= DIAMONDS ================= */
let diamonds = readJSON(FILES.diamonds, null);
if (!Array.isArray(diamonds) || !diamonds.length) {
  const S = ['Round', 'Princess', 'Cushion', 'Emerald', 'Oval', 'Pear', 'Marquise'], C = ['D', 'E', 'F', 'G', 'H', 'I', 'J'], CL = ['VVS1', 'VVS2', 'VS1', 'VS2'], CU = ['Excellent', 'Very Good'];
  diamonds = []; let n = 0;
  ['natural', 'lab'].forEach((t) => { for (let i = 0; i < 14; i++) {
    const carat = [0.30, 0.50, 0.70, 1.00, 1.20, 1.50, 2.00][i % 7];
    diamonds.push({ id: uid(), ref: 'ZJD-' + String(++n).padStart(4, '0'), type: t, shape: S[i % S.length], carat,
      colour: C[(i + 2) % C.length], clarity: CL[i % CL.length], cut: CU[i % CU.length], price: null,
      certified: i % 3 !== 0, cert: i % 3 !== 0 ? 'GIA ' + String(2100000000 + i * 137) : '', sold: false, image: '', createdAt: Date.now() });
  }});
  writeJSON(FILES.diamonds, diamonds);
}

/* ================= REVIEWS / PAGES / BLOG / SETTINGS / SUBSCRIBERS ================= */
let reviews = readJSON(FILES.reviews, []); if (!Array.isArray(reviews)) reviews = [];
let pages = readJSON(FILES.pages, []); if (!Array.isArray(pages)) pages = [];
let posts = readJSON(FILES.blog, []); if (!Array.isArray(posts)) posts = [];
let settings = readJSON(FILES.settings, {}); if (typeof settings !== 'object' || !settings) settings = {};
let subscribers = readJSON(FILES.subscribers, []); if (!Array.isArray(subscribers)) subscribers = [];

/* ================= AUTH ================= */
function makeToken(username) {
  const payload = `${Date.now()}:${Buffer.from(String(username || 'admin')).toString('base64url')}:${crypto.randomBytes(8).toString('hex')}`;
  return `${payload}.${crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex')}`;
}
function tokenUser(token) {
  if (!token || typeof token !== 'string') return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  if (sig !== crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex')) return null;
  const parts = payload.split(':');
  if (Date.now() - parseInt(parts[0], 10) >= 7 * 24 * 60 * 60 * 1000) return null;
  let name = 'admin';
  try { name = Buffer.from(parts[1] || '', 'base64url').toString('utf8') || 'admin'; } catch { return null; }
  /* reject old-format/garbage tokens and deleted users → forces one clean re-login */
  if (!/^[A-Za-z0-9][A-Za-z0-9 ._-]{0,39}$/.test(name)) return null;
  if (name !== 'admin' && !findUser(name)) return null;
  return name;
}
function getCookie(req, name) {
  for (const part of (req.headers.cookie || '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}
const bearerOf = (req) => (req.headers.authorization || '').replace('Bearer ', '');
const isAuthed = (req) => !!tokenUser(bearerOf(req)) || !!tokenUser(getCookie(req, 'zan_admin'));
const requireAuth = (req, res, next) => isAuthed(req) ? next() : res.status(401).json({ error: 'Unauthorized' });

/* ================= MIDDLEWARE + UPLOADS ================= */
app.set('trust proxy', 1);
app.use('/api', (_q, res, next) => { res.setHeader('Cache-Control', 'no-store, max-age=0'); next(); });
app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'), {
  extensions: ['html'],
  setHeaders: (res, p) => { if (p.endsWith('.html')) res.setHeader('Cache-Control', 'no-store'); }
}));
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '1h' }));
const upload = multer({
  storage: multer.diskStorage({
    destination: (_r, _f, cb) => cb(null, UPLOAD_DIR),
    filename: (_r, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-z0-9.\-_]/gi, '_').toLowerCase()}`)
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 12 },
  fileFilter: (_r, file, cb) => /^image\/(jpeg|png|webp|gif|avif)$/.test(file.mimetype) ? cb(null, true) : cb(new Error('Only JPG, PNG, WEBP, GIF or AVIF images are allowed'))
});

/* ================= PUBLIC API ================= */
app.get('/healthz', (_q, res) => res.json({
  ok: true,
  dataDir: DATA_DIR,
  uploads: fs.existsSync(UPLOAD_DIR) ? fs.readdirSync(UPLOAD_DIR).length : 0,
  products: products.length,
  users: users.length,
  siteImages: Object.keys(siteImages)
}));
app.get('/api/config', (_q, res) => res.json({ whatsapp: settings.whatsapp || WHATSAPP }));
app.get('/api/settings', (_q, res) => res.json(settings));
app.get('/api/categories', (_q, res) => res.json(categories.slice().sort((a, b) => (a.order || 99) - (b.order || 99))));
app.get('/api/content', (_q, res) => res.json(content));
app.get('/api/site-images', (_q, res) => res.json(siteImages));

app.get('/api/products', (req, res) => {
  const { category, material, gemstone, type, featured } = req.query;
  let list = products.filter((p) => p.published !== false);
  if (type) list = list.filter((p) => p.productType === type);
  if (category && category !== 'All') list = list.filter((p) => p.category === category || ancestorsOf(p.category).includes(category));
  if (material && material !== 'All') list = list.filter((p) => p.material === material);
  if (gemstone) list = list.filter((p) => p.gemstone === gemstone);
  if (featured === '1') list = list.filter((p) => p.featured);
  res.json(list.map((p) => ({ ...p, image: p.images[0] || '', path: catPath(p.category) })));
});

app.get('/api/diamonds', (_q, res) => res.json(diamonds));

app.get('/api/reviews', (_q, res) => {
  res.json(reviews.filter((r) => r.status === 'approved').sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
});
app.post('/api/reviews', upload.single('imageFile'), (req, res) => {
  const b = req.body || {};
  const name = String(b.name || '').trim();
  const text = String(b.text || b.review || '').trim();
  if (!name || !text) return res.status(400).json({ error: 'Name and review text are required' });
  const r = {
    id: uid(), name: name.slice(0, 60), title: String(b.title || '').trim().slice(0, 90),
    text: text.slice(0, 1200), rating: Math.min(5, Math.max(1, Number(b.rating) || 5)),
    image: req.file ? '/uploads/' + req.file.filename : '',
    status: 'pending', createdAt: Date.now()
  };
  reviews.unshift(r); writeJSON(FILES.reviews, reviews);
  res.json({ ok: true, id: r.id });
});

app.get('/api/pages/:slug', (req, res) => {
  const p = pages.find((x) => x.slug === req.params.slug && x.published !== false);
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json(p);
});
app.get('/api/blog', (_q, res) => res.json(posts.filter((p) => p.published !== false).sort((a, b) => (b.date || b.createdAt || 0) - (a.date || a.createdAt || 0))));

app.post('/api/subscribe', (req, res) => {
  const email = String((req.body || {}).email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email' });
  if (!subscribers.some((s) => s.email === email)) {
    subscribers.unshift({ id: uid(), email, createdAt: Date.now() });
    writeJSON(FILES.subscribers, subscribers);
  }
  res.json({ ok: true });
});

/* ================= AUTH ROUTES ================= */
app.post('/api/login', (req, res) => {
  const b = req.body || {};
  const uname = String(b.username || '').trim();
  let user = null;
  if (uname) {
    const u = findUser(uname);
    if (u && checkPw(b.password, u.password)) user = u;
  } else if (b.password === ADMIN_PASSWORD) {
    user = { username: 'admin' };
  }
  if (!user) return res.status(401).json({ error: 'Invalid username or password' });
  const token = makeToken(user.username);
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `zan_admin=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}${secure}`);
  return res.json({ ok: true, token, username: user.username });
});
app.post('/api/logout', (_q, res) => { res.setHeader('Set-Cookie', 'zan_admin=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'); res.json({ ok: true }); });
app.get('/api/me', (req, res) => {
  const u = tokenUser(bearerOf(req)) || tokenUser(getCookie(req, 'zan_admin'));
  res.json({ authed: !!u, username: u || null });
});

/* ================= ADMIN: USERS ================= */
app.get('/api/users', requireAuth, (_q, res) => res.json(users.map(({ password, ...u }) => u)));
app.post('/api/users', requireAuth, (req, res) => {
  const b = req.body || {};
  const username = String(b.username || '').trim();
  if (!username) return res.status(400).json({ error: 'Username is required' });
  if (username.length > 40) return res.status(400).json({ error: 'Username is too long' });
  if (findUser(username)) return res.status(400).json({ error: 'That username already exists' });
  if (!b.password || String(b.password).length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters' });
  const u = { username, password: hashPw(b.password), owner: false, createdAt: Date.now() };
  users.push(u); writeJSON(FILES.users, users);
  res.json({ ok: true, username: u.username });
});
app.put('/api/users/:username', requireAuth, (req, res) => {
  const u = findUser(req.params.username);
  if (!u) return res.status(404).json({ error: 'User not found' });
  const b = req.body || {};
  if (b.username && b.username.trim() && b.username.trim().toLowerCase() !== u.username.toLowerCase()) {
    if (findUser(b.username.trim())) return res.status(400).json({ error: 'That username already exists' });
    u.username = b.username.trim();
  }
  if (b.password) {
    if (String(b.password).length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters' });
    u.password = hashPw(b.password);
  }
  writeJSON(FILES.users, users);
  res.json({ ok: true, username: u.username });
});
app.delete('/api/users/:username', requireAuth, (req, res) => {
  const target = findUser(req.params.username);
  if (!target) return res.status(404).json({ error: 'User not found' });
  const me = tokenUser(bearerOf(req)) || tokenUser(getCookie(req, 'zan_admin'));
  if (me && target.username.toLowerCase() === me.toLowerCase()) return res.status(400).json({ error: 'You cannot delete the account you are logged in with' });
  if (users.length <= 1) return res.status(400).json({ error: 'You cannot delete the last remaining admin account' });
  users = users.filter((u) => u !== target);
  writeJSON(FILES.users, users);
  res.json({ ok: true });
});

/* ================= ADMIN: PRODUCTS ================= */
const saveProduct = (req, res) => {
  const b = req.body || {};
  const existing = b.id ? products.find((p) => p.id === b.id) : null;
  const files = (req.files || []).filter((f) => f.fieldname === 'imageFiles' || f.fieldname === 'imageFile');
  const product = normalizeProduct(b, existing, files);
  /* only delete photo files that were REMOVED from the product —
     photos the admin kept must survive an edit */
  const keep = new Set(product.images);
  if (existing?.images) existing.images.forEach((old) => { if (!keep.has(old)) delFile(old); });
  const idx = products.findIndex((p) => p.id === product.id);
  if (idx >= 0) products[idx] = product; else products.unshift(product);
  writeJSON(FILES.products, products);
  res.json({ ...product, image: product.images[0] || '' });
};
app.post('/api/products', requireAuth, upload.any(), saveProduct);
app.put('/api/products/:id', requireAuth, upload.any(), (req, res) => { req.body.id = req.params.id; saveProduct(req, res); });
app.delete('/api/products/:id', requireAuth, (req, res) => {
  products.find((p) => p.id === req.params.id)?.images?.forEach(delFile);
  products = products.filter((p) => p.id !== req.params.id);
  writeJSON(FILES.products, products);
  res.json({ ok: true });
});
app.get('/api/admin/products', requireAuth, (_q, res) => res.json(products.map((p) => ({ ...p, image: p.images[0] || '' }))));

/* ================= ADMIN: DIAMONDS ================= */
const diaSave = (req, res) => {
  const b = req.body || {};
  const existing = b.id ? diamonds.find((d) => d.id === b.id) : null;
  const d = {
    id: existing?.id || b.id || uid(),
    ref: existing?.ref || 'ZJD-' + String(diamonds.length + 1).padStart(4, '0'),
    type: b.type === 'lab' ? 'lab' : 'natural',
    shape: String(b.shape || 'Round'), carat: Number(b.carat) || 0,
    colour: String(b.colour || ''), clarity: String(b.clarity || ''), cut: String(b.cut || ''),
    price: (b.price === '' || b.price == null) ? null : Number(b.price),
    certified: ['true', 'on', true].includes(b.certified),
    cert: String(b.cert || ''),
    sold: ['true', 'on', true].includes(b.sold),
    image: existing?.image || '', createdAt: existing?.createdAt || Date.now()
  };
  if (req.file) {
    if (existing?.image?.startsWith('/uploads/')) delFile(existing.image);
    d.image = '/uploads/' + req.file.filename;
  }
  const idx = diamonds.findIndex((x) => x.id === d.id);
  if (idx >= 0) diamonds[idx] = d; else diamonds.unshift(d);
  writeJSON(FILES.diamonds, diamonds);
  res.json(d);
};
app.post('/api/diamonds', requireAuth, upload.single('imageFile'), diaSave);
app.put('/api/diamonds/:id', requireAuth, upload.single('imageFile'), (req, res) => { req.body.id = req.params.id; diaSave(req, res); });
app.delete('/api/diamonds/:id', requireAuth, (req, res) => {
  const d = diamonds.find((x) => x.id === req.params.id);
  if (d?.image?.startsWith('/uploads/')) delFile(d.image);
  diamonds = diamonds.filter((x) => x.id !== req.params.id);
  writeJSON(FILES.diamonds, diamonds);
  res.json({ ok: true });
});

/* ================= ADMIN: CATEGORIES ================= */
app.post('/api/categories', requireAuth, (req, res) => {
  const b = req.body || {};
  const slug = String(b.slug || b.name || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!slug) return res.status(400).json({ error: 'Name is required' });
  if (catBySlug(slug)) return res.status(400).json({ error: 'A category with that name already exists' });
  const c = { slug, name: String(b.name || slug).trim(), parent: catBySlug(b.parent) ? b.parent : null, productType: b.productType === 'cosmetic' ? 'cosmetic' : 'jewellery', order: Number(b.order) || 99, description: String(b.description || ''), active: b.active !== false };
  categories.push(c); writeJSON(FILES.categories, categories);
  res.json(c);
});
app.put('/api/categories/:slug', requireAuth, (req, res) => {
  const c = catBySlug(req.params.slug);
  if (!c) return res.status(404).json({ error: 'Not found' });
  const b = req.body || {};
  if (b.name) c.name = String(b.name).trim();
  if (b.parent !== undefined && (b.parent === '' || catBySlug(b.parent))) c.parent = b.parent || null;
  if (b.productType) c.productType = b.productType === 'cosmetic' ? 'cosmetic' : 'jewellery';
  if (b.order !== undefined) c.order = Number(b.order) || 99;
  if (b.description !== undefined) c.description = String(b.description);
  if (b.active !== undefined) c.active = b.active !== false && b.active !== 'false';
  writeJSON(FILES.categories, categories);
  res.json(c);
});
app.delete('/api/categories/:slug', requireAuth, (req, res) => {
  const slug = req.params.slug;
  if (slug === 'jewellery' || slug === 'cosmetics') return res.status(400).json({ error: 'The two root sections cannot be deleted' });
  if (childrenOf(slug).length) return res.status(400).json({ error: 'Move or delete its sub-categories first' });
  if (products.some((p) => p.category === slug)) return res.status(400).json({ error: 'Products still use this category — move them first' });
  categories = categories.filter((c) => c.slug !== slug);
  if (content.banners) delete content.banners[slug];
  writeJSON(FILES.categories, categories); writeJSON(FILES.content, content);
  res.json({ ok: true });
});

/* ================= ADMIN: REVIEWS ================= */
app.get('/api/admin/reviews', requireAuth, (_q, res) => res.json(reviews));
app.put('/api/reviews/:id', requireAuth, (req, res) => {
  const r = reviews.find((x) => x.id === req.params.id);
  if (!r) return res.status(404).json({ error: 'Review not found' });
  const status = String((req.body || {}).status || '');
  if (!['approved', 'declined', 'pending'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  r.status = status; r.reviewedAt = Date.now();
  writeJSON(FILES.reviews, reviews);
  res.json(r);
});
app.delete('/api/reviews/:id', requireAuth, (req, res) => {
  const r = reviews.find((x) => x.id === req.params.id);
  if (r?.image?.startsWith('/uploads/')) delFile(r.image);
  reviews = reviews.filter((x) => x.id !== req.params.id);
  writeJSON(FILES.reviews, reviews);
  res.json({ ok: true });
});

/* ================= ADMIN: PAGES ================= */
app.get('/api/pages', requireAuth, (_q, res) => res.json(pages));
app.put('/api/pages/:slug', requireAuth, upload.any(), (req, res) => {
  const slug = String(req.params.slug || '').toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '');
  if (!slug) return res.status(400).json({ error: 'Invalid page name' });
  let data = {};
  try { data = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : (req.body.data || {}); } catch {}
  let p = pages.find((x) => x.slug === slug);
  if (!p) { p = { slug, title: '', content: '', image: '', published: false, createdAt: Date.now() }; pages.push(p); }
  if (data.title !== undefined) p.title = String(data.title);
  if (data.content !== undefined) p.content = String(data.content);
  if (data.published !== undefined) p.published = data.published !== false && data.published !== 'false';
  p.updatedAt = Date.now();
  const f = (req.files || []).find((x) => x.fieldname === 'pageImage');
  if (f) { if (p.image?.startsWith('/uploads/')) delFile(p.image); p.image = '/uploads/' + f.filename; }
  writeJSON(FILES.pages, pages);
  res.json(p);
});
app.delete('/api/pages/:slug', requireAuth, (req, res) => {
  const p = pages.find((x) => x.slug === req.params.slug);
  if (p?.image?.startsWith('/uploads/')) delFile(p.image);
  pages = pages.filter((x) => x.slug !== req.params.slug);
  writeJSON(FILES.pages, pages);
  res.json({ ok: true });
});

/* ================= ADMIN: BLOG ================= */
app.get('/api/admin/blog', requireAuth, (_q, res) => res.json(posts));
app.post('/api/blog', requireAuth, upload.any(), (req, res) => {
  let data = {};
  try { data = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : (req.body.data || {}); } catch {}
  const p = {
    id: uid(), title: String(data.title || 'Untitled'), author: String(data.author || 'ZanJewelry Team'),
    date: data.date || new Date().toISOString().slice(0, 10),
    body: String(data.body || ''), published: data.published !== false && data.published !== 'false',
    image: '', createdAt: Date.now()
  };
  const f = (req.files || []).find((x) => x.fieldname === 'imageFile');
  if (f) p.image = '/uploads/' + f.filename;
  posts.unshift(p); writeJSON(FILES.blog, posts);
  res.json(p);
});
app.put('/api/blog/:id', requireAuth, upload.any(), (req, res) => {
  const p = posts.find((x) => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Post not found' });
  let data = {};
  try { data = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : (req.body.data || {}); } catch {}
  if (data.title !== undefined) p.title = String(data.title);
  if (data.author !== undefined) p.author = String(data.author);
  if (data.date !== undefined) p.date = String(data.date);
  if (data.body !== undefined) p.body = String(data.body);
  if (data.published !== undefined) p.published = data.published !== false && data.published !== 'false';
  const f = (req.files || []).find((x) => x.fieldname === 'imageFile');
  if (f) { if (p.image?.startsWith('/uploads/')) delFile(p.image); p.image = '/uploads/' + f.filename; }
  writeJSON(FILES.blog, posts);
  res.json(p);
});
app.delete('/api/blog/:id', requireAuth, (req, res) => {
  const p = posts.find((x) => x.id === req.params.id);
  if (p?.image?.startsWith('/uploads/')) delFile(p.image);
  posts = posts.filter((x) => x.id !== req.params.id);
  writeJSON(FILES.blog, posts);
  res.json({ ok: true });
});

/* ================= ADMIN: SETTINGS ================= */
app.put('/api/settings', requireAuth, (req, res) => {
  const b = req.body || {};
  const fields = ['whatsapp', 'email', 'instagram', 'facebook', 'tiktok', 'tagline', 'copyright', 'newsletterHeading', 'newsletterText'];
  fields.forEach((k) => { if (b[k] !== undefined) settings[k] = String(b[k]).trim(); });
  writeJSON(FILES.settings, settings);
  res.json(settings);
});

/* ================= ADMIN: SUBSCRIBERS ================= */
app.get('/api/subscribers', requireAuth, (_q, res) => res.json(subscribers));
app.delete('/api/subscribers/:id', requireAuth, (req, res) => {
  subscribers = subscribers.filter((s) => s.id !== req.params.id);
  writeJSON(FILES.subscribers, subscribers);
  res.json({ ok: true });
});

/* ================= ADMIN: CONTENT (multi-hero + banners) ================= */
app.put('/api/content', requireAuth, upload.any(), (req, res) => {
  let data = {};
  try { data = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : (req.body.data || {}); } catch {}
  content.hero = content.hero || {};
  content.banners = content.banners || {};
  if (data.hero) {
    const { images, ...heroRest } = data.hero;
    content.hero = { ...content.hero, ...heroRest };
    if (Array.isArray(images)) {
      const keep = new Set(images);
      (content.hero.images || []).forEach((p) => { if (!keep.has(p)) delFile(p); });
      content.hero.images = images.filter((p) => typeof p === 'string' && p.startsWith('/uploads/'));
    }
  }
  if (data.banners) for (const [slug, bn] of Object.entries(data.banners)) content.banners[slug] = { image: content.banners[slug]?.image || '', active: true, ...content.banners[slug], ...bn };
  (req.files || []).forEach((f) => {
    if (f.fieldname === 'heroImages') {
      content.hero.images = content.hero.images || [];
      content.hero.images.push('/uploads/' + f.filename);
    } else if (f.fieldname === 'heroImage') {
      delFile(content.hero.image);
      content.hero.image = '/uploads/' + f.filename;
      content.hero.images = [content.hero.image];
    } else if (f.fieldname.startsWith('banner-')) {
      const slug = f.fieldname.slice(7);
      if (catBySlug(slug)) content.banners[slug] = { title: '', description: '', active: true, ...content.banners[slug], image: '/uploads/' + f.filename };
    }
  });
  writeJSON(FILES.content, content);
  res.json(content);
});
app.post('/api/site-images/:slot', requireAuth, upload.any(), (req, res) => {
  const f = (req.files || []).find((x) => x.fieldname === 'imageFile');
  if (!f) return res.status(400).json({ error: 'No image received' });
  if (!SITE_SLOTS.includes(req.params.slot)) return res.status(400).json({ error: 'Unknown slot' });
  delFile(siteImages[req.params.slot]);
  siteImages[req.params.slot] = '/uploads/' + f.filename;
  writeJSON(FILES.siteImages, siteImages);
  res.json(siteImages);
});
app.delete('/api/site-images/:slot', requireAuth, (req, res) => {
  delFile(siteImages[req.params.slot]); delete siteImages[req.params.slot];
  writeJSON(FILES.siteImages, siteImages);
  res.json(siteImages);
});

/* ================= ERRORS + START ================= */
app.get('/admin', (_q, res) => { res.setHeader('Cache-Control', 'no-store'); res.sendFile(path.join(__dirname, 'public', 'admin.html')); });
app.use((err, _q, res, _n) => res.status(err.status || 400).json({ error: err.message || 'Upload failed' }));
app.use((_q, res) => res.status(404).send('Not found'));
app.listen(PORT, () => console.log(`✨ ZanJewelry CMS running on port ${PORT} — login: Awonke`));
