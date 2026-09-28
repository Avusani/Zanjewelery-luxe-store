const currency = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 0
});

const whatsappNumber = "27703887170";

const starterProducts = [
  {
    id: "gold-snowflake-ring",
    name: "Gold Snowflake Ring",
    category: "Rings",
    range: "Gold",
    price: null,
    priceLabel: "Price on request",
    stock: 1,
    image: "assets/images/ring-gold-snowflake-close.png",
    cardClass: "ring-close",
    description: "A gold snowflake ring with close-up product framing."
  },
  {
    id: "diamond-statement-ring",
    name: "Diamond Statement Ring",
    category: "Rings",
    range: "Diamond",
    price: null,
    priceLabel: "Price on request",
    stock: 1,
    image: "assets/images/ring-diamond-statement-close.png",
    cardClass: "ring-close",
    description: "A bright diamond-style statement ring with a close-up product view."
  },
  {
    id: "diamond-bar-band",
    name: "Diamond Bar Band",
    category: "Rings",
    range: "Diamond",
    price: null,
    priceLabel: "Price on request",
    stock: 1,
    image: "assets/images/ring-diamond-band-close.png",
    cardClass: "ring-close",
    description: "A wide diamond-style bar band with close-up sparkle detail."
  },
  {
    id: "silver-baguette-band",
    name: "Silver Baguette Band",
    category: "Rings",
    range: "Silver / Diamond",
    price: null,
    priceLabel: "Price on request",
    stock: 1,
    image: "assets/images/ring-silver-baguette-close.png",
    cardClass: "ring-close",
    description: "A polished silver baguette-style band with bright stone detailing."
  },
  {
    id: "amethyst-cluster-ring",
    name: "Amethyst Cluster Ring",
    category: "Rings",
    range: "Amethyst",
    price: null,
    priceLabel: "Price on request",
    stock: 1,
    image: "assets/images/ring-amethyst-close.png",
    cardClass: "ring-close",
    description: "A deep purple amethyst cluster ring with a dramatic dark setting."
  },
  {
    id: "pastel-gemstone-ring",
    name: "Pastel Gemstone Ring",
    category: "Rings",
    range: "Coloured Gemstones",
    price: null,
    priceLabel: "Price on request",
    stock: 1,
    image: "assets/images/ring-pastel-gem-close.png",
    cardClass: "ring-close",
    description: "A soft multi-colour gemstone band for customers who want a playful fine-jewellery look."
  },
  {
    id: "floral-gemstone-ring",
    name: "Floral Coloured Gem Ring",
    category: "Rings",
    range: "Coloured Gemstones",
    price: null,
    priceLabel: "Price on request",
    stock: 1,
    image: "assets/images/ring-floral-close.png",
    cardClass: "ring-close",
    description: "A floral coloured-gem ring with soft pastel stones and a gold-tone finish."
  },
  {
    id: "moringa-body-wash",
    name: "Moringa Bergamot Body Wash",
    category: "Lotions, Washes & Soaps",
    range: "Moringa Bergamot",
    price: 85,
    stock: 20,
    image: "assets/images/moringa-body-wash-product.png",
    description: "Skin Nutritious Moringa Body Wash, bergamot scented, 500ml."
  },
  {
    id: "charcoal-body-wash",
    name: "Charcoal Detox Body Wash",
    category: "Lotions, Washes & Soaps",
    range: "Charcoal Detox",
    price: 85,
    stock: 20,
    image: "assets/images/charcoal-body-wash-product.png",
    description: "Detox Charcoal Body Wash with charcoal and seaweed, 500ml."
  },
  {
    id: "moringa-body-lotion",
    name: "Moringa Bergamot Body Lotion",
    category: "Lotions, Washes & Soaps",
    range: "Moringa Bergamot",
    price: 110,
    stock: 20,
    image: "assets/images/moringa-body-lotion-product.png",
    description: "Skin Nutritious Moringa Body Lotion, bergamot scented, 500ml."
  },
  {
    id: "charcoal-body-lotion",
    name: "Charcoal Detox Body Lotion",
    category: "Lotions, Washes & Soaps",
    range: "Charcoal Detox",
    price: 110,
    stock: 20,
    image: "assets/images/charcoal-body-lotion-product.png",
    description: "Detox Body Lotion with charcoal and seaweed, 500ml."
  },
  {
    id: "moringa-soap-on-rope",
    name: "Moringa Soap on a Rope",
    category: "Lotions, Washes & Soaps",
    range: "Moringa Bergamot",
    price: 45,
    stock: 20,
    image: "assets/images/moringa-soap-on-rope-product.png",
    description: "Moringa bergamot soap on a rope with a rustic hanging cord."
  },
  {
    id: "charcoal-detox-gift-box",
    name: "Charcoal Detox Gift Box",
    category: "Gift Boxes",
    range: "Charcoal Detox",
    price: 380,
    stock: 12,
    image: "assets/images/charcoal-detox-gift-box-new.png",
    description: "A ready-to-gift Charcoal Detox box with body wash, body lotion, sugar body scrub and soap on a rope."
  },
  {
    id: "moringa-body-care-range",
    name: "Moringa Bergamot Body Care Range",
    category: "Gift Boxes",
    range: "Moringa Bergamot",
    price: 380,
    stock: 12,
    image: "assets/images/moringa-range-new.jpeg",
    description: "A Moringa Bergamot gift option with lotion, body wash, scrub and soap on a rope."
  },
  {
    id: "charcoal-detox-range",
    name: "Charcoal Detox Body Care Range",
    category: "Gift Boxes",
    range: "Charcoal Detox",
    price: 380,
    stock: 12,
    image: "assets/images/charcoal-detox-range-new.png",
    description: "A premium Charcoal Detox range image for customers interested in the full set."
  },
  {
    id: "jojoba-facial-oil",
    name: "Jojoba Melon Seed Baobab Facial Oil",
    category: "Bag & Extras",
    range: "Facial Oil",
    price: null,
    priceLabel: "Price to confirm",
    stock: 10,
    image: "assets/images/jojoba-facial-oil-new.jpeg",
    description: "Skin Creamery Jojoba Melon Seed Baobab facial hydrating oil, 30ml."
  },
  {
    id: "tribal-soul-white-sage-incense",
    name: "Tribal Soul White Sage Incense",
    category: "Bag & Extras",
    range: "Home Fragrance",
    price: 50,
    stock: 10,
    image: "assets/images/tribal-soul-white-sage-incense.png",
    description: "Tribal Soul White Sage incense, 150g, for gifting add-ons and home fragrance."
  }
];

