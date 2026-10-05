/* ZanJewelry CMS server — products + category tree + homepage content */
try { require('dotenv').config(); } catch (_) {}
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ChangeMeNow!';
const WHATSAPP = process.env.WHATSAPP_NUMBER || '27703887170';
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const FILES = {
  products: path.join(DATA_DIR, 'products.json'),
  categories: path.join(DATA_DIR, 'categories.json'),
  content: path.join(DATA_DIR, 'content.json'),
  siteImages: path.join(DATA_DIR, 'site-images.json')
};
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const readJSON = (f, fb) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return fb; } };
const writeJSON = (f, d) => fs.writeFileSync(f, JSON.stringify(d, null, 2));
const delFile = (p) => { if (p && p.startsWith('/uploads/')) fs.promises.unlink(path.join(UPLOAD_DIR, path.basename(p))).catch(() => {}); };

/* ---------------- Category tree (editable in admin) ---------------- */
const SEED_CATEGORIES = [
  { slug: 'jewellery', name: 'Jewellery', parent: null, productType: 'jewellery', order: 0, description: 'Fine jewellery, made and curated with care.' },
  { slug: 'rings', name: 'Rings', parent: 'jewellery', productType: 'jewellery', order: 1, description: 'You can never have enough — fine pieces made to order.' },
  { slug: 'engagement', name: 'Engagement Rings', parent: 'rings', productType: 'jewellery', order: 2, description: 'Solitaires, halos and clusters — choose your style.' },
  { slug: 'wedding', name: 'Wedding Rings', parent: 'rings', productType: 'jewellery', order: 3, description: 'Classic bands, eternity styles and matching sets.' },
  { slug: 'earrings', name: 'Earrings', parent: 'jewellery', productType: 'jewellery', order: 4, description: 'Studs, hoops and drops for every day.' },
  { slug: 'necklaces', name: 'Necklaces', parent: 'jewellery', productType: 'jewellery', order: 5, description: 'Chains, pendants and name pieces.' },
  { slug: 'bracelets', name: 'Bracelets', parent: 'jewellery', productType: 'jewellery', order: 6, description: 'Bangles and chains, layered or alone.' },
  { slug: 'cosmetics', name: 'Cosmetics', parent: null, productType: 'cosmetic', order: 10, description: 'Beauty for your every day.' },
  { slug: 'makeup', name: 'Makeup', parent: 'cosmetics', productType: 'cosmetic', order: 11, description: 'Colour for lips, face and eyes.' },
  { slug: 'lip-products', name: 'Lip Products', parent: 'makeup', productType: 'cosmetic', order: 12, description: 'Gloss, lipstick, liner and oil.' },
  { slug: 'skincare', name: 'Skincare', parent: 'cosmetics', productType: 'cosmetic', order: 13, description: 'Mists, serums and moisturisers.' },
  { slug: 'fragrance', name: 'Fragrance', parent: 'cosmetics', productType: 'cosmetic', order: 14, description: 'Signature scents and body mists.' },
  { slug: 'body-care', name: 'Body Care', parent: 'cosmetics', productType: 'cosmetic', order: 15, description: 'Butters, washes and soaps.' }
];
let categories = readJSON(FILES.categories, null);
if (!Array.isArray(categories) || !categories.length) { categories = SEED_CATEGORIES.map((c) => ({ active: true, ...c })); writeJSON(FILES.categories, categories); }
const catBySlug = (s) => categories.find((c) => c.slug === s);
const ancestorsOf = (slug) => { const out = []; let c = catBySlug(slug), g = 0; while (c && c.parent && g++ < 10) { out.push(c.parent); c = catBySlug(c.parent); } return out; };
const childrenOf = (slug) => categories.filter((c) => c.parent === slug).sort((a, b) => (a.order || 99) - (b.order || 99));
const typeOfCategory = (slug) => catBySlug(slug)?.productType || 'jewellery';
const catPath = (slug) => { const out = []; let c = catBySlug(slug), g = 0; while (c && g++ < 10) { out.unshift({ slug: c.slug, name: c.name }); c = catBySlug(c.parent); } return out; };

/* ---------------- Products ---------------- */
const MATERIALS = ['none', 'gold', 'silver', 'rose-gold', 'platinum', 'diamond', 'gemstone'];
const GEMSTONES = ['amethyst', 'ruby', 'sapphire', 'emerald', 'topaz', 'other'];
const OLD_TYPE_MAP = { ring: 'rings', rings: 'rings', engagement: 'engagement', wedding: 'wedding', cosmetic: 'makeup', cosmetics: 'makeup' };
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
    id: p.id || crypto.randomUUID(),
    name: p.name || 'Untitled',
    description: p.description || '',
    price: Number.isFinite(Number(p.price)) && p.price !== '' && p.price !== null ? Number(p.price) : null,
    category,
    subcategory: p.subcategory || '',
    material: MATERIALS.includes(p.material) ? p.material : 'none',
    gemstone: GEMSTONES.includes(p.gemstone) ? p.gemstone : '',
    images: Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []),
    featured: !!p.featured,
    published: p.published !== false,
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
    { name: 'Glow Lip Gloss Trio', category: 'lip-products', subcategory: 'Lip Gloss', price: 220, images: ['cosmetics-1.jpg'], description: 'Three shades of high-shine gloss in one gift-ready set — nude, rose and berry.' },
    { name: 'Rosewater Face Mist', category: 'skincare', subcategory: 'Face Mist', price: 180, images: ['cosmetics-1.jpg'], description: 'A light hydrating mist with rosewater to refresh skin any time of day.' },
    { name: 'Shea Whip Body Butter', category: 'body-care', subcategory: 'Body Butter', price: 195, images: ['cosmetics-1.jpg'], description: 'Whipped shea butter that melts into skin — rich moisture, no grease.' },
    { name: 'Velvet Matte Lipstick', category: 'lip-products', subcategory: 'Lipstick', price: 160, images: ['cosmetics-1.jpg'], description: 'A comfortable, long-wear matte with a soft velvet finish.' }
  ].map((p) => { const d = { id: crypto.randomUUID(), reference: nextRef(), published: true, featured: false, subcategory: '', gemstone: '', stockStatus: 'in-stock', price: null, images: [], description: '', createdAt: Date.now(), ...p }; d.productType = typeOfCategory(d.category); return d; });
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
    id: existing?.id || b.id || crypto.randomUUID(),
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