const pageType = document.body.dataset.page || "rings";
const sectionOrder = pageType === "body-care"
  ? ["Lotions, Washes & Soaps", "Gift Boxes", "Bag & Extras"]
  : ["Rings"];
const pageCategories = new Set(sectionOrder);
const storageKey = "za_products_split_whatsapp_2026_07_17";

const state = {
  products: loadProducts(),
  activeFilter: "All"
};

const productGrid = document.querySelector("[data-product-grid]");
const adminDrawer = document.querySelector("[data-admin-drawer]");
const productModal = document.querySelector("[data-product-modal]");
const adminForm = document.querySelector("[data-admin-form]");

function loadProducts() {
  const stored = localStorage.getItem(storageKey);
  return stored ? JSON.parse(stored) : starterProducts;
}

function saveProducts() {
  localStorage.setItem(storageKey, JSON.stringify(state.products));
}

function formatPrice(product) {
  return Number.isFinite(product.price) ? currency.format(product.price) : product.priceLabel || "Price on request";
}

function productUrl(id) {
  const url = new URL(window.location.href);
  url.hash = `product-${id}`;
  return url.href;
}

function whatsappHref(product) {
  const lines = [
    "Hi, I am interested in this product:",
    `Product: ${product.name}`,
    `Price: ${formatPrice(product)}`,
    `Link: ${productUrl(product.id)}`
  ];
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
}

function renderProducts() {
  const pageProducts = state.products.filter((product) => pageCategories.has(product.category));
  const products = state.activeFilter === "All"
    ? pageProducts
    : pageProducts.filter((product) => product.category === state.activeFilter || product.range === state.activeFilter);

  if (!products.length) {
    productGrid.innerHTML = "<p>No products found in this section yet.</p>";
    return;
  }

  const sections = sectionOrder
    .map((section) => [section, products.filter((product) => product.category === section)])
    .filter(([, items]) => items.length);

  productGrid.innerHTML = sections.map(([section, items]) => `
    <section class="product-section" aria-labelledby="${slugify(section)}-title">
      <div class="product-section-heading">
        <p class="eyebrow">${section === "Rings" ? "Ring-only display" : "Product section"}</p>
        <h3 id="${slugify(section)}-title">${section}</h3>
      </div>
      <div class="product-row">
        ${items.map(renderProductCard).join("")}
      </div>
    </section>
  `).join("");
}

function renderProductCard(product) {
  const imageClass = product.category === "Rings"
    ? `product-image ring-image ${product.cardClass || ""}`
    : "product-image product-image-contain";
  return `
    <article class="product-card" id="card-${product.id}">
      <button type="button" data-open-product="${product.id}" aria-label="View ${product.name}">
        <div class="${imageClass}">
          <img src="${product.image}" alt="${product.name}">
        </div>
        <div class="product-info">
          <p>${product.range}</p>
          <h3>${product.name}</h3>
          <div class="product-meta">
            <span>${formatPrice(product)}</span>
            <span>${product.stock} available</span>
          </div>
        </div>
      </button>
      <div class="add-row">
        <a class="button primary whatsapp-button" href="${whatsappHref(product)}" target="_blank" rel="noopener">Order on WhatsApp</a>
      </div>
    </article>
  `;
}