/* ---------------- Homepage content + site images ---------------- */
let content = readJSON(FILES.content, null) || {
  hero: { image: '', eyebrow: 'ZanJewelry Manufacturing · Est. 2021', heading: 'Rings for your moments. Beauty for your every day.', sub: 'Fine engagement, wedding and everyday pieces — plus our cosmetics line. Enquire directly on WhatsApp.', ctaText: 'Shop rings', ctaLink: '#/shop/rings', cta2Text: 'Shop cosmetics', cta2Link: '#/shop/cosmetics' },
  banners: {}
};
let siteImages = readJSON(FILES.siteImages, {});

/* ---------------- Auth (cookie AND Bearer) ---------------- */
function makeToken() { const payload = `${Date.now()}:${crypto.randomBytes(8).toString('hex')}`; return `${payload}.${crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex')}`; }
function verifyToken(token) {
  if (!token || typeof token !== 'string') return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  if (sig !== crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex')) return false;
  return Date.now() - parseInt(payload.split(':')[0], 10) < 7 * 24 * 60 * 60 * 1000;
}
function getCookie(req, name) {
  for (const part of (req.headers.cookie || '').split(';')) {
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

/* ---------------- Middleware + uploads ---------------- */
app.set('trust proxy', 1);
app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));
app.use('/uploads', express.static(UPLOAD_DIR));
const upload = multer({
  storage: multer.diskStorage({
    destination: (_r, _f, cb) => cb(null, UPLOAD_DIR),
    filename: (_r, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-z0-9.\-_]/gi, '_').toLowerCase()}`)
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (_r, file, cb) => /^image\/(jpeg|png|webp|gif|avif)$/.test(file.mimetype) ? cb(null, true) : cb(new Error('Only JPG, PNG, WEBP, GIF or AVIF images are allowed'))
});

/* ---------------- Public API ---------------- */
app.get('/healthz', (_q, res) => res.json({ ok: true }));
app.get('/api/config', (_q, res) => res.json({ whatsapp: WHATSAPP }));
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

/* ---------------- Auth routes ---------------- */
app.post('/api/login', (req, res) => {
  if ((req.body || {}).password === ADMIN_PASSWORD) {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.setHeader('Set-Cookie', `zan_admin=${makeToken()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}${secure}`);
    const token = makeToken();
    return res.json({ ok: true, token });
  }
  return res.status(401).json({ error: 'Invalid password' });
});
app.post('/api/logout', (_q, res) => { res.setHeader('Set-Cookie', 'zan_admin=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'); res.json({ ok: true }); });
app.get('/api/me', (req, res) => {
  const bearer = (req.headers.authorization || '').replace('Bearer ', '');
  res.json({ authed: verifyToken(bearer) || verifyToken(getCookie(req, 'zan_admin')) });
});

/* ---------------- Admin: products ---------------- */
const saveProduct = (req, res) => {
  const b = req.body || {};
  const existing = b.id ? products.find((p) => p.id === b.id) : null;
  const files = (req.files || []).filter((f) => f.fieldname === 'imageFiles' || f.fieldname === 'imageFile');
  const product = normalizeProduct(b, existing, files);
  if (files.length && existing?.images) existing.images.forEach(delFile);
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

/* ---------------- Admin: categories ---------------- */
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

/* ---------------- Admin: homepage content (hero + banners + logo) ---------------- */
app.put('/api/content', requireAuth, upload.any(), (req, res) => {
  let data = {};
  try { data = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : (req.body.data || {}); } catch {}
  if (data.hero) content.hero = { ...content.hero, ...data.hero };
  content.banners = content.banners || {};
  if (data.banners) for (const [slug, bn] of Object.entries(data.banners)) content.banners[slug] = { image: content.banners[slug]?.image || '', active: true, ...content.banners[slug], ...bn };
  (req.files || []).forEach((f) => {
    if (f.fieldname === 'heroImage') { delFile(content.hero.image); content.hero.image = '/uploads/' + f.filename; }
    else if (f.fieldname.startsWith('banner-')) {
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
  if (!['logo', 'story'].includes(req.params.slot)) return res.status(400).json({ error: 'Unknown slot' });
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

app.get('/admin', (_q, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.use((err, _q, res, _n) => res.status(err.status || 400).json({ error: err.message || 'Upload failed' }));
app.use((_q, res) => res.status(404).send('Not found'));
app.listen(PORT, () => console.log(`✨ ZanJewelry CMS running on port ${PORT}`));