function renderAdmin() {
  const container = document.querySelector("[data-admin-products]");
  container.innerHTML = state.products.map((product) => `
    <div class="admin-product">
      <div>
        <strong>${product.name}</strong>
        <p>${product.category} / ${formatPrice(product)} / Stock ${product.stock}</p>
      </div>
      <button type="button" data-edit-product="${product.id}">Edit</button>
    </div>
  `).join("");
}

function openProduct(id) {
  const product = state.products.find((candidate) => candidate.id === id);
  if (!product) return;
  window.location.hash = `product-${id}`;
  const detailImageClass = product.category === "Rings" ? `detail-ring-image ${product.cardClass || ""}` : "";
  document.querySelector("[data-product-detail]").innerHTML = `
    <div class="product-detail">
      <div class="product-detail-image ${detailImageClass}">
        <img src="${product.image}" alt="${product.name}">
      </div>
      <div>
        <p class="eyebrow">${product.category} / ${product.range}</p>
        <h2>${product.name}</h2>
        <p class="price">${formatPrice(product)}</p>
        <p>${product.description}</p>
        <p><strong>${product.stock}</strong> units currently available.</p>
        <a class="button primary whatsapp-button" href="${whatsappHref(product)}" target="_blank" rel="noopener">Order on WhatsApp</a>
      </div>
    </div>
  `;
  productModal.classList.add("open");
  productModal.setAttribute("aria-hidden", "false");
}

function closeProduct() {
  productModal.classList.remove("open");
  productModal.setAttribute("aria-hidden", "true");
  if (window.location.hash.startsWith("#product-")) {
    history.replaceState(null, "", "#shop");
  }
}

function openDrawer(drawer) {
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
}

function closeDrawer(drawer) {
  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
}

function setFilter(filter) {
  state.activeFilter = filter;
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === filter);
  });
  renderProducts();
}

function editProduct(id) {
  const product = state.products.find((candidate) => candidate.id === id);
  if (!product) return;
  Object.entries(product).forEach(([key, value]) => {
    const fieldName = key === "range" ? "gem" : key;
    if (adminForm.elements[fieldName]) adminForm.elements[fieldName].value = value ?? "";
  });
  adminForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

adminForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(adminForm);
  const priceValue = formData.get("price");
  const product = {
    id: formData.get("id") || slugify(formData.get("name")),
    name: formData.get("name"),
    category: formData.get("category"),
    range: formData.get("gem"),
    price: priceValue === "" ? null : Number(priceValue),
    priceLabel: priceValue === "" ? "Price on request" : undefined,
    stock: Number(formData.get("stock")),
    image: formData.get("image"),
    description: formData.get("description")
  };
  const index = state.products.findIndex((candidate) => candidate.id === product.id);
  if (index >= 0) state.products[index] = product;
  else state.products.push(product);
  saveProducts();
  adminForm.reset();
  renderProducts();
  renderAdmin();
});

document.addEventListener("click", (event) => {
  const target = event.target.closest("button, a");
  if (!target) return;

  if (target.matches(".menu-toggle")) {
    document.querySelector(".main-nav").classList.toggle("open");
  }

  if (target.dataset.filter) setFilter(target.dataset.filter);
  if (target.dataset.filterLink) setFilter(target.dataset.filterLink);

  if (target.dataset.gemFilter) {
    setFilter(target.dataset.gemFilter);
    document.querySelector("#shop").scrollIntoView({ behavior: "smooth" });
  }

  if (target.dataset.openProduct) openProduct(target.dataset.openProduct);
  if (target.dataset.openAdmin !== undefined) {
    renderAdmin();
    openDrawer(adminDrawer);
  }
  if (target.dataset.closeAdmin !== undefined) closeDrawer(adminDrawer);
  if (target.dataset.closeProduct !== undefined) closeProduct();
  if (target.dataset.editProduct) editProduct(target.dataset.editProduct);
});

document.querySelectorAll(".bespoke-form, .contact-form").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = encodeURIComponent("Hi, I would like to make an enquiry from the ZanJewelry website.");
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank", "noopener");
    form.reset();
  });
});

productModal.addEventListener("click", (event) => {
  if (event.target === productModal) closeProduct();
});

[adminDrawer].forEach((drawer) => {
  drawer.addEventListener("click", (event) => {
    if (event.target === drawer) closeDrawer(drawer);
  });
});

window.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  closeDrawer(adminDrawer);
  closeProduct();
});

function bootHashProduct() {
  if (!window.location.hash.startsWith("#product-")) return;
  openProduct(window.location.hash.replace("#product-", ""));
}

renderProducts();
renderAdmin();
bootHashProduct();
