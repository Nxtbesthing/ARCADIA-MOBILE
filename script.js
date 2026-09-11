import { getIphoneColors, iphoneCatalog, iphoneModels, isValidIphoneVariant } from "./src/iphone-catalog.js";
import { getSamsungColors, samsungCatalog, samsungModels, isValidSamsungVariant } from "./src/samsung-catalog.js";
import { getRedmiColors, redmiCatalog, redmiModels, isValidRedmiVariant } from "./src/redmi-catalog.js";
import { getTecnoColors, tecnoCatalog, tecnoModels, isValidTecnoVariant } from "./src/tecno-catalog.js";
import { getItelColors, itelCatalog, itelModels, isValidItelVariant } from "./src/itel-catalog.js";
import { getInfinixColors, infinixCatalog, infinixModels, isValidInfinixVariant } from "./src/infinix-catalog.js";

const fallbackProducts = [
  {
    id: 1,
    name: "iPhone 13",
    brand: "Apple",
    category: "Smartphones",
    categoryKey: "iphone",
    price: 650000,
    oldPrice: 700000,
    discount: 7,
    description: "A premium smartphone with fast performance, a reliable camera system, and a refined design.",
    images: [
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=900&q=80"
    ],
    specifications: ["6.1-inch Super Retina XDR", "A15 Bionic", "128GB storage", "Dual-camera system"],
    condition: "Used",
    storage: "128GB",
    color: "Midnight",
    stock: 5,
    warranty: "30 Days",
    rating: 5.0,
    reviews: 218,
    sku: "APL-IP13-128-MN"
  },
  {
    id: 2,
    name: "Galaxy S24",
    brand: "Samsung",
    category: "Smartphones",
    categoryKey: "samsung",
    price: 590000,
    oldPrice: 640000,
    discount: 8,
    description: "AI-powered performance and a crisp display for work, content creation, and everyday use.",
    images: [
      "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=900&q=80"
    ],
    specifications: ["6.2-inch AMOLED", "256GB storage", "50MP camera", "Fast charging"],
    condition: "New",
    storage: "256GB",
    color: "Onyx Black",
    stock: 7,
    warranty: "12 Months",
    rating: 4.9,
    reviews: 184,
    sku: "SAM-GS24-256-BLK"
  },
  {
    id: 3,
    name: "Pixel 8 Pro",
    brand: "Google",
    category: "Smartphones",
    categoryKey: "android",
    price: 520000,
    oldPrice: 560000,
    discount: 7,
    description: "Clean Android software, excellent camera quality, and dependable daily performance.",
    images: [
      "https://images.unsplash.com/photo-1521498542256-5aeb8f7e07d9?auto=format&fit=crop&w=900&q=80"
    ],
    specifications: ["6.7-inch display", "128GB storage", "AI photography", "7 years updates"],
    condition: "New",
    storage: "128GB",
    color: "Porcelain",
    stock: 4,
    warranty: "12 Months",
    rating: 4.8,
    reviews: 126,
    sku: "GGL-P8P-128-PRL"
  },
  {
    id: 4,
    name: "Galaxy Tab S9",
    brand: "Samsung",
    category: "Tablets",
    categoryKey: "tablets",
    price: 470000,
    oldPrice: 520000,
    discount: 10,
    description: "A high-performance tablet designed for study, work, and entertainment on the move.",
    images: [
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=900&q=80"
    ],
    specifications: ["11-inch screen", "256GB storage", "S Pen support", "12-hour battery"],
    condition: "New",
    storage: "256GB",
    color: "Graphite",
    stock: 3,
    warranty: "12 Months",
    rating: 4.8,
    reviews: 94,
    sku: "SAM-TABS9-256-GRA"
  },
  {
    id: 5,
    name: "AirPods Pro 2",
    brand: "Apple",
    category: "Audio",
    categoryKey: "audio",
    price: 83000,
    oldPrice: 95000,
    discount: 13,
    description: "Noise cancellation and seamless pairing in a compact, premium audio solution.",
    images: [
      "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=900&q=80"
    ],
    specifications: ["USB-C case", "Adaptive audio", "Spatial audio", "24-hour battery"],
    condition: "New",
    storage: "N/A",
    color: "White",
    stock: 11,
    warranty: "12 Months",
    rating: 5.0,
    reviews: 467,
    sku: "APL-AP2-WHT"
  },
  {
    id: 6,
    name: "Galaxy Watch 6",
    brand: "Samsung",
    category: "Smartwatches",
    categoryKey: "smartwatches",
    price: 135000,
    oldPrice: 160000,
    discount: 16,
    description: "A premium wearable for tracking health, workouts, notifications, and your daily rhythm.",
    images: [
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=900&q=80"
    ],
    specifications: ["44mm case", "GPS + Bluetooth", "Sleep tracking", "Water resistant"],
    condition: "New",
    storage: "32GB",
    color: "Silver",
    stock: 9,
    warranty: "12 Months",
    rating: 4.8,
    reviews: 87,
    sku: "SAM-GW6-32-SLV"
  },
  {
    id: 7,
    name: "20W USB-C Charger",
    brand: "Anker",
    category: "Accessories",
    categoryKey: "accessories",
    price: 12000,
    oldPrice: 16000,
    discount: 25,
    description: "Fast charging for smartphones, tablets, and universal charging needs.",
    images: [
      "https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=900&q=80"
    ],
    specifications: ["20W output", "USB-C", "Power delivery", "Compact form"],
    condition: "New",
    storage: "N/A",
    color: "Black",
    stock: 18,
    warranty: "6 Months",
    rating: 4.7,
    reviews: 102,
    sku: "ANK-20W-USB-C-BLK"
  },
  {
    id: 8,
    name: "Glass Screen Protector",
    brand: "ZAGG",
    category: "Accessories",
    categoryKey: "accessories",
    price: 18000,
    oldPrice: 22000,
    discount: 18,
    description: "Impact-resistant protection designed to keep your device safe during everyday use.",
    images: [
      "https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&w=900&q=80"
    ],
    specifications: ["Tempered glass", "Scratch resistant", "Case-friendly", "Oleophobic coating"],
    condition: "New",
    storage: "N/A",
    color: "Clear",
    stock: 22,
    warranty: "6 Months",
    rating: 4.8,
    reviews: 113,
    sku: "ZAG-GLASS-TP-CLEAR"
  },
  {
    id: 9,
    name: "20,000mAh Power Bank",
    brand: "UGREEN",
    category: "Accessories",
    categoryKey: "accessories",
    price: 25000,
    oldPrice: 32000,
    discount: 22,
    description: "Reliable backup power for travel, work, and long days away from a plug point.",
    images: [
      "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=900&q=80"
    ],
    specifications: ["20,000mAh", "USB-C", "2-port output", "Rechargeable"],
    condition: "New",
    storage: "N/A",
    color: "Black",
    stock: 14,
    warranty: "12 Months",
    rating: 4.7,
    reviews: 96,
    sku: "UGR-PB20-BLK"
  },
  {
    id: 10,
    name: "Screen Replacement",
    brand: "Arcadia",
    category: "Repairs",
    categoryKey: "repairs",
    price: 48000,
    oldPrice: 60000,
    discount: 20,
    description: "Professional screen repair service with diagnostics, quality replacement parts, and warranty coverage.",
    images: [
      "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=900&q=80"
    ],
    specifications: ["Display repair", "Diagnostics", "Warranty included", "Same-day service"],
    condition: "Service",
    storage: "Device dependent",
    color: "N/A",
    stock: 1,
    warranty: "90 Days",
    rating: 4.9,
    reviews: 71,
    sku: "ARC-SCR-RP-STD"
  }
];

const IPHONE_MODELS = iphoneModels;
const SAMSUNG_MODELS = samsungModels;
const REDMI_MODELS = redmiModels;
const TECNO_MODELS = tecnoModels;
const ITEL_MODELS = itelModels;
const INFINIX_MODELS = infinixModels;

const structuredCatalogs = {
  Apple: { catalog: iphoneCatalog, models: iphoneModels, getColors: getIphoneColors, isValid: isValidIphoneVariant, category: "iphone" },
  Samsung: { catalog: samsungCatalog, models: samsungModels, getColors: getSamsungColors, isValid: isValidSamsungVariant, category: "samsung" },
  REDMI: { catalog: redmiCatalog, models: redmiModels, getColors: getRedmiColors, isValid: isValidRedmiVariant, category: "redmi" },
  TECNO: { catalog: tecnoCatalog, models: tecnoModels, getColors: getTecnoColors, isValid: isValidTecnoVariant, category: "tecno" },
  itel: { catalog: itelCatalog, models: itelModels, getColors: getItelColors, isValid: isValidItelVariant, category: "itel" },
  Infinix: { catalog: infinixCatalog, models: infinixModels, getColors: getInfinixColors, isValid: isValidInfinixVariant, category: "infinix" }
};

const WARRANTY_OPTIONS = ["No Warranty", ...Array.from({ length: 12 }, (_, index) => `${index + 1} Month${index ? "s" : ""}`)];

function calculatePricing(originalPrice, discountPercentage) {
  const original = Math.max(0, Number(originalPrice) || 0);
  const discount = Math.min(100, Math.max(0, Number(discountPercentage) || 0));
  const discountAmount = Math.round(original * (discount / 100));
  return { originalPrice: original, discountPercentage: discount, discountAmount, finalPrice: original - discountAmount };
}

function getDiscountLabel(pricing) {
  return Number(pricing.discountPercentage) > 0 ? `${pricing.discountPercentage}% OFF` : "";
}

function renderPriceMarkup(pricing, prefix = "") {
  const discountLabel = getDiscountLabel(pricing);
  return `<span class="current-price">${formatCurrency(pricing.finalPrice)}</span>${discountLabel ? `<span class="old-price">${formatCurrency(pricing.originalPrice)}</span><span class="discount-badge">${discountLabel}</span>` : ""}`;
}

function getPricingFromVariant(variant) {
  const originalPrice = Number.isFinite(Number(variant.originalPrice))
    ? Number(variant.originalPrice)
    : Number(variant.oldPrice || variant.price) || 0;
  const discountPercentage = Number.isFinite(Number(variant.discountPercentage))
    ? Number(variant.discountPercentage)
    : Number.isFinite(Number(variant.discount))
      ? Number(variant.discount)
      : Number.isFinite(Number(variant.discountPercentage))
        ? Number(variant.discountPercentage)
        : originalPrice > Number(variant.price) ? ((originalPrice - Number(variant.price)) / originalPrice) * 100 : 0;
  return calculatePricing(originalPrice, discountPercentage);
}

function renderWarrantyOptions(selected = "No Warranty") {
  return WARRANTY_OPTIONS.map((option) => `<option value="${option}" ${option === selected ? "selected" : ""}>${option}</option>`).join("");
}

function getStructuredCatalog(brand, categoryKey) {
  const catalog = structuredCatalogs[brand];
  return catalog?.category === categoryKey ? catalog : null;
}

let products = [...fallbackProducts];

let selectedCategory = "all";
let searchTerm = "";
let cart = [];
let wishlist = [];
let customer = null;
let detailQuantity = 1;
let selectedDetailVariantId = null;

const CART_STORAGE_KEY = "arcadia-cart";
const WISHLIST_STORAGE_KEY = "arcadia-wishlist";
const CUSTOMER_STORAGE_KEY = "arcadia-customer";
const PRODUCT_STORAGE_KEY = "arcadia-admin-products";
const CATALOG_STORAGE_KEY = "arcadia-device-catalog";
const BILLBOARD_STORAGE_KEY = "arcadia-billboard";

const productStorage = {
  getProducts() {
    try {
      const savedProducts = JSON.parse(localStorage.getItem(PRODUCT_STORAGE_KEY) || "null");
      return Array.isArray(savedProducts) && savedProducts.length ? savedProducts : [...fallbackProducts];
    } catch (error) {
      return [...fallbackProducts];
    }
  },
  saveProducts(nextProducts) {
    const normalized = nextProducts.map(normalizeProduct);
    localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(normalized));
  }
};

const catalogStorage = {
  getCatalog() {
    try {
      const catalog = JSON.parse(localStorage.getItem(CATALOG_STORAGE_KEY) || "[]");
      return Array.isArray(catalog) ? catalog : [];
    } catch (error) {
      return [];
    }
  },
  saveCatalog(catalog) {
    localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(catalog));
  }
};

const billboardStorage = {
  getBillboard() {
    try {
      const saved = JSON.parse(localStorage.getItem(BILLBOARD_STORAGE_KEY) || "null");
      return saved && (saved.title || saved.message || saved.media) ? saved : { label: "", title: "", message: "", mediaType: "", media: "" };
    } catch (error) {
      return { label: "", title: "", message: "", mediaType: "", media: "" };
    }
  },
  saveBillboard(billboard) {
    localStorage.setItem(BILLBOARD_STORAGE_KEY, JSON.stringify(billboard));
  }
};

function renderBillboard() {
  const container = document.getElementById("heroBillboard");
  if (!container) return;
  const billboard = billboardStorage.getBillboard();
  const isEmpty = !billboard.title && !billboard.message && !billboard.media;
  if (isEmpty) {
    container.innerHTML = `<div class="billboard-empty"><span class="billboard-megaphone" aria-hidden="true">📣</span><strong>ANNOUNCEMENTS</strong><p>Arcadia promotions will appear here.</p></div>`;
    return;
  }
  const media = billboard.mediaType === "video" && billboard.media
    ? `<video src="${billboard.media}" muted autoplay loop playsinline aria-label="${escapeHtml(billboard.title)}"></video>`
    : billboard.media
      ? `<img src="${billboard.media}" alt="${escapeHtml(billboard.title)}" />`
      : "";
  container.innerHTML = `${media}<div class="billboard-copy"><span>${escapeHtml(billboard.label || "ARCADIA MOBILE")}</span><strong>${escapeHtml(billboard.title)}</strong><p>${escapeHtml(billboard.message)}</p></div>`;
}

function createLegacyVariant(product) {
  const pricing = getPricingFromVariant(product);
  return {
    id: `${product.id}-default`,
    storage: product.storage || "N/A",
    color: product.color || "N/A",
    condition: product.condition || "New",
    batteryHealth: product.batteryHealth || "",
    faceId: product.faceId || "",
    trueTone: product.trueTone || "",
    display: product.display || "",
    camera: product.camera || "",
    sim: product.sim || "",
    ...pricing,
    price: pricing.finalPrice,
    oldPrice: pricing.originalPrice,
    stock: Number(product.stock) || 0,
    sku: product.sku || `${product.id}-DEFAULT`,
    warranty: product.warranty || "No Warranty",
    warrantyMonths: product.warrantyMonths || 0,
    images: Array.isArray(product.images) ? product.images : []
  };
}

function normalizeProduct(product) {
  const variants = (Array.isArray(product.variants) && product.variants.length
    ? product.variants
    : [createLegacyVariant(product)]).map((variant) => {
      const pricing = getPricingFromVariant(variant);
      return { ...variant, ...pricing, price: pricing.finalPrice, oldPrice: pricing.originalPrice };
    });
  const defaultVariant = variants.find((variant) => variant.stock > 0) || variants[0];
  return {
    ...product,
    variants,
    price: Number(defaultVariant.price) || 0,
    oldPrice: Number(defaultVariant.oldPrice || defaultVariant.price) || 0,
    originalPrice: defaultVariant.originalPrice,
    discountPercentage: defaultVariant.discountPercentage,
    discountAmount: defaultVariant.discountAmount,
    finalPrice: defaultVariant.finalPrice,
    discount: defaultVariant.discountPercentage,
    stock: variants.reduce((total, variant) => total + (Number(variant.stock) || 0), 0),
    images: defaultVariant.images?.length ? defaultVariant.images : product.images,
    storage: defaultVariant.storage,
    color: defaultVariant.color,
    condition: defaultVariant.condition,
    warranty: defaultVariant.warranty,
    warrantyMonths: defaultVariant.warrantyMonths || 0,
    sku: defaultVariant.sku
  };
}

function normalizeProducts() {
  products = products.map(normalizeProduct);
}

function getProductVariant(product, variantId) {
  return product.variants?.find((variant) => variant.id === variantId) || product.variants?.[0] || createLegacyVariant(product);
}

function validateVariants(variants, product = {}) {
  if (!variants.length) return "Add at least one variant.";
  const existingSkus = new Set(products.flatMap((product) => (product.variants || []).map((variant) => String(variant.sku || "").trim().toLowerCase())));
  const submittedSkus = new Set();
  const submittedIdentities = new Set();
  for (const variant of variants) {
    const sku = String(variant.sku || "").trim().toLowerCase();
    if (!sku) return "Every variant needs a SKU.";
    if (Number(variant.price) < 0 || !Number.isFinite(Number(variant.price))) return "Prices must be valid and cannot be negative.";
    if (Number(variant.originalPrice) < 0 || !Number.isFinite(Number(variant.originalPrice))) return "Original prices must be valid and cannot be negative.";
    if (Number(variant.discountPercentage) < 0 || Number(variant.discountPercentage) > 100 || !Number.isFinite(Number(variant.discountPercentage))) return "Discount must be between 0% and 100%.";
    if (Number(variant.stock) < 0 || !Number.isFinite(Number(variant.stock))) return "Stock must be valid and cannot be negative.";
    if (existingSkus.has(sku) || submittedSkus.has(sku)) return `SKU ${variant.sku} already exists.`;
    const identity = `${product.brand}|${product.name}|${variant.storage}|${variant.color}`.toLowerCase();
    if (submittedIdentities.has(identity)) return "Duplicate model, storage, and color variants are not allowed.";
    submittedIdentities.add(identity);
    const structuredCatalog = getStructuredCatalog(product.brand, product.categoryKey);
    if (structuredCatalog && !structuredCatalog.isValid(product.name, variant.storage, variant.color)) {
      return `${product.name} is not available in ${variant.storage} / ${variant.color}.`;
    }
    submittedSkus.add(sku);
  }
  return "";
}
const ORDERS_STORAGE_KEY = "arcadia-orders";
const REPAIRS_STORAGE_KEY = "arcadia-repairs";
const DELIVERY_RATES = {
  jos: 2000,
  "jos north": 2000,
  rayfield: 2500,
  "other plateau": 3000,
  lagos: 5000,
  abuja: 5000,
  kaduna: 5000,
  kano: 5500,
  "port harcourt": 5500
};
const ORDER_STATUSES = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"];

const REPAIR_STATUSES = ["Requested", "Received", "Diagnosing", "Awaiting Approval", "Repairing", "Testing", "Ready", "Completed", "Cancelled"];
const REPAIR_DEVICES = ["iPhone", "Samsung", "Tecno", "Infinix", "Xiaomi", "Laptop", "Tablet", "Other"];
const REPAIR_PROBLEMS = ["Broken Screen", "Battery", "Charging", "Camera", "Speaker", "Software", "Water Damage", "Other"];
let adminProfile = null;

const appLoader = document.getElementById("appLoader");
const localBusinessSchema = document.getElementById("localBusinessSchema");
const productSchema = document.getElementById("productSchema");
const productGrid = document.getElementById("productGrid");
const dealGrid = document.getElementById("dealGrid");
const filterButtons = document.querySelectorAll(".filter-btn");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const cartPanel = document.getElementById("cartPanel");
const cartItems = document.getElementById("cartItems");
const cartSubtotal = document.getElementById("cartSubtotal");
const cartDelivery = document.getElementById("cartDelivery");
const cartTotal = document.getElementById("cartTotal");
const cartCount = document.getElementById("cartCount");
const cartToggleButton = document.querySelector(".cart-btn");
const closeCartButton = document.querySelector(".close-cart");
const menuToggle = document.querySelector(".menu-toggle");
const mobileMenu = document.getElementById("mobileMenu");
const productDetailPage = document.getElementById("productDetailPage");
const wishlistPage = document.getElementById("wishlistPage");
const wishlistButton = document.querySelector(".wishlist-btn");
const wishlistCount = document.getElementById("wishlistCount");
const accountPage = document.getElementById("accountPage");
const accountButton = document.querySelector(".account-btn");
const adminButton = document.querySelector(".admin-btn");
const checkoutPage = document.getElementById("checkoutPage");
const proceedToCheckoutButton = document.getElementById("proceedToCheckout");
const repairPage = document.getElementById("repairPage");
const adminPage = document.getElementById("adminPage");
const homeMain = document.getElementById("home");

const paymentConfig = {
  publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || ""
};
const localPaymentMethods = [
  { id: "opay-transfer", name: "OPay", accountNumber: "8020376702", accountName: "Oliver Latnie Buenyen" },
  { id: "moniepoint-transfer", name: "Moniepoint", accountNumber: "8020376702", accountName: "Oliver Latnie Buenyen" }
];
const ADMIN_SESSION_KEY = "arcadia-admin-authenticated";
const LOCAL_ADMIN_CONFIG = {
  email: "oliverbuenyen3@gmail.com",
  password: "Oda3ry76033##"
};
const HOME_SECTION_HASHES = ["", "#home", "#products", "#accessories", "#repairs", "#deals", "#about", "#contact"];

if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getOptimizedImageUrl(url, width = 900, quality = 80) {
  if (!url || typeof url !== "string") return "";

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname.includes("images.unsplash.com")) {
      parsedUrl.searchParams.set("auto", "format");
      parsedUrl.searchParams.set("fit", "crop");
      parsedUrl.searchParams.set("q", String(quality));
      parsedUrl.searchParams.set("w", String(width));
      return parsedUrl.toString();
    }
  } catch (error) {
    return url;
  }

  return url;
}

function createResponsiveImageMarkup(src, alt, { width = 800, height = 600, loading = "lazy", fetchPriority = "", sizes = "" } = {}) {
  const safeAlt = escapeHtml(alt || "Product image");
  const normalizedSrc = getOptimizedImageUrl(src, width);
  const fetchPriorityAttr = fetchPriority ? ` fetchpriority="${fetchPriority}"` : "";
  const sizesAttr = sizes ? ` sizes="${sizes}"` : "";
  const effectiveHeight = height || Math.round(width * 0.75);

  return `<img src="${normalizedSrc}" alt="${safeAlt}" width="${width}" height="${effectiveHeight}" loading="${loading}" decoding="async"${fetchPriorityAttr}${sizesAttr} />`;
}

function enhancePasswordInputs(container) {
  container.querySelectorAll('input[type="password"]').forEach((input) => {
    const field = document.createElement("span");
    field.className = "password-field";
    input.parentNode.insertBefore(field, input);
    field.appendChild(input);

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "password-toggle";
    toggle.textContent = "SHOW";
    toggle.setAttribute("aria-label", "Show password");
    toggle.setAttribute("aria-pressed", "false");
    toggle.addEventListener("click", () => {
      const isVisible = input.type === "text";
      input.type = isVisible ? "password" : "text";
      toggle.textContent = isVisible ? "SHOW" : "HIDE";
      toggle.setAttribute("aria-label", isVisible ? "Show password" : "Hide password");
      toggle.setAttribute("aria-pressed", String(!isVisible));
    });
    field.appendChild(toggle);
  });
}

function normalizePhoneNumber(value) {
  return String(value || "").replace(/\D+/g, "");
}

function normalizeEmailAddress(value) {
  return String(value || "").trim().toLowerCase();
}

function isAuthorizedAdminAccount(account) {
  return isLocalAdminAuthenticated();
}

function normalizeName(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function syncAdminButtonState() {
  if (!adminButton) return;
  adminButton.hidden = false;
  adminButton.removeAttribute("aria-hidden");
}

function enforceAuthorizedAdminAccess() {
  syncAdminButtonState();
}

function validateCustomerFields(values) {
  const name = String(values.name || "").trim();
  const phone = String(values.phone || "").trim();
  const email = String(values.email || "").trim();
  if (name.length < 2 || name.length > 100) return "Enter a valid name.";
  if (!/^[+\d][\d\s()-]{7,20}$/.test(phone)) return "Enter a valid phone number.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address.";
  return "";
}

function isLocalAdminAuthenticated() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
}

function loadLocalAdminProducts() {
  products = productStorage.getProducts();
}

async function adminProductAction(action, productId, payload = {}) {
  if (action === "delete") products = products.filter((product) => product.id !== productId);
  if (action === "update") products = products.map((product) => product.id === productId ? { ...product, ...payload } : product);
  if (action === "create") {
    const price = Number(payload.price) || 0;
    products = [{
      id: Date.now(),
      images: [fallbackProducts[0].images[0]],
      specifications: [],
      rating: 0,
      reviews: 0,
      stock: 0,
      oldPrice: price,
      discount: 0,
      category: "Electronics",
      categoryKey: "all",
      ...payload
    }, ...products];
  }
  productStorage.saveProducts(products);
  renderDeals();
  renderProducts();
}

function readImageFiles(files) {
  return Promise.all(Array.from(files || []).filter((file) => file && file.size > 0).map((file) => new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Only image files can be uploaded."));
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(new Error("The image could not be read.")));
    reader.readAsDataURL(file);
  })));
}

function readMediaFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.size) return reject(new Error("Choose an image or video."));
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) return reject(new Error("Only image and video files are supported."));
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve({ type: file.type.startsWith("video/") ? "video" : "image", data: reader.result }));
    reader.addEventListener("error", () => reject(new Error("The billboard media could not be read.")));
    reader.readAsDataURL(file);
  });
}

function renderBillboardSection() {
  const billboard = billboardStorage.getBillboard();
  const mediaPreview = billboard.mediaType === "video" && billboard.media ? `<video src="${billboard.media}" controls></video>` : billboard.media ? `<img src="${billboard.media}" alt="Billboard preview" />` : "<p>No media selected.</p>";
  return `<form class="billboard-admin-form" id="billboardForm"><label>Label<input name="label" value="${escapeHtml(billboard.label)}" placeholder="PROMOTION" required /></label><label>Headline<input name="title" value="${escapeHtml(billboard.title)}" placeholder="Announcement headline" required /></label><label>Message<textarea name="message" rows="3" placeholder="Discount or promotion details" required>${escapeHtml(billboard.message)}</textarea></label><label class="admin-image-upload">ADD IMAGE OR VIDEO<input name="media" id="billboardMedia" type="file" accept="image/*,video/*" required /><span id="billboardMediaName">Choose media from your files</span></label><div class="billboard-admin-preview" id="billboardAdminPreview">${mediaPreview}</div><button class="primary-btn" type="submit">PUBLISH BILL BOARD</button></form>`;
}

function renderVariantManager(productId) {
  const product = products.find((entry) => entry.id === productId);
  if (!product) return;
  const variantRows = product.variants.map((variant) => `
    <div class="variant-manager-row">
      <strong>${escapeHtml(variant.storage)} / ${escapeHtml(variant.color)}</strong>
      <span>${formatCurrency(variant.price)} · Stock ${variant.stock}</span>
      <span>${escapeHtml(variant.sku)}</span>
      <div><button class="admin-action" data-variant-action="edit" data-variant-id="${escapeHtml(variant.id)}">EDIT</button><button class="admin-action" data-variant-action="duplicate" data-variant-id="${escapeHtml(variant.id)}">DUPLICATE</button><button class="admin-action danger" data-variant-action="delete" data-variant-id="${escapeHtml(variant.id)}">DELETE</button></div>
    </div>
  `).join("");
  const structuredCatalog = getStructuredCatalog(product.brand, product.categoryKey);
  const storageControl = structuredCatalog
    ? `<select name="storage" id="variantEditStorage" required>${Object.keys(structuredCatalog.catalog[product.name]?.storages || {}).map((storage) => `<option>${escapeHtml(storage)}</option>`).join("")}</select>`
    : `<input name="storage" required />`;
  const colorControl = structuredCatalog ? `<select name="color" id="variantEditColor" required></select>` : `<input name="color" required />`;
  adminPage.insertAdjacentHTML("beforeend", `<div class="admin-variant-modal" id="variantManagerModal"><div class="admin-variant-dialog"><button class="admin-access-close" id="closeVariantManager" type="button" aria-label="Close variant manager">×</button><p class="eyebrow">PRODUCT MANAGEMENT</p><h2>${escapeHtml(product.name)} VARIANTS</h2><div class="variant-manager-list">${variantRows}</div><form class="variant-edit-form hidden" id="variantEditForm"><input type="hidden" name="variantId" /><div class="variant-edit-grid"><label>Storage${storageControl}</label><label>Color${colorControl}</label><label>RAM<input name="ram" /></label><label>Condition<input name="condition" required /></label><label>Original price<input name="originalPrice" type="number" min="0" required /></label><label>Discount (%)<input name="discountPercentage" type="number" min="0" max="100" step="0.01" required /></label><label>Discount amount<output name="discountAmount">₦ 0</output></label><label>Final price<output name="finalPrice">₦ 0</output></label><label>Stock<input name="stock" type="number" min="0" required /></label><label>SKU<input name="sku" required /></label><label>Warranty<select name="warranty">${renderWarrantyOptions()}</select></label><label>Battery health<input name="batteryHealth" type="number" min="0" max="100" /></label><label>Face ID<input name="faceId" /></label><label>True Tone<input name="trueTone" /></label><label>Display<input name="display" /></label><label>Battery<input name="battery" /></label><label>Camera<input name="camera" /></label><label>Speaker<input name="speaker" /></label><label>Microphone<input name="microphone" /></label><label>Charging<input name="charging" /></label><label>SIM/network<input name="sim" /></label><label class="full-field">Notes<textarea name="notes" rows="3"></textarea></label><label class="full-field">Replace image<input name="image" type="file" accept="image/*" /></label></div><div class="confirmation-actions"><button class="primary-btn" type="submit">SAVE VARIANT</button><button class="secondary-btn" id="cancelVariantEdit" type="button">CANCEL</button></div></form></div></div>`);

  const modal = document.getElementById("variantManagerModal");
  const form = document.getElementById("variantEditForm");
  const editStorage = document.getElementById("variantEditStorage");
  const editColor = document.getElementById("variantEditColor");
  const updateEditColors = (selectedColor = "") => {
    if (!structuredCatalog || !editStorage || !editColor) return;
    editColor.innerHTML = structuredCatalog.getColors(product.name, editStorage.value).map((color) => `<option ${color === selectedColor ? "selected" : ""}>${escapeHtml(color)}</option>`).join("");
  };
  editStorage?.addEventListener("change", () => updateEditColors());
  updateEditColors();
  const updateEditPricing = () => {
    const pricing = calculatePricing(form.elements.originalPrice.value, form.elements.discountPercentage.value);
    form.elements.discountAmount.value = formatCurrency(pricing.discountAmount);
    form.elements.finalPrice.value = formatCurrency(pricing.finalPrice);
  };
  form.elements.originalPrice.addEventListener("input", updateEditPricing);
  form.elements.discountPercentage.addEventListener("input", updateEditPricing);
  const close = () => modal.remove();
  document.getElementById("closeVariantManager").addEventListener("click", close);
  document.getElementById("cancelVariantEdit").addEventListener("click", () => form.classList.add("hidden"));
  modal.querySelectorAll("[data-variant-action]").forEach((button) => button.addEventListener("click", async () => {
    const variantId = button.dataset.variantId;
    const variant = product.variants.find((entry) => entry.id === variantId);
    if (!variant) return;
    if (button.dataset.variantAction === "delete") {
      if (product.variants.length === 1) { window.alert("A product must keep at least one variant."); return; }
      if (!window.confirm("Delete this variant?")) return;
      product.variants = product.variants.filter((entry) => entry.id !== variantId);
      productStorage.saveProducts(products.map(normalizeProduct));
      products = products.map(normalizeProduct);
      renderVariantManager(productId);
      renderAdminPage("products", "Variant deleted.");
      return;
    }
    if (button.dataset.variantAction === "duplicate") {
      window.alert("A model, storage, and color combination can only have one variant.");
      return;
    }
    form.classList.remove("hidden");
    Object.entries(variant).forEach(([key, value]) => { const input = form.elements[key]; if (input && key !== "images") input.value = value ?? ""; });
    updateEditColors(variant.color);
    form.elements.originalPrice.value = variant.originalPrice;
    form.elements.discountPercentage.value = variant.discountPercentage;
    updateEditPricing();
    form.elements.variantId.value = variant.id;
  }));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const variant = product.variants.find((entry) => entry.id === data.get("variantId"));
    if (!variant) return;
    const structuredCatalog = getStructuredCatalog(product.brand, product.categoryKey);
    if (structuredCatalog && !structuredCatalog.isValid(product.name, data.get("storage"), data.get("color"))) { window.alert(`Choose a valid ${product.brand} storage and color combination.`); return; }
    if (product.variants.some((entry) => entry.id !== variant.id && entry.storage === data.get("storage") && entry.color === data.get("color"))) { window.alert("That model, storage, and color variant already exists."); return; }
    const sku = String(data.get("sku")).trim();
    const duplicateSku = products.some((entry) => entry.variants.some((item) => item.id !== variant.id && String(item.sku).toLowerCase() === sku.toLowerCase()));
    if (duplicateSku) { window.alert("That SKU already exists."); return; }
    const pricing = calculatePricing(data.get("originalPrice"), data.get("discountPercentage"));
    Object.assign(variant, { storage: data.get("storage"), color: data.get("color"), ram: data.get("ram"), condition: data.get("condition"), ...pricing, price: pricing.finalPrice, oldPrice: pricing.originalPrice, stock: Number(data.get("stock")), sku, warranty: data.get("warranty"), warrantyMonths: WARRANTY_OPTIONS.indexOf(data.get("warranty")), batteryHealth: data.get("batteryHealth"), faceId: data.get("faceId"), trueTone: data.get("trueTone"), display: data.get("display"), battery: data.get("battery"), camera: data.get("camera"), speaker: data.get("speaker"), microphone: data.get("microphone"), charging: data.get("charging"), sim: data.get("sim"), notes: data.get("notes") });
    const images = await readImageFiles(data.getAll("image"));
    if (images.length) variant.images = images;
    products = products.map(normalizeProduct);
    productStorage.saveProducts(products);
    renderAdminPage("products", "Variant updated.");
    renderProducts();
  });
}

function renderCatalogSection() {
  const catalog = catalogStorage.getCatalog();
  return `<form class="catalog-manager-form" id="catalogManagerForm"><input name="brand" placeholder="Brand" required /><input name="series" placeholder="Series" required /><input name="model" placeholder="Model" required /><input name="storage" placeholder="Verified storage options, comma separated" /><input name="ram" placeholder="Verified RAM options, comma separated" /><input name="colors" placeholder="Verified colors, comma separated" /><label><input name="verified" type="checkbox" /> I have verified these options</label><button class="primary-btn" type="submit">SAVE CATALOG MODEL</button><p class="catalog-manager-note">Only mark options verified when checked against a reliable manufacturer or product reference.</p></form><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Brand</th><th>Model</th><th>Storage</th><th>RAM</th><th>Colors</th><th>Verified</th><th>Action</th></tr></thead><tbody>${catalog.map((entry) => `<tr><td>${escapeHtml(entry.brand)}</td><td>${escapeHtml(entry.model)}</td><td>${escapeHtml(entry.storage.join(", ")) || "-"}</td><td>${escapeHtml(entry.ram.join(", ")) || "-"}</td><td>${escapeHtml(entry.colors.join(", ")) || "-"}</td><td>${entry.verified ? "Yes" : "Needs verification"}</td><td><button class="admin-action catalog-edit" data-id="${escapeHtml(entry.id)}" type="button">EDIT</button><button class="admin-action danger catalog-delete" data-id="${escapeHtml(entry.id)}" type="button">DELETE</button></td></tr>`).join("") || '<tr><td colspan="7">No catalog models saved.</td></tr>'}</tbody></table></div>`;
}

function renderAdminPage(section = "overview", notice = "") {
  const orders = loadOrdersFromStorage();
  const repairs = loadRepairsFromStorage();
  const sectionBody = section === "bill-board" ? renderBillboardSection() : section === "catalog" ? renderCatalogSection() : section === "products" ? `
    <form class="admin-product-form" id="adminProductForm">
      <input name="name" placeholder="Product name" required />
      <select name="brand" id="adminProductBrand" aria-label="Brand" required><option value="Apple">Apple</option><option value="Samsung">Samsung</option><option value="REDMI">REDMI</option><option value="TECNO">TECNO</option><option value="itel">itel</option><option value="Infinix">Infinix</option><option value="Other">Other</option></select>
      <select name="model" id="adminProductModel" aria-label="Model" required>${IPHONE_MODELS.map((model) => `<option>${model}</option>`).join("")}</select>
      <select name="categoryKey" aria-label="Product category"><option value="iphone">iPhone</option><option value="samsung">Samsung</option><option value="redmi">REDMI</option><option value="tecno">TECNO</option><option value="itel">itel</option><option value="infinix">Infinix</option><option value="android">Android phone</option><option value="tablets">Tablet</option><option value="accessories">Accessory</option><option value="audio">Audio</option><option value="smartwatches">Smartwatch</option><option value="repairs">Repair service</option></select>
      <div id="appleVariantControls">
        <label>Storage<select name="catalogStorage" id="catalogStorage" required></select></label>
        <fieldset class="catalog-color-picker"><legend>Available colors</legend><div id="catalogColors"></div></fieldset>
      </div>
      <div id="manualVariantControls" class="hidden">
        <input name="bulkStorage" placeholder="Generate storage options: 128GB, 256GB" />
        <input name="bulkColors" placeholder="Generate colors: Midnight, Blue" />
        <button class="admin-action" id="generateVariants" type="button">GENERATE VARIANTS</button>
      </div>
      <div class="bulk-pricing-controls">
        <label>Apply discount to all variants (%)<input id="bulkDiscountPercentage" type="number" min="0" max="100" step="0.01" value="0" /></label>
        <button class="admin-action" id="applyBulkDiscount" type="button">APPLY DISCOUNT</button>
      </div>
      <div class="admin-variant-builder" id="adminVariantBuilder">
        <div class="admin-variant-row">
          <input name="variantStorage" placeholder="Storage / RAM (e.g. 128GB)" />
          <input name="variantColor" placeholder="Color" />
          <select name="variantCondition" aria-label="Condition"><option>New</option><option>Like New</option><option>Excellent</option><option>Good</option><option>Fair</option><option>Refurbished</option></select>
          <input name="variantOriginalPrice" type="number" min="0" placeholder="Original price" required />
          <input name="variantDiscountPercentage" type="number" min="0" max="100" step="0.01" placeholder="Discount (%)" value="0" required />
          <span class="variant-discount-amount">Discount: ₦ 0</span>
          <output class="variant-final-price">Final price: ₦ 0</output>
          <input name="variantStock" type="number" min="0" placeholder="Stock" required />
          <input name="variantSku" placeholder="SKU" required />
          <select name="variantWarranty" aria-label="Warranty">${renderWarrantyOptions()}</select>
          <input name="variantBatteryHealth" type="number" min="0" max="100" placeholder="Battery % (optional)" />
          <input name="variantFaceId" placeholder="Face ID status" />
          <input name="variantTrueTone" placeholder="True Tone status" />
          <input name="variantDisplay" placeholder="Display status" />
          <input name="variantCamera" placeholder="Camera status" />
          <input name="variantSim" placeholder="SIM / network" />
        </div>
      </div>
      <button class="admin-action hidden" id="addVariantRow" type="button">+ ADD ANOTHER VARIANT</button>
      <label class="admin-image-upload">CHOOSE PRODUCT IMAGES<input name="images" id="adminProductImages" type="file" accept="image/*" multiple required /><span id="adminImageFileNames">No images selected</span></label>
      <div class="admin-image-preview" id="adminImagePreview" aria-live="polite"></div>
      <button class="primary-btn" type="submit">ADD PRODUCT</button>
    </form>
    <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead><tbody>
      ${products.map((product) => `<tr><td><strong>${product.name}</strong><small>${product.brand} · ${product.variants?.length || 1} variant${(product.variants?.length || 1) === 1 ? "" : "s"}</small></td><td><input class="admin-inline" data-field="price" data-id="${product.id}" type="number" value="${product.price}" /></td><td><input class="admin-inline" data-field="stock" data-id="${product.id}" type="number" min="0" value="${product.stock}" /></td><td><button class="admin-action" data-action="variants" data-id="${product.id}">VARIANTS</button><button class="admin-action" data-action="save" data-id="${product.id}">SAVE</button><button class="admin-action danger" data-action="delete" data-id="${product.id}">DELETE</button><label class="upload-label">UPLOAD IMAGES<input class="admin-upload" data-id="${product.id}" type="file" accept="image/*" multiple /></label></td></tr>`).join("")}
    </tbody></table></div>
  ` : section === "orders" ? `<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Order ID</th><th>Customer</th><th>Amount</th><th>Payment</th><th>Status</th><th>Date</th></tr></thead><tbody>${orders.map((order) => `<tr><td>${order.orderNumber}</td><td>${order.customer.name}</td><td>${formatCurrency(order.total)}</td><td>${order.paymentMethod}</td><td>${order.status}</td><td>${new Date(order.createdAt).toLocaleDateString()}</td></tr>`).join("") || '<tr><td colspan="6">No orders yet.</td></tr>'}</tbody></table></div>` : section === "repairs" ? `<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Repair ID</th><th>Customer</th><th>Device</th><th>Problem</th><th>Status</th><th>Diagnosis</th><th>Cost</th><th>Action</th></tr></thead><tbody>${repairs.map((repair) => `<tr><td>${repair.repairId}</td><td>${repair.customer.name}</td><td>${repair.device}</td><td>${repair.problem}</td><td><select class="repair-status-select" data-id="${repair.repairId}">${REPAIR_STATUSES.map((status) => `<option ${repair.status === status ? "selected" : ""}>${status}</option>`).join("")}</select></td><td><input class="repair-inline" data-field="diagnosis" data-id="${repair.repairId}" value="${repair.diagnosis || ""}" placeholder="Add diagnosis" /></td><td><input class="repair-inline" data-field="repairCost" data-id="${repair.repairId}" type="number" min="0" value="${repair.repairCost || ""}" placeholder="Cost" /></td><td><button class="admin-action" data-action="repair-save" data-id="${repair.repairId}">UPDATE</button><a class="admin-action" href="mailto:${repair.customer.email}">CONTACT</a></td></tr>`).join("") || '<tr><td colspan="8">No repair requests yet.</td></tr>'}</tbody></table></div>` : `<div class="admin-metric-grid"><div><strong>${formatCurrency(orders.reduce((sum, order) => sum + order.total, 0))}</strong><span>Sales</span></div><div><strong>${orders.length}</strong><span>Orders</span></div><div><strong>${products.length}</strong><span>Products</span></div><div><strong>${repairs.length}</strong><span>Repairs</span></div></div>`;

  adminPage.innerHTML = `<div class="container admin-shell"><div class="admin-header"><div><p class="eyebrow">OPERATIONS CONSOLE</p><h1>ARCADIA ADMIN</h1></div><div class="admin-header-actions"><span class="admin-security">Auto logout after 2 minutes idle</span><button class="admin-logout" id="adminLogout" type="button">LOG OUT OF ADMIN</button></div></div><nav class="admin-nav">${["overview", "orders", "products", "catalog", "bill-board", "inventory", "customers", "repairs", "reviews", "payments"].map((item) => `<a class="${section === item ? "active" : ""}" href="#admin/${item}">${item === "bill-board" ? "Bill Board" : item[0].toUpperCase() + item.slice(1)}</a>`).join("")}</nav>${notice ? `<p class="admin-notice">${notice}</p>` : ""}<section class="admin-section">${section === "products" ? "<h2>Products</h2>" : section === "catalog" ? "<h2>Catalog Management</h2>" : section === "bill-board" ? "<h2>Bill Board</h2>" : section === "orders" ? "<h2>Orders</h2>" : section === "repairs" ? "<h2>Repairs</h2>" : "<h2>Overview</h2>"}${sectionBody}</section></div>`;

  document.getElementById("adminLogout").addEventListener("click", async () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    window.location.hash = "";
  });

  document.getElementById("catalogManagerForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const catalog = catalogStorage.getCatalog();
    catalog.push({ id: `catalog-${Date.now()}`, brand: data.get("brand"), series: data.get("series"), model: data.get("model"), storage: String(data.get("storage") || "").split(",").map((value) => value.trim()).filter(Boolean), ram: String(data.get("ram") || "").split(",").map((value) => value.trim()).filter(Boolean), colors: String(data.get("colors") || "").split(",").map((value) => value.trim()).filter(Boolean), verified: data.get("verified") === "on" });
    catalogStorage.saveCatalog(catalog);
    renderAdminPage("catalog", "Catalog model saved.");
  });
  adminPage.querySelectorAll(".catalog-delete").forEach((button) => button.addEventListener("click", () => {
    if (!window.confirm("Delete this catalog model?")) return;
    catalogStorage.saveCatalog(catalogStorage.getCatalog().filter((entry) => entry.id !== button.dataset.id));
    renderAdminPage("catalog", "Catalog model deleted.");
  }));
  adminPage.querySelectorAll(".catalog-edit").forEach((button) => button.addEventListener("click", () => {
    const catalog = catalogStorage.getCatalog();
    const entry = catalog.find((item) => item.id === button.dataset.id);
    if (!entry) return;
    const model = window.prompt("Model name", entry.model);
    if (!model) return;
    entry.model = model;
    entry.storage = String(window.prompt("Verified storage options, comma separated", entry.storage.join(", ")) || "").split(",").map((value) => value.trim()).filter(Boolean);
    entry.ram = String(window.prompt("Verified RAM options, comma separated", entry.ram.join(", ")) || "").split(",").map((value) => value.trim()).filter(Boolean);
    entry.colors = String(window.prompt("Verified colors, comma separated", entry.colors.join(", ")) || "").split(",").map((value) => value.trim()).filter(Boolean);
    catalogStorage.saveCatalog(catalog);
    renderAdminPage("catalog", "Catalog model updated.");
  }));

  const billboardForm = document.getElementById("billboardForm");
  const billboardMediaInput = document.getElementById("billboardMedia");
  billboardMediaInput?.addEventListener("change", async () => {
    const file = billboardMediaInput.files?.[0];
    if (!file) return;
    document.getElementById("billboardMediaName").textContent = file.name;
    try {
      const media = await readMediaFile(file);
      document.getElementById("billboardAdminPreview").innerHTML = media.type === "video" ? `<video src="${media.data}" controls></video>` : `<img src="${media.data}" alt="Billboard preview" />`;
    } catch (error) {
      billboardMediaInput.value = "";
      document.getElementById("billboardMediaName").textContent = error.message;
    }
  });
  billboardForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(billboardForm);
    const file = data.get("media");
    const current = billboardStorage.getBillboard();
    const media = file?.size ? await readMediaFile(file) : { type: current.mediaType, data: current.media };
    billboardStorage.saveBillboard({ label: data.get("label"), title: data.get("title"), message: data.get("message"), mediaType: media.type, media: media.data });
    renderBillboard();
    renderAdminPage("bill-board", "Bill Board published successfully.");
  });

  const productImageInput = document.getElementById("adminProductImages");
  const brandInput = document.getElementById("adminProductBrand");
  const modelInput = document.getElementById("adminProductModel");
  const catalogStorageInput = document.getElementById("catalogStorage");
  const catalogColors = document.getElementById("catalogColors");
  const appleVariantControls = document.getElementById("appleVariantControls");
  const manualVariantControls = document.getElementById("manualVariantControls");
  const variantBuilder = document.getElementById("adminVariantBuilder");

  const variantRow = (storage = "", color = "", locked = false) => `
    <div class="admin-variant-row">
      <input name="variantStorage" value="${escapeHtml(storage)}" placeholder="Storage / RAM (e.g. 128GB)" ${locked ? "readonly" : ""} required />
      <input name="variantColor" value="${escapeHtml(color)}" placeholder="Color" ${locked ? "readonly" : ""} required />
      <select name="variantCondition" aria-label="Condition"><option>New</option><option>Like New</option><option>Excellent</option><option>Good</option><option>Fair</option><option>Refurbished</option></select>
      <input name="variantOriginalPrice" type="number" min="0" placeholder="Original price" required />
      <input name="variantDiscountPercentage" type="number" min="0" max="100" step="0.01" placeholder="Discount (%)" value="0" required />
      <span class="variant-discount-amount">Discount: ₦ 0</span>
      <output class="variant-final-price">Final price: ₦ 0</output>
      <input name="variantStock" type="number" min="0" placeholder="Stock" required />
      <input name="variantSku" placeholder="SKU" required />
      <select name="variantWarranty" aria-label="Warranty">${renderWarrantyOptions()}</select>
      <input name="variantBatteryHealth" type="number" min="0" max="100" placeholder="Battery % (optional)" />
      <input name="variantFaceId" placeholder="Face ID status" /><input name="variantTrueTone" placeholder="True Tone status" /><input name="variantDisplay" placeholder="Display status" /><input name="variantCamera" placeholder="Camera status" /><input name="variantSim" placeholder="SIM / network" />
      ${locked ? "" : '<button class="admin-action danger remove-variant-row" type="button">REMOVE</button>'}
    </div>`;

  const updateCatalogOptions = () => {
    const structuredCatalog = getStructuredCatalog(brandInput.value, document.querySelector("[name='categoryKey']").value);
    const usesCatalog = Boolean(structuredCatalog);
    appleVariantControls.classList.toggle("hidden", !usesCatalog);
    manualVariantControls.classList.toggle("hidden", usesCatalog);
    catalogStorageInput.disabled = !usesCatalog;
    document.getElementById("addVariantRow").classList.toggle("hidden", usesCatalog);
    if (!usesCatalog) return;
    const model = modelInput.value;
    const storages = Object.keys(structuredCatalog.catalog[model]?.storages || {});
    catalogStorageInput.innerHTML = storages.map((storage) => `<option value="${escapeHtml(storage)}">${escapeHtml(storage)}</option>`).join("");
    const colors = structuredCatalog.getColors(model, catalogStorageInput.value);
    catalogColors.innerHTML = colors.map((color) => `<label><input type="checkbox" name="catalogColor" value="${escapeHtml(color)}" /> ${escapeHtml(color)}</label>`).join("");
    variantBuilder.innerHTML = "<p class=\"catalog-manager-note\">Select one or more colors to create individual stock variants.</p>";
  };

  const updateAppleColors = () => {
    const structuredCatalog = getStructuredCatalog(brandInput.value, document.querySelector("[name='categoryKey']").value);
    const colors = structuredCatalog?.getColors(modelInput.value, catalogStorageInput.value) || [];
    catalogColors.innerHTML = colors.map((color) => `<label><input type="checkbox" name="catalogColor" value="${escapeHtml(color)}" /> ${escapeHtml(color)}</label>`).join("");
    variantBuilder.innerHTML = "<p class=\"catalog-manager-note\">Select one or more colors to create individual stock variants.</p>";
  };

  const updateVariantPricing = (row) => {
    const originalPrice = row.querySelector("[name='variantOriginalPrice']");
    const discount = row.querySelector("[name='variantDiscountPercentage']");
    if (!originalPrice || !discount) return;
    const pricing = calculatePricing(originalPrice.value, discount.value);
    row.querySelector(".variant-discount-amount").textContent = `Discount: ${formatCurrency(pricing.discountAmount)}`;
    row.querySelector(".variant-final-price").textContent = `Final price: ${formatCurrency(pricing.finalPrice)}`;
  };

  const bindVariantPricing = () => {
    variantBuilder.querySelectorAll(".admin-variant-row").forEach((row) => {
      row.querySelectorAll("[name='variantOriginalPrice'], [name='variantDiscountPercentage']").forEach((input) => input.addEventListener("input", () => updateVariantPricing(row)));
      updateVariantPricing(row);
    });
  };

  brandInput?.addEventListener("change", (event) => {
    const categoryInput = document.querySelector("[name='categoryKey']");
    if (structuredCatalogs[event.target.value]) categoryInput.value = structuredCatalogs[event.target.value].category;
    const models = structuredCatalogs[event.target.value]?.models || ["Other model"];
    modelInput.innerHTML = models.map((model) => `<option>${model}</option>`).join("");
    updateCatalogOptions();
  });
  modelInput?.addEventListener("change", updateCatalogOptions);
  document.querySelector("[name='categoryKey']")?.addEventListener("change", updateCatalogOptions);
  catalogStorageInput?.addEventListener("change", updateAppleColors);
  catalogColors?.addEventListener("change", () => {
    const selectedColors = [...catalogColors.querySelectorAll("input:checked")].map((input) => input.value);
    variantBuilder.innerHTML = selectedColors.length
      ? selectedColors.map((color) => variantRow(catalogStorageInput.value, color, true)).join("")
      : "<p class=\"catalog-manager-note\">Select one or more colors to create individual stock variants.</p>";
    bindVariantPricing();
  });
  updateCatalogOptions();
  bindVariantPricing();
  document.getElementById("applyBulkDiscount")?.addEventListener("click", () => {
    const value = document.getElementById("bulkDiscountPercentage").value;
    variantBuilder.querySelectorAll("[name='variantDiscountPercentage']").forEach((input) => {
      input.value = value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  });
  document.getElementById("addVariantRow")?.addEventListener("click", () => {
    variantBuilder.insertAdjacentHTML("beforeend", variantRow());
    bindVariantPricing();
    adminPage.querySelectorAll(".remove-variant-row").forEach((button) => button.addEventListener("click", () => button.parentElement.remove()));
  });
  document.getElementById("generateVariants")?.addEventListener("click", () => {
    const storageValues = document.querySelector("[name='bulkStorage']").value.split(",").map((value) => value.trim()).filter(Boolean);
    const colorValues = document.querySelector("[name='bulkColors']").value.split(",").map((value) => value.trim()).filter(Boolean);
    if (!storageValues.length || !colorValues.length) return;
    const builder = document.getElementById("adminVariantBuilder");
    builder.innerHTML = storageValues.flatMap((storage) => colorValues.map((color) => variantRow(storage, color))).join("");
    bindVariantPricing();
  });
  productImageInput?.addEventListener("change", async () => {
    const preview = document.getElementById("adminImagePreview");
    const names = document.getElementById("adminImageFileNames");
    try {
      const images = await readImageFiles(productImageInput.files);
      names.textContent = `${images.length} image${images.length === 1 ? "" : "s"} selected`;
      preview.innerHTML = images.map((image) => `<img src="${image}" alt="Selected product preview" />`).join("");
    } catch (error) {
      productImageInput.value = "";
      names.textContent = error.message;
      preview.innerHTML = "";
    }
  });
  document.getElementById("adminProductForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const submitButton = form.querySelector("button[type='submit']");
    submitButton.disabled = true;
    try {
      const images = await readImageFiles(data.getAll("images"));
      if (!images.length) throw new Error("Choose at least one product image.");
      const variantRows = data.getAll("variantStorage").map((storage, index) => ({
        id: `${Date.now()}-${index}-${String(data.getAll("variantSku")[index]).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        storage: storage || "N/A",
        color: data.getAll("variantColor")[index] || "N/A",
        condition: data.getAll("variantCondition")[index],
        price: Number(data.getAll("variantPrice")[index]) || 0,
        ...calculatePricing(data.getAll("variantOriginalPrice")[index], data.getAll("variantDiscountPercentage")[index]),
        price: calculatePricing(data.getAll("variantOriginalPrice")[index], data.getAll("variantDiscountPercentage")[index]).finalPrice,
        oldPrice: Number(data.getAll("variantOriginalPrice")[index]) || 0,
        stock: Number(data.getAll("variantStock")[index]) || 0,
        sku: data.getAll("variantSku")[index],
        warranty: data.getAll("variantWarranty")[index] || "No Warranty",
        warrantyMonths: WARRANTY_OPTIONS.indexOf(data.getAll("variantWarranty")[index] || "No Warranty"),
        batteryHealth: data.getAll("variantBatteryHealth")[index] || "",
        faceId: data.getAll("variantFaceId")[index] || "",
        trueTone: data.getAll("variantTrueTone")[index] || "",
        display: data.getAll("variantDisplay")[index] || "",
        camera: data.getAll("variantCamera")[index] || "",
        sim: data.getAll("variantSim")[index] || "",
        images
      }));
      const firstVariant = variantRows[0];
      const productDetails = { name: data.get("model") || data.get("name"), brand: data.get("brand"), categoryKey: data.get("categoryKey") };
      const validationMessage = validateVariants(variantRows, productDetails);
      if (validationMessage) throw new Error(validationMessage);
      await adminProductAction("create", null, { ...productDetails, category: data.get("categoryKey"), price: firstVariant.price, originalPrice: firstVariant.originalPrice, discountPercentage: firstVariant.discountPercentage, discountAmount: firstVariant.discountAmount, finalPrice: firstVariant.finalPrice, discount: firstVariant.discountPercentage, stock: variantRows.reduce((sum, variant) => sum + variant.stock, 0), storage: firstVariant.storage, color: firstVariant.color, condition: firstVariant.condition, sku: firstVariant.sku, warranty: firstVariant.warranty, warrantyMonths: firstVariant.warrantyMonths, images, variants: variantRows });
      renderAdminPage("products", "Product added successfully.");
      adminPage.querySelector(".admin-notice")?.classList.add("admin-notice-success");
    } catch (error) {
      submitButton.disabled = false;
      const existingNotice = adminPage.querySelector(".admin-notice");
      if (existingNotice) existingNotice.textContent = error.message;
      else form.insertAdjacentHTML("beforebegin", `<p class="admin-notice admin-notice-error">${escapeHtml(error.message)}</p>`);
    }
  });
  adminPage.querySelectorAll(".admin-action[data-action='delete']").forEach((button) => button.addEventListener("click", async () => { await adminProductAction("delete", Number(button.dataset.id)); renderAdminPage("products", "Product deleted."); }));
  adminPage.querySelectorAll(".admin-action[data-action='save']").forEach((button) => button.addEventListener("click", async () => { const id = Number(button.dataset.id); const price = Number(adminPage.querySelector(`.admin-inline[data-id='${id}'][data-field='price']`).value); const stock = Number(adminPage.querySelector(`.admin-inline[data-id='${id}'][data-field='stock']`).value); const product = products.find((entry) => entry.id === id); const firstVariant = product?.variants?.[0]; if (firstVariant) { firstVariant.price = price; firstVariant.stock = stock; } await adminProductAction("update", id, { price, stock, variants: product?.variants }); renderAdminPage("products", "Price and stock updated."); }));
  adminPage.querySelectorAll(".admin-action[data-action='variants']").forEach((button) => button.addEventListener("click", () => renderVariantManager(Number(button.dataset.id))));
  adminPage.querySelectorAll(".admin-upload").forEach((input) => input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const productId = Number(input.dataset.id);
      const product = products.find((item) => item.id === productId);
      if (!product) return;
      product.images = [reader.result];
      productStorage.saveProducts(products);
      renderAdminPage("products", "Image uploaded to the local catalog.");
    });
    reader.readAsDataURL(file);
  }));
  adminPage.querySelectorAll(".repair-status-select").forEach((select) => select.addEventListener("change", () => { const repairs = loadRepairsFromStorage().map((repair) => repair.repairId === select.dataset.id ? { ...repair, status: select.value } : repair); localStorage.setItem(REPAIRS_STORAGE_KEY, JSON.stringify(repairs)); }));
  adminPage.querySelectorAll(".admin-action[data-action='repair-save']").forEach((button) => button.addEventListener("click", () => { const repairId = button.dataset.id; const diagnosis = adminPage.querySelector(`.repair-inline[data-id='${repairId}'][data-field='diagnosis']`).value; const repairCost = Number(adminPage.querySelector(`.repair-inline[data-id='${repairId}'][data-field='repairCost']`).value) || null; const repairs = loadRepairsFromStorage().map((repair) => repair.repairId === repairId ? { ...repair, diagnosis, repairCost, status: adminPage.querySelector(`.repair-status-select[data-id='${repairId}']`).value } : repair); localStorage.setItem(REPAIRS_STORAGE_KEY, JSON.stringify(repairs)); renderAdminPage("repairs", "Repair details updated." ); }));
}

function formatCurrency(amount) {
  const numericAmount = Number(amount);
  return `₦ ${(Number.isFinite(numericAmount) ? numericAmount : 0).toLocaleString()}`;
}

function normalizeSearchText(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function getSearchableProductText(product) {
  return normalizeSearchText([
    product.name, product.brand, product.model, product.category, product.categoryKey,
    product.description, product.condition, product.storage, product.color, product.warranty,
    product.sku, ...(product.specifications || []),
    ...(product.variants || []).flatMap((variant) => [variant.storage, variant.color, variant.condition, variant.sku, variant.warranty, variant.notes])
  ].join(" "));
}

function getSearchableVariants(product, query) {
  const terms = normalizeSearchText(query).split(" ").filter(Boolean);
  return (product.variants || []).filter((variant) => {
    const variantText = normalizeSearchText([
      product.name, product.brand, product.model, product.category, product.categoryKey,
      product.description, product.sku, variant.storage, variant.color, variant.condition,
      variant.sku, variant.warranty, variant.notes
    ].join(" "));
    return terms.every((term) => variantText.includes(term));
  });
}

function getSearchMatches(query) {
  const terms = normalizeSearchText(query).split(" ").filter(Boolean);
  if (!terms.length) return [];
  return products
    .map((product) => ({ product, variants: getSearchableVariants(product, query) }))
    .filter(({ product, variants }) => terms.every((term) => getSearchableProductText(product).includes(term)) && variants.length);
}

function getFilteredProducts() {
  const terms = normalizeSearchText(searchTerm).split(" ").filter(Boolean);
  return products.filter((product) => {
    const matchesCategory =
      selectedCategory === "all" || product.categoryKey === selectedCategory;

    const matchesSearch = terms.every((term) => getSearchableProductText(product).includes(term));
    return matchesCategory && matchesSearch;
  });
}

function renderSearchResults() {
  if (!searchResults) return;
  const query = searchInput.value.trim();
  if (!query) {
    searchResults.hidden = true;
    searchResults.innerHTML = "";
    return;
  }
  const matches = getSearchMatches(query).slice(0, 8);
  searchResults.hidden = false;
  searchResults.innerHTML = matches.length
    ? matches.map(({ product, variants }) => `
      <button class="search-result" type="button" role="option" data-product-id="${product.id}">
        <img src="${escapeHtml(product.images?.[0] || "arcadia-logo.png.jpeg")}" alt="" />
        <span class="search-result-copy"><strong>${escapeHtml(product.name)}</strong><small>${variants.slice(0, 3).map((variant) => `${escapeHtml(variant.storage)} / ${escapeHtml(variant.color)} · ${Number(variant.stock) > 0 ? `${variant.stock} in stock` : "Out of stock"}`).join("<br />")}</small></span>
        <b>${formatCurrency(variants[0].price)}</b>
      </button>
    `).join("")
    : `<p class="search-no-results">No products found</p>`;

  searchResults.querySelectorAll(".search-result").forEach((result) => result.addEventListener("click", () => {
    searchResults.hidden = true;
    openProductDetail(Number(result.dataset.productId));
  }));
}

function updateSeoSchema() {
  if (!localBusinessSchema || !productSchema) return;

  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Arcadia Mobile",
    image: "arcadia-logo.png.jpeg",
    description: "Phone store and repair shop in Jos, Plateau State, offering iPhone, Samsung, accessories, and device repair services.",
    areaServed: [
      { "@type": "City", name: "Jos" },
      { "@type": "State", name: "Plateau State" },
      { "@type": "Country", name: "Nigeria" }
    ],
    address: {
      "@type": "PostalAddress",
      addressLocality: "Jos",
      addressRegion: "Plateau State",
      addressCountry: "NG"
    },
    priceRange: "₦₦",
    sameAs: ["https://arcadiamobile.com.ng"],
    url: "https://arcadiamobile.com.ng"
  };

  const productEntries = products.slice(0, 12).map((product) => {
    const price = Number(product.price || 0);
    const stock = Number(product.stock || 0);

    return {
      "@type": "Product",
      name: product.name,
      brand: {
        "@type": "Brand",
        name: product.brand || "Arcadia Mobile"
      },
      category: product.category || "Electronics",
      image: Array.isArray(product.images) && product.images.length ? product.images : ["arcadia-logo.png.jpeg"],
      description: product.description || `Buy ${product.name} in Jos, Plateau State from Arcadia Mobile.`,
      sku: product.sku || `${product.id}`,
      offers: {
        "@type": "Offer",
        priceCurrency: "NGN",
        price: Number.isFinite(price) ? price : 0,
        availability: stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        url: "https://arcadiamobile.com.ng"
      },
      aggregateRating: product.rating
        ? {
            "@type": "AggregateRating",
            ratingValue: Number(product.rating),
            reviewCount: Number(product.reviews || 0)
          }
        : undefined
    };
  });

  localBusinessSchema.textContent = JSON.stringify(localBusiness);
  productSchema.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [{
      "@type": "WebSite",
      name: "Arcadia Mobile",
      url: "https://arcadiamobile.com.ng",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://arcadiamobile.com.ng/?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }, localBusiness, ...productEntries]
  });
}

function renderDeals() {
  const deals = products
    .filter((product) => product.discountPercentage > 0)
    .slice(0, 3)
    .map(
      (product) => `
        <article class="deal-card">
          <div class="deal-image">
            ${createResponsiveImageMarkup(product.images[0], product.name, { width: 560, height: 420, loading: "lazy" })}
          </div>
          <div class="deal-body">
            <span class="deal-brand">${product.brand}</span>
            <h3>${product.name}</h3>
            <div class="deal-pricing">
              <span class="old-price">${formatCurrency(product.originalPrice)}</span>
              <span class="new-price">${formatCurrency(product.finalPrice)}</span>
            </div>
            <span class="save-badge">SAVE ${formatCurrency(product.discountAmount)}</span>
          </div>
        </article>
      `
    )
    .join("");

  dealGrid.innerHTML = deals;
}

function renderProducts() {
  const items = getFilteredProducts();

  if (items.length === 0) {
    productGrid.innerHTML = `
      <div class="product-empty">
        <h3>No products match your search.</h3>
        <p>Try iPhone 13, Samsung, charger, AirPods, power bank, or screen protector.</p>
      </div>
    `;
    return;
  }

  productGrid.innerHTML = items
    .map(
      (product) => `
        <article class="product-card" data-product-id="${product.id}" tabindex="0" role="button" aria-label="View ${product.name}">
          <div class="product-visual">
            <button class="wishlist-toggle ${wishlist.includes(product.id) ? "active" : ""}" type="button" aria-label="${wishlist.includes(product.id) ? "Remove" : "Add"} ${product.name} ${wishlist.includes(product.id) ? "from" : "to"} wishlist" data-id="${product.id}">
              ${wishlist.includes(product.id) ? "♥" : "♡"}
            </button>
            ${createResponsiveImageMarkup(product.images[0], product.name, { width: 600, height: 420, loading: "lazy" })}
            <span class="product-badge">${product.discount}% OFF</span>
          </div>

          <div class="product-card-body">
            <span class="product-brand">${product.brand}</span>
            <h3>${product.name}</h3>
            <div class="rating-line">
              <span class="stars">★★★★★</span>
              <span class="rating-score">${product.rating}</span>
              <span class="reviews-count">(${product.reviews})</span>
            </div>
            <div class="product-price-row">
              <div>
                ${renderPriceMarkup(product)}
              </div>
              <span class="stock-status">${product.stock > 0 ? `Stock: ${product.stock}` : "OUT OF STOCK"}</span>
            </div>
            ${product.warranty && product.warranty !== "No Warranty" ? `<span class="product-warranty">${escapeHtml(product.warranty)} warranty</span>` : ""}
            <div class="product-actions">
              <button class="add-btn" type="button" data-id="${product.id}" ${product.stock <= 0 ? "disabled" : ""}>${product.stock > 0 ? "ADD TO CART" : "OUT OF STOCK"}</button>
            </div>
          </div>
        </article>
      `
    )
    .join("");

  updateSeoSchema();

  document.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      openProductDetail(Number(card.dataset.productId));
    });

    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openProductDetail(Number(card.dataset.productId));
      }
    });
  });

  document.querySelectorAll(".add-btn").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      addToCart(Number(button.dataset.id));
    });
  });

  document.querySelectorAll(".wishlist-toggle").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleWishlist(Number(button.dataset.id));
    });
  });
}

function saveWishlistToStorage() {
  localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
}

function loadWishlistFromStorage() {
  try {
    const savedWishlist = JSON.parse(localStorage.getItem(WISHLIST_STORAGE_KEY) || "[]");
    wishlist = Array.isArray(savedWishlist)
      ? savedWishlist.map(Number).filter((id) => products.some((product) => product.id === id))
      : [];
  } catch (error) {
    wishlist = [];
  }
}

function toggleWishlist(productId) {
  wishlist = wishlist.includes(productId)
    ? wishlist.filter((id) => id !== productId)
    : [...wishlist, productId];

  saveWishlistToStorage();
  updateWishlistCount();
  renderProducts();

  if (window.location.hash === "#wishlist") {
    renderWishlistPage();
  }
}

function updateWishlistCount() {
  wishlistCount.textContent = String(wishlist.length);
}

function saveCustomerToStorage() {
  localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(customer));
}

function loadCustomerFromStorage() {
  try {
    const savedCustomer = JSON.parse(localStorage.getItem(CUSTOMER_STORAGE_KEY) || "null");
    customer = savedCustomer && savedCustomer.email ? savedCustomer : null;
    if (customer) customer.isAdmin = Boolean(customer.isAdmin === true);
  } catch (error) {
    customer = null;
  }
  syncAdminButtonState();
}

function renderAccountPage() {
  syncAdminButtonState();
  if (customer) {
    const orderCount = loadOrdersFromStorage().length;
    accountPage.innerHTML = `
      <div class="container account-shell">
        <div class="account-heading">
          <p class="eyebrow">CUSTOMER SPACE</p>
          <h1>MY ACCOUNT</h1>
          <p>Welcome back, ${escapeHtml(customer.fullName)}.</p>
        </div>
        <div class="account-dashboard">
          <a class="account-card" href="#account"><strong>Orders</strong><span>${orderCount} order${orderCount === 1 ? "" : "s"}</span></a>
          <a class="account-card" href="#wishlist"><strong>Wishlist</strong><span>${wishlist.length} saved item${wishlist.length === 1 ? "" : "s"}</span></a>
          <a class="account-card" href="#account"><strong>Saved Addresses</strong><span>Manage delivery details</span></a>
          <a class="account-card" href="#account"><strong>Repair Requests</strong><span>Track device service</span></a>
          <a class="account-card" href="#account"><strong>Profile</strong><span>${escapeHtml(customer.phone)}</span></a>
          <a class="account-card" href="#account"><strong>Settings</strong><span>Account preferences</span></a>
        </div>
        <button type="button" class="account-logout" id="accountLogout">LOGOUT</button>
      </div>
    `;
    document.getElementById("accountLogout").addEventListener("click", async () => {
      customer = null;
      localStorage.removeItem(CUSTOMER_STORAGE_KEY);
      syncAdminButtonState();
      renderAccountPage();
    });
    return;
  }

  accountPage.innerHTML = `
    <div class="container account-shell">
      <div class="account-heading">
        <p class="eyebrow">ARCADIA CUSTOMER ACCOUNT</p>
        <h1>WELCOME TO ARCADIA</h1>
        <p>Sign in to manage your orders, wishlist, addresses, and repairs.</p>
      </div>
      <div class="auth-grid">
        <form class="auth-form" id="signupForm">
          <h2>Sign Up</h2>
          <label>Full Name<input name="fullName" type="text" autocomplete="name" required /></label>
          <label>Email<input name="email" type="email" autocomplete="email" required /></label>
          <label>Phone<input name="phone" type="tel" autocomplete="tel" required /></label>
          <label>Password<input name="password" type="password" autocomplete="new-password" minlength="6" required /></label>
          <button class="primary-btn" type="submit">CREATE ACCOUNT</button>
          <p class="form-message" id="signupMessage" role="status"></p>
        </form>
        <form class="auth-form" id="loginForm">
          <h2>Login</h2>
          <label>Email<input name="email" type="email" autocomplete="email" required /></label>
          <label>Password<input name="password" type="password" autocomplete="current-password" required /></label>
          <button class="primary-btn" type="submit">LOGIN</button>
          <button class="forgot-password" type="button" id="forgotPassword">Forgot password?</button>
          <p class="form-message" id="loginMessage" role="status"></p>
        </form>
      </div>
    </div>
  `;

  enhancePasswordInputs(accountPage);

  document.getElementById("signupForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const message = document.getElementById("signupMessage");
    const validationError = validateCustomerFields({ name: formData.get("fullName"), phone: formData.get("phone"), email: formData.get("email") });
    if (validationError) { message.textContent = validationError; return; }
    customer = {
      fullName: String(formData.get("fullName")).trim(),
      email: String(formData.get("email")).trim().toLowerCase(),
      phone: String(formData.get("phone")).trim(),
      isAdmin: false
    };
    saveCustomerToStorage();
    syncAdminButtonState();
    renderAccountPage();
  });

  document.getElementById("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email")).trim();
    const message = document.getElementById("loginMessage");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || String(formData.get("password")).length < 6) { message.textContent = "Enter a valid email and password."; return; }
    customer = { fullName: email.split("@")[0], email, phone: "Phone not added", isAdmin: false };
    saveCustomerToStorage();
    syncAdminButtonState();
    renderAccountPage();
  });

  document.getElementById("forgotPassword").addEventListener("click", () => {
    document.getElementById("loginMessage").textContent = "Password reset instructions will be sent to your email.";
  });
}

function getCheckoutPaymentMarkup() {
  const bankMethods = localPaymentMethods.map((method) => `
    <label class="payment-option">
      <input type="radio" name="paymentMethod" value="${method.id}" required />
      <span><strong>${method.name}</strong><small>Account: ${method.accountNumber} | Name: ${method.accountName}</small></span>
    </label>
  `).join("");

  return `
    <label class="payment-option payment-option-primary">
      <input type="radio" name="paymentMethod" value="paystack" required />
      <span><strong>Pay with Paystack</strong><small>Cards, bank transfer, USSD, and supported Nigerian payment methods.</small></span>
    </label>
    ${bankMethods}
    <label class="payment-confirmation-option">
      <input type="checkbox" name="paymentConfirmed" value="yes" />
      <span>I have completed the payment transfer.</span>
    </label>
  `;
}

function normalizeLocation(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function calculateDeliveryFee(state, city) {
  const normalizedState = normalizeLocation(state);
  const normalizedCity = normalizeLocation(city);
  if (normalizedState === "plateau" || normalizedState === "plateau state") {
    if (normalizedCity.includes("jos north")) return DELIVERY_RATES["jos north"];
    if (normalizedCity.includes("rayfield")) return DELIVERY_RATES.rayfield;
    if (normalizedCity === "jos" || normalizedCity.includes("jos ")) return DELIVERY_RATES.jos;
    return DELIVERY_RATES["other plateau"];
  }
  return DELIVERY_RATES[normalizedState] || DELIVERY_RATES[normalizedCity] || 0;
}

function updateCheckoutDeliveryFee() {
  const form = document.getElementById("checkoutForm");
  if (!form) return;
  const delivery = form.elements.fulfillment.value === "pickup"
    ? 0
    : calculateDeliveryFee(form.elements.state.value, form.elements.city.value);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  document.getElementById("checkoutDelivery").textContent = formatCurrency(delivery);
  document.getElementById("checkoutTotal").textContent = formatCurrency(subtotal + delivery);
}

function createLocalOrder(paymentMethod, reference, formData, total) {
  return {
    orderNumber: `ARC-${Date.now()}`,
    status: paymentMethod === "paystack" ? "Pending" : "Payment received",
    paymentStatus: paymentMethod === "paystack" ? "pending" : "paid",
    createdAt: new Date().toISOString(),
    paymentMethod,
    paymentReference: reference || "local-checkout",
    total,
    customer: {
      name: formData.get("name"),
      phone: formData.get("phone"),
      email: formData.get("email")
    },
    delivery: {
      method: formData.get("fulfillment"),
      state: formData.get("state"),
      city: formData.get("city"),
      address: formData.get("address")
    },
    items: cart.map((item) => ({ ...item }))
  };
}

function loadOrdersFromStorage() {
  try {
    const savedOrders = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || "[]");
    return Array.isArray(savedOrders) ? savedOrders : [];
  } catch (error) {
    return [];
  }
}

function getNextOrderNumber(orders) {
  const year = new Date().getFullYear();
  const prefix = `ARC-${year}-`;
  const highestNumber = orders.reduce((highest, order) => {
    if (!String(order.orderNumber || "").startsWith(prefix)) return highest;
    const sequence = Number(String(order.orderNumber).replace(prefix, ""));
    return Number.isFinite(sequence) ? Math.max(highest, sequence) : highest;
  }, 0);
  return `${prefix}${String(highestNumber + 1).padStart(5, "0")}`;
}

function saveOrder(order) {
  const orders = loadOrdersFromStorage();
  orders.push(order);
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
}

function decrementInventoryAfterOrder(items) {
  items.forEach((item) => {
    const product = products.find((entry) => entry.id === item.id);
    if (product) product.stock = Math.max(0, product.stock - item.quantity);
    const variant = product?.variants?.find((entry) => entry.id === item.variantId);
    if (variant) variant.stock = Math.max(0, variant.stock - item.quantity);
  });
  productStorage.saveProducts(products);
  renderDeals();
  renderProducts();
}

function renderOrderConfirmation(order) {
  const receiptText = [
    "ARCADIA MOBILE RECEIPT",
    `Order: ${order.orderNumber}`,
    `Total: ${formatCurrency(order.total)}`,
    `Payment: ${order.paymentMethod}`,
    `Status: ${order.status}`,
    `Customer: ${order.customer.name}`
  ].join("\n");
  const emailSubject = encodeURIComponent(`Arcadia Mobile receipt ${order.orderNumber}`);
  const emailBody = encodeURIComponent(receiptText);
  const whatsappNumber = "2348020376702";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(receiptText)}`;

  checkoutPage.innerHTML = `
    <div class="container confirmation-shell">
      <div class="confirmation-mark" aria-label="Payment successful">✓</div>
      <p class="eyebrow">PAYMENT SUCCESSFUL</p>
      <h1>RECEIPT READY</h1>
      <div class="confirmation-details">
        <div><span>Order</span><strong>${order.orderNumber}</strong></div>
        <div><span>Total</span><strong>${formatCurrency(order.total)}</strong></div>
        <div><span>Status</span><strong class="status-badge">${order.status}</strong></div>
        <div><span>Status</span><strong class="status-badge">${escapeHtml(order.status)}</strong></div>
      </div>
      <p class="confirmation-note">Your payment has been recorded. Send this receipt for confirmation before continuing to shop.</p>
      <div class="receipt-actions" aria-label="Send receipt">
        <a class="secondary-btn" href="mailto:${encodeURIComponent(order.customer.email)}?subject=${emailSubject}&body=${emailBody}">EMAIL RECEIPT</a>
        <a class="secondary-btn" href="${whatsappUrl}" target="_blank" rel="noopener">SEND ON WHATSAPP</a>
      </div>
      <div class="confirmation-actions">
        <a class="primary-btn" href="#account">VIEW MY ACCOUNT</a>
        <a class="secondary-btn" href="#products">CONTINUE SHOPPING</a>
      </div>
    </div>
  `;
}

function loadRepairsFromStorage() {
  try {
    const savedRepairs = JSON.parse(localStorage.getItem(REPAIRS_STORAGE_KEY) || "[]");
    return Array.isArray(savedRepairs) ? savedRepairs : [];
  } catch (error) {
    return [];
  }
}

function getNextRepairId(repairs) {
  const year = new Date().getFullYear();
  const prefix = `REP-${year}-`;
  const highestNumber = repairs.reduce((highest, repair) => {
    if (!String(repair.repairId || "").startsWith(prefix)) return highest;
    const sequence = Number(String(repair.repairId).replace(prefix, ""));
    return Number.isFinite(sequence) ? Math.max(highest, sequence) : highest;
  }, 0);
  return `${prefix}${String(highestNumber + 1).padStart(5, "0")}`;
}

function renderRepairConfirmation(repair) {
  repairPage.innerHTML = `
    <div class="container repair-confirmation-shell">
      <div class="confirmation-mark">✓</div>
      <p class="eyebrow">ARCADIA REPAIR DESK</p>
      <h1>REQUEST RECEIVED</h1>
      <div class="repair-id-display"><span>REPAIR ID</span><strong>${escapeHtml(repair.repairId)}</strong></div>
      <p class="confirmation-note">Our repair team will review your request and contact you to confirm the appointment.</p>
      <div class="confirmation-actions">
        <a class="primary-btn" href="#repair-tracking">TRACK THIS REPAIR</a>
        <a class="secondary-btn" href="#account">VIEW MY ACCOUNT</a>
      </div>
    </div>
  `;
}

function getRepairProgress(status) {
  const normalizedStatus = status === "Pending" ? "Requested" : status;
  const progressIndex = {
    Requested: -1,
    Received: 0,
    Diagnosing: 1,
    "Awaiting Approval": 2,
    Repairing: 2,
    Testing: 3,
    Ready: 4,
    Completed: 5,
    Cancelled: -1
  }[normalizedStatus] ?? 0;

  return {
    status: normalizedStatus,
    progressIndex,
    cancelled: normalizedStatus === "Cancelled"
  };
}

function renderRepairTracking(repair = null, errorMessage = "") {
  const progress = repair ? getRepairProgress(repair.status) : null;
  const milestones = [
    "Device received",
    "Diagnosis",
    "Repair in progress",
    "Quality testing",
    "Ready for pickup"
  ];

  repairPage.innerHTML = `
    <div class="container repair-tracking-shell">
      <button class="back-link" type="button" id="backFromTracking">← Back to shop</button>
      <div class="repair-booking-heading">
        <p class="eyebrow">ARCADIA REPAIR DESK</p>
        <h1>REPAIR STATUS</h1>
        <p>Enter your repair number to see the latest service progress.</p>
      </div>
      <form class="tracking-form" id="trackingForm">
        <label>Repair number<input name="repairId" type="text" placeholder="REP-2026-00001" required /></label>
        <button class="primary-btn" type="submit">CHECK STATUS</button>
      </form>
      ${errorMessage ? `<p class="tracking-error" role="alert">${errorMessage}</p>` : ""}
      ${repair ? `
        <div class="tracking-result">
          <div class="tracking-result-header"><span>REPAIR ID</span><strong>${escapeHtml(repair.repairId)}</strong><em>${escapeHtml(progress.status)}</em></div>
          ${progress.cancelled ? '<p class="tracking-cancelled">This repair request has been cancelled. Please contact Arcadia Mobile for assistance.</p>' : `<ol class="repair-timeline">${milestones.map((label, step) => `<li class="${progress.progressIndex > step ? "complete" : progress.progressIndex === step ? "current" : "upcoming"}"><span class="timeline-marker">${progress.progressIndex > step ? "✓" : progress.progressIndex === step ? "●" : "○"}</span><span>${label}</span></li>`).join("")}</ol>`}
        </div>
      ` : ""}
    </div>
  `;

  document.getElementById("backFromTracking").addEventListener("click", () => {
    window.location.hash = "";
  });

  document.getElementById("trackingForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const repairId = new FormData(event.currentTarget).get("repairId").trim().toUpperCase();
    const matchingRepair = loadRepairsFromStorage().find((item) => item.repairId.toUpperCase() === repairId);
    renderRepairTracking(matchingRepair, matchingRepair ? "" : "We could not find that repair number. Check it and try again.");
  });
}

function renderRepairBooking() {
  repairPage.innerHTML = `
    <div class="container repair-booking-shell">
      <button class="back-link" type="button" id="backFromRepair">← Back to shop</button>
      <div class="repair-booking-heading">
        <p class="eyebrow">PROFESSIONAL DEVICE CARE</p>
        <h1>BOOK A REPAIR</h1>
        <p>Tell us what happened and our specialists will take it from there.</p>
      </div>
      <div class="repair-steps" aria-label="Repair booking steps">
        <span class="active">01 Select device</span><span>02 Select problem</span><span>03 Your details</span><span>04 Confirmation</span>
      </div>
      <form class="repair-form" id="repairForm">
        <section class="repair-step-section">
          <h2>Step 1: Select device</h2>
          <div class="choice-grid">${REPAIR_DEVICES.map((device) => `<label class="choice-card"><input type="radio" name="device" value="${device}" required /><span>${device}</span></label>`).join("")}</div>
        </section>
        <section class="repair-step-section">
          <h2>Step 2: Select problem</h2>
          <div class="choice-grid">${REPAIR_PROBLEMS.map((problem) => `<label class="choice-card"><input type="radio" name="problem" value="${problem}" required /><span>${problem}</span></label>`).join("")}</div>
        </section>
        <section class="repair-step-section">
          <h2>Step 3: Customer information</h2>
          <div class="repair-fields">
            <label>Name<input name="name" type="text" value="${escapeHtml(customer?.fullName || "")}" autocomplete="name" required /></label>
            <label>Phone<input name="phone" type="tel" value="${escapeHtml(customer?.phone && customer.phone !== "Phone not added" ? customer.phone : "")}" autocomplete="tel" required /></label>
            <label>Email<input name="email" type="email" value="${escapeHtml(customer?.email || "")}" autocomplete="email" required /></label>
            <label>Device<input name="deviceDetails" type="text" placeholder="e.g. iPhone 13" required /></label>
            <label>Problem<input name="problemDetails" type="text" placeholder="e.g. cracked display" required /></label>
            <label>Preferred date<input name="preferredDate" type="date" required /></label>
            <label class="full-field">Additional information<textarea name="additionalInformation" rows="4" placeholder="Anything else our repair team should know?"></textarea></label>
          </div>
        </section>
        <button class="primary-btn place-order-btn" type="submit">SUBMIT REPAIR REQUEST</button>
      </form>
    </div>
  `;

  document.getElementById("backFromRepair").addEventListener("click", () => {
    window.location.hash = "";
  });

  document.getElementById("repairForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const repairs = loadRepairsFromStorage();
    const repair = {
      repairId: getNextRepairId(repairs),
      createdAt: new Date().toISOString(),
      status: "Requested",
      statusOptions: REPAIR_STATUSES,
      device: formData.get("device"),
      problem: formData.get("problem"),
      customer: { name: formData.get("name"), phone: formData.get("phone"), email: formData.get("email") },
      deviceDetails: formData.get("deviceDetails"),
      problemDetails: formData.get("problemDetails"),
      additionalInformation: formData.get("additionalInformation"),
      preferredDate: formData.get("preferredDate")
    };
    repairs.push(repair);
    localStorage.setItem(REPAIRS_STORAGE_KEY, JSON.stringify(repairs));
    renderRepairConfirmation(repair);
  });
}

function renderCheckoutPage() {
  if (cart.length === 0) {
    checkoutPage.innerHTML = `
      <div class="container checkout-shell checkout-empty">
        <button class="back-link" type="button" id="backFromCheckout">← Back to shop</button>
        <h1>YOUR CART IS EMPTY</h1>
        <p>Add a product before continuing to checkout.</p>
        <a class="primary-btn" href="#products">BROWSE PRODUCTS</a>
      </div>
    `;
    document.getElementById("backFromCheckout").addEventListener("click", () => {
      window.location.hash = "";
    });
    return;
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const delivery = 0;
  const total = subtotal + delivery;
  const paymentMarkup = getCheckoutPaymentMarkup();

  checkoutPage.innerHTML = `
    <div class="container checkout-shell">
      <button class="back-link" type="button" id="backFromCheckout">← Back to shop</button>
      <div class="checkout-heading">
        <p class="eyebrow">SECURE ORDER REVIEW</p>
        <h1>CHECKOUT</h1>
      </div>
      <form class="checkout-layout" id="checkoutForm">
        <div class="checkout-forms">
          <section class="checkout-section">
            <h2>Customer information</h2>
            <div class="checkout-fields">
              <label>Name<input name="name" type="text" value="${escapeHtml(customer?.fullName || "")}" autocomplete="name" required /></label>
              <label>Phone<input name="phone" type="tel" value="${escapeHtml(customer?.phone && customer.phone !== "Phone not added" ? customer.phone : "")}" autocomplete="tel" required /></label>
              <label>Email<input name="email" type="email" value="${escapeHtml(customer?.email || "")}" autocomplete="email" required /></label>
            </div>
          </section>
          <section class="checkout-section">
            <h2>How would you like to receive your order?</h2>
            <div class="fulfillment-options">
              <label class="fulfillment-option"><input type="radio" name="fulfillment" value="delivery" checked required /><span><strong>Delivery</strong><small>We'll deliver to your address. Delivery fees depend on location.</small></span></label>
              <label class="fulfillment-option"><input type="radio" name="fulfillment" value="pickup" required /><span><strong>Store pickup</strong><small>Pick up your order from Arcadia Mobile with no delivery fee.</small></span></label>
            </div>
          </section>
          <section class="checkout-section" id="deliveryInformationSection">
            <h2>Delivery information</h2>
            <div class="checkout-fields">
              <label>State<input name="state" type="text" list="deliveryStates" autocomplete="address-level1" required /></label>
              <label>City<input name="city" type="text" list="deliveryCities" autocomplete="address-level2" required /></label>
              <label class="full-field">Address<textarea name="address" rows="4" autocomplete="street-address" required></textarea></label>
            </div>
            <datalist id="deliveryStates"><option value="Plateau"></option><option value="Lagos"></option><option value="Abuja"></option><option value="Kaduna"></option><option value="Kano"></option><option value="Rivers"></option></datalist>
            <datalist id="deliveryCities"><option value="Jos"></option><option value="Jos North"></option><option value="Rayfield"></option><option value="Lagos"></option><option value="Abuja"></option><option value="Kaduna"></option><option value="Kano"></option><option value="Port Harcourt"></option></datalist>
            <p class="delivery-note" id="deliveryNote">Delivery fee updates automatically for Jos, Jos North, Rayfield, other Plateau locations, and supported cities.</p>
          </section>
          <section class="checkout-section">
            <h2>Payment</h2>
            <div class="payment-options">${paymentMarkup}</div>
            <p class="payment-note">After transferring payment, confirm it below to create your local order receipt.</p>
          </section>
          <button class="primary-btn place-order-btn" type="submit">PLACE ORDER</button>
          <p class="form-message" id="checkoutMessage" role="status"></p>
        </div>
        <aside class="order-summary">
          <h2>Order summary</h2>
          <div class="summary-products">
            ${cart.map((item) => `<div class="summary-product"><span>${item.name} <small>${[item.storage, item.color].filter((value) => value && value !== "N/A").join(" / ")} × ${item.quantity}${item.warranty && item.warranty !== "No Warranty" ? ` · ${item.warranty} warranty` : ""}</small></span><strong>${formatCurrency(item.price * item.quantity)}</strong></div>`).join("")}
          </div>
          <div class="checkout-summary-row"><span>Subtotal</span><strong>${formatCurrency(subtotal)}</strong></div>
          <div class="checkout-summary-row"><span>Delivery</span><strong id="checkoutDelivery">${formatCurrency(delivery)}</strong></div>
          <div class="checkout-total"><span>Total</span><strong id="checkoutTotal">${formatCurrency(total)}</strong></div>
        </aside>
      </form>
    </div>
  `;

  document.getElementById("backFromCheckout").addEventListener("click", () => {
    window.location.hash = "";
  });

  document.querySelectorAll("#checkoutForm input[name='state'], #checkoutForm input[name='city']").forEach((input) => {
    input.addEventListener("input", updateCheckoutDeliveryFee);
  });

  const fulfillmentInputs = document.querySelectorAll("#checkoutForm input[name='fulfillment']");
  const deliverySection = document.getElementById("deliveryInformationSection");
  const deliveryFields = deliverySection.querySelectorAll("input, textarea");
  const syncFulfillment = () => {
    const isPickup = document.querySelector("#checkoutForm input[name='fulfillment']:checked").value === "pickup";
    deliverySection.hidden = isPickup;
    deliveryFields.forEach((field) => { field.required = !isPickup; });
    document.getElementById("deliveryNote").textContent = isPickup
      ? "Store pickup selected. No delivery fee will be added."
      : "Delivery fee updates automatically for Jos, Jos North, Rayfield, other Plateau locations, and supported cities.";
    updateCheckoutDeliveryFee();
  };
  fulfillmentInputs.forEach((input) => input.addEventListener("change", syncFulfillment));
  syncFulfillment();

  const paymentConfirmation = document.querySelector("#checkoutForm input[name='paymentConfirmed']");
  document.querySelectorAll("#checkoutForm input[name='paymentMethod']").forEach((input) => {
    input.addEventListener("change", () => {
      const isTransfer = input.checked && input.value !== "paystack";
      paymentConfirmation.required = isTransfer;
      paymentConfirmation.closest(".payment-confirmation-option").hidden = !isTransfer;
    });
  });
  paymentConfirmation.closest(".payment-confirmation-option").hidden = true;

  document.getElementById("checkoutForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const paymentMethod = formData.get("paymentMethod");
    const currentDelivery = formData.get("fulfillment") === "pickup"
      ? 0
      : calculateDeliveryFee(formData.get("state"), formData.get("city"));
    const currentTotal = subtotal + currentDelivery;
    const submitButton = event.currentTarget.querySelector(".place-order-btn");
    const message = document.getElementById("checkoutMessage");
    submitButton.disabled = true;
    message.textContent = "";

    const completePayment = async (reference) => {
      try {
        const order = createLocalOrder(paymentMethod, reference, formData, currentTotal);
        saveOrder(order);
        decrementInventoryAfterOrder(cart);
        cart = [];
        saveCartToStorage();
        updateCart();
        renderOrderConfirmation(order);
      } catch (error) {
        message.textContent = error.message;
        submitButton.disabled = false;
      }
    };

    if (paymentMethod !== "paystack") {
      await completePayment(null);
      return;
    }

    if (!paymentConfig.publicKey || !window.PaystackPop) {
      message.textContent = "Paystack is not configured yet. Add the public key and verification endpoint to continue.";
      submitButton.disabled = false;
      return;
    }

    const handler = window.PaystackPop.setup({
      key: paymentConfig.publicKey,
      email: formData.get("email"),
      amount: Math.round(total * 100),
      currency: "NGN",
      callback: (response) => completePayment(response.reference),
      onClose: () => { submitButton.disabled = false; }
    });
    handler.openIframe();
  });
}

function renderWishlistPage() {
  const savedProducts = wishlist
    .map((productId) => products.find((product) => product.id === productId))
    .filter(Boolean);

  wishlistPage.innerHTML = `
    <div class="container wishlist-shell">
      <button class="back-link" type="button" id="backFromWishlist">← Back to shop</button>
      <div class="section-heading wishlist-heading">
        <p>SAVED FOR LATER</p>
        <h1>MY WISHLIST</h1>
      </div>
      ${savedProducts.length === 0
        ? '<div class="wishlist-empty"><h2>Your wishlist is empty.</h2><p>Save products here when you find something you love.</p><a class="primary-btn" href="#products">BROWSE PRODUCTS</a></div>'
        : `<div class="wishlist-list">${savedProducts.map((product) => `
          <article class="wishlist-item">
            ${createResponsiveImageMarkup(product.images[0], product.name, { width: 160, height: 160, loading: "lazy" })}
            <div class="wishlist-item-info">
              <span class="product-brand">${product.brand}</span>
              <h2>${product.name}</h2>
              <strong>${formatCurrency(product.finalPrice)}${product.discountPercentage > 0 ? ` <s>${formatCurrency(product.originalPrice)}</s>` : ""}</strong>
              ${product.warranty && product.warranty !== "No Warranty" ? `<small>Warranty: ${escapeHtml(product.warranty)}</small>` : ""}
            </div>
            <div class="wishlist-item-actions">
              <button class="primary-btn wishlist-cart-btn" type="button" data-id="${product.id}">ADD TO CART</button>
              <button class="wishlist-remove-btn" type="button" data-id="${product.id}">REMOVE</button>
            </div>
          </article>
        `).join("")}</div>`}
    </div>
  `;

  document.getElementById("backFromWishlist")?.addEventListener("click", () => {
    window.location.hash = "";
  });

  wishlistPage.querySelectorAll(".wishlist-cart-btn").forEach((button) => {
    button.addEventListener("click", () => addToCart(Number(button.dataset.id)));
  });

  wishlistPage.querySelectorAll(".wishlist-remove-btn").forEach((button) => {
    button.addEventListener("click", () => toggleWishlist(Number(button.dataset.id)));
  });
}

function openProductDetail(productId) {
  const product = products.find((item) => item.id === productId);
  if (!product) return;

  if (searchResults) {
    searchResults.hidden = true;
    searchResults.innerHTML = "";
  }
  detailQuantity = 1;
  selectedDetailVariantId = product.variants?.[0]?.id || `${product.id}-default`;
  const route = `#product-${product.id}`;
  window.location.hash = route;
  renderProductDetail(product);
  showDetailView();
}

function renderProductDetail(product, variantId = selectedDetailVariantId) {
  const variant = getProductVariant(product, variantId);
  selectedDetailVariantId = variant.id;
  const variantImages = variant.images?.length ? variant.images : product.images || [];
  const variants = product.variants || [variant];
  const availableVariants = variants.filter((entry) => Number(entry.stock) > 0);
  const visibleVariants = availableVariants.length ? availableVariants : variants;
  const storageValues = [...new Set(visibleVariants.map((entry) => entry.storage).filter(Boolean))];
  const colorValues = [...new Set(visibleVariants.filter((entry) => entry.storage === variant.storage).map((entry) => entry.color).filter(Boolean))];
  const thumbs = variantImages.map((image, index) => `
    <button class="thumb-btn ${index === 0 ? "active" : ""}" type="button" data-image="${image}" aria-label="View image ${index + 1}">
      ${createResponsiveImageMarkup(image, `${product.name} view ${index + 1}`, { width: 180, height: 160, loading: "lazy" })}
    </button>
  `).join("");

  productDetailPage.innerHTML = `
    <div class="container detail-shell">
      <button class="back-link" type="button" id="backToShop">← Back to shop</button>

      <div class="detail-layout">
        <div class="detail-gallery">
          <div class="detail-main-image">
            <div id="detailMainImage">${createResponsiveImageMarkup(variantImages[0], product.name, { width: 900, height: 700, loading: "eager" })}</div>
          </div>
          <div class="detail-thumbs">${thumbs}</div>
        </div>

        <div class="detail-info">
          <p class="detail-brand">${product.brand}</p>
          <h1>${product.name}</h1>
          <div class="detail-rating">
            <span>★★★★★</span>
            <strong>${product.rating}</strong>
            <small>(${product.reviews} reviews)</small>
          </div>

          <div class="detail-price-block">
            <span class="detail-price">${formatCurrency(variant.finalPrice)}</span>
            ${variant.discountPercentage > 0 ? `<span class="detail-old-price">${formatCurrency(variant.originalPrice)}</span><span class="detail-discount">${getDiscountLabel(variant)}</span>` : ""}
            <span class="detail-discount">SKU ${escapeHtml(variant.sku)}</span>
          </div>

          <div class="detail-stock-row">
            <span class="detail-stock">${variant.stock > 0 ? `Stock: ${variant.stock}` : "OUT OF STOCK"}</span>
            <span class="detail-condition">${escapeHtml(variant.condition)}</span>
          </div>

          <div class="variant-selector-group">
            <strong>Storage</strong>
            <div class="variant-options">${storageValues.map((value) => `<button type="button" class="variant-option ${variant.storage === value ? "active" : ""}" data-variant-field="storage" data-value="${escapeHtml(value)}">${escapeHtml(value)}</button>`).join("")}</div>
          </div>
          <div class="variant-selector-group">
            <strong>Color</strong>
            <div class="variant-options">${colorValues.map((value) => `<button type="button" class="variant-option ${variant.color === value ? "active" : ""}" data-variant-field="color" data-value="${escapeHtml(value)}">${escapeHtml(value)}</button>`).join("")}</div>
          </div>

          <div class="detail-meta-list">
            <div><span>Storage</span><strong>${escapeHtml(variant.storage)}</strong></div>
            <div><span>Color</span><strong>${escapeHtml(variant.color)}</strong></div>
            <div><span>SKU</span><strong>${escapeHtml(variant.sku)}</strong></div>
            <div><span>Warranty</span><strong>${escapeHtml(variant.warranty)}</strong></div>
            ${variant.batteryHealth ? `<div><span>Battery health</span><strong>${escapeHtml(variant.batteryHealth)}</strong></div>` : ""}
            ${variant.faceId ? `<div><span>Face ID</span><strong>${escapeHtml(variant.faceId)}</strong></div>` : ""}
            ${variant.trueTone ? `<div><span>True Tone</span><strong>${escapeHtml(variant.trueTone)}</strong></div>` : ""}
            ${variant.display ? `<div><span>Display</span><strong>${escapeHtml(variant.display)}</strong></div>` : ""}
            ${variant.camera ? `<div><span>Camera</span><strong>${escapeHtml(variant.camera)}</strong></div>` : ""}
            ${variant.sim ? `<div><span>SIM / network</span><strong>${escapeHtml(variant.sim)}</strong></div>` : ""}
          </div>

          <div class="quantity-row">
            <span>Quantity</span>
            <div class="qty-box">
              <button type="button" class="qty-btn" data-action="decrease">−</button>
              <strong id="detailQuantityValue">${detailQuantity}</strong>
              <button type="button" class="qty-btn" data-action="increase">+</button>
            </div>
          </div>

          <div class="detail-actions">
            <button class="primary-btn detail-primary" type="button" data-product-id="${product.id}" data-variant-id="${escapeHtml(variant.id)}" ${variant.stock <= 0 ? "disabled" : ""}>${variant.stock > 0 ? "ADD TO CART" : "OUT OF STOCK"}</button>
            <button class="secondary-btn detail-secondary" type="button" data-product-id="${product.id}" data-variant-id="${escapeHtml(variant.id)}" ${variant.stock <= 0 ? "disabled" : ""}>BUY NOW</button>
          </div>
        </div>
      </div>

      <div class="detail-content-grid">
        <section class="detail-panel">
          <h2>Description</h2>
          <p>${product.description}</p>
        </section>

        <section class="detail-panel">
          <h2>Specifications</h2>
          <ul class="spec-list">
            ${product.specifications.map((spec) => `<li>${spec}</li>`).join("")}
          </ul>
        </section>

        <section class="detail-panel">
          <h2>Warranty</h2>
          <p>Coverage: ${product.warranty}. Arcadia Mobile provides verified support for all purchases and repair-related services.</p>
        </section>

        <section class="detail-panel">
          <h2>Reviews</h2>
          <div class="review-box">
            <p><strong>${product.rating}/5</strong> from ${product.reviews} verified customer reviews.</p>
            <button type="button" class="secondary-btn review-btn">Leave a review</button>
          </div>
        </section>
      </div>
    </div>
  `;

  const mainImage = document.getElementById("detailMainImage");
  document.querySelectorAll(".thumb-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const nextImage = button.dataset.image;
      mainImage.querySelector("img").src = nextImage;
      document.querySelectorAll(".thumb-btn").forEach((thumb) => thumb.classList.toggle("active", thumb === button));
    });
  });

  document.querySelectorAll(".variant-option").forEach((button) => {
    button.addEventListener("click", () => {
      const field = button.dataset.variantField;
      const candidate = visibleVariants.find((entry) => entry[field] === button.dataset.value && (field === "storage" ? entry.color === variant.color : entry.storage === variant.storage))
        || visibleVariants.find((entry) => entry[field] === button.dataset.value);
      if (candidate) renderProductDetail(product, candidate.id);
    });
  });

  document.getElementById("backToShop").addEventListener("click", () => {
    window.location.hash = "";
    showHomeView();
  });

  document.querySelector(".qty-btn[data-action='decrease']")?.addEventListener("click", () => {
    detailQuantity = Math.max(1, detailQuantity - 1);
    document.getElementById("detailQuantityValue").textContent = detailQuantity;
  });

  document.querySelector(".qty-btn[data-action='increase']")?.addEventListener("click", () => {
    detailQuantity = detailQuantity + 1;
    document.getElementById("detailQuantityValue").textContent = detailQuantity;
  });

  document.querySelector(".detail-primary")?.addEventListener("click", () => {
    const button = document.querySelector(".detail-primary");
    addToCart(Number(button.dataset.productId), detailQuantity, button.dataset.variantId);
  });
  document.querySelector(".detail-secondary")?.addEventListener("click", () => {
    const button = document.querySelector(".detail-secondary");
    addToCart(Number(button.dataset.productId), detailQuantity, button.dataset.variantId);
    window.location.hash = "checkout";
  });
}

function resetPagePosition() {
  const previousScrollBehavior = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = "auto";
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  document.documentElement.style.scrollBehavior = previousScrollBehavior;
}

function showHomeView(preserveScroll = false) {
  if (!preserveScroll) resetPagePosition();
  productDetailPage.classList.add("hidden");
  wishlistPage.classList.add("hidden");
  accountPage.classList.add("hidden");
  checkoutPage.classList.add("hidden");
  repairPage.classList.add("hidden");
  adminPage.classList.add("hidden");
  homeMain.classList.remove("hidden");
}

function showDetailView() {
  resetPagePosition();
  productDetailPage.classList.remove("hidden");
  wishlistPage.classList.add("hidden");
  accountPage.classList.add("hidden");
  checkoutPage.classList.add("hidden");
  repairPage.classList.add("hidden");
  adminPage.classList.add("hidden");
  homeMain.classList.add("hidden");
}

function showWishlistView() {
  resetPagePosition();
  productDetailPage.classList.add("hidden");
  wishlistPage.classList.remove("hidden");
  accountPage.classList.add("hidden");
  checkoutPage.classList.add("hidden");
  repairPage.classList.add("hidden");
  adminPage.classList.add("hidden");
  homeMain.classList.add("hidden");
  renderWishlistPage();
}

function showAccountView() {
  resetPagePosition();
  productDetailPage.classList.add("hidden");
  wishlistPage.classList.add("hidden");
  accountPage.classList.remove("hidden");
  checkoutPage.classList.add("hidden");
  repairPage.classList.add("hidden");
  adminPage.classList.add("hidden");
  homeMain.classList.add("hidden");
  renderAccountPage();
}

function showCheckoutView() {
  resetPagePosition();
  productDetailPage.classList.add("hidden");
  wishlistPage.classList.add("hidden");
  accountPage.classList.add("hidden");
  checkoutPage.classList.remove("hidden");
  repairPage.classList.add("hidden");
  adminPage.classList.add("hidden");
  homeMain.classList.add("hidden");
  cartPanel.classList.remove("open");
  renderCheckoutPage();
}

function showRepairView() {
  resetPagePosition();
  productDetailPage.classList.add("hidden");
  wishlistPage.classList.add("hidden");
  accountPage.classList.add("hidden");
  checkoutPage.classList.add("hidden");
  repairPage.classList.remove("hidden");
  adminPage.classList.add("hidden");
  homeMain.classList.add("hidden");
  renderRepairBooking();
}

function renderAdminLogin() {
  adminPage.innerHTML = `
    <div class="container account-shell">
      <div class="account-heading">
        <p class="eyebrow">ARCADIA ADMINISTRATION</p>
        <h1>ADMIN LOGIN</h1>
        <p>Sign in to manage the local Arcadia catalog and operations.</p>
      </div>
      <form class="auth-form" id="adminLoginForm">
        <label>Email<input name="email" type="email" autocomplete="username" required /></label>
        <label>Password<input name="password" type="password" autocomplete="current-password" required /></label>
        <button class="primary-btn" type="submit">OPEN DASHBOARD</button>
        <p class="form-message" id="adminLoginMessage" role="alert"></p>
      </form>
    </div>
  `;

  enhancePasswordInputs(adminPage);

  document.getElementById("adminLoginForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = normalizeEmailAddress(formData.get("email"));
    const password = String(formData.get("password") || "");
    const message = document.getElementById("adminLoginMessage");

    if (email !== LOCAL_ADMIN_CONFIG.email || password !== LOCAL_ADMIN_CONFIG.password) {
      message.textContent = "Invalid admin credentials";
      return;
    }

    sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
    renderAdminPage("overview");
  });
}

function showAdminView(section = "overview") {
  resetPagePosition();

  productDetailPage.classList.add("hidden");
  wishlistPage.classList.add("hidden");
  accountPage.classList.add("hidden");
  checkoutPage.classList.add("hidden");
  repairPage.classList.add("hidden");
  adminPage.classList.remove("hidden");
  homeMain.classList.add("hidden");
  if (isLocalAdminAuthenticated()) {
    renderAdminPage(section);
  } else {
    renderAdminLogin();
  }
}

function showRepairTrackingView() {
  resetPagePosition();
  productDetailPage.classList.add("hidden");
  wishlistPage.classList.add("hidden");
  accountPage.classList.add("hidden");
  checkoutPage.classList.add("hidden");
  repairPage.classList.remove("hidden");
  homeMain.classList.add("hidden");
  renderRepairTracking();
}

function handleHashRouting() {
  const hash = window.location.hash;
  const isHomeSection = HOME_SECTION_HASHES.includes(hash);
  if (!isHomeSection) resetPagePosition();
  if (hash.startsWith("#admin")) {
    showAdminView(hash.split("/")[1] || "overview");
    return;
  }

  if (hash === "#repair-tracking") {
    showRepairTrackingView();
    return;
  }

  if (hash === "#repair-booking") {
    showRepairView();
    return;
  }

  if (hash === "#checkout") {
    showCheckoutView();
    return;
  }

  if (hash === "#account") {
    showAccountView();
    return;
  }

  if (hash === "#wishlist") {
    showWishlistView();
    return;
  }

  if (hash.startsWith("#product-")) {
    const productId = Number(hash.replace("#product-", ""));
    const product = products.find((item) => item.id === productId);
    if (product) {
      showDetailView();
      renderProductDetail(product);
      return;
    }
  }

  showHomeView(isHomeSection);
  if (isHomeSection && hash) {
    window.setTimeout(() => {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }
  if (!isHomeSection) window.setTimeout(resetPagePosition, 100);
}

function saveCartToStorage() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function loadCartFromStorage() {
  try {
    const savedCart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
    cart = Array.isArray(savedCart) ? savedCart.map((item) => ({ ...item, variantId: item.variantId || `${item.id}-default` })) : [];
  } catch (error) {
    cart = [];
  }
}

function addToCart(productId, quantity = 1, variantId = null) {
  const product = products.find((item) => item.id === productId);
  const variant = product ? getProductVariant(product, variantId) : null;
  if (!product || !variant || variant.stock <= 0) return;

  const existing = cart.find((item) => item.id === productId && item.variantId === variant.id);

  if (existing) {
    existing.quantity = Math.min(variant.stock, existing.quantity + quantity);
  } else {
    cart.push({ ...product, ...variant, name: product.name, brand: product.brand, variantId: variant.id, quantity: Math.min(variant.stock, quantity) });
  }

  saveCartToStorage();
  updateCart();
  cartPanel.classList.add("open");
}

function changeQuantity(productId, change, variantId = null) {
  const item = cart.find((entry) => entry.id === productId && entry.variantId === variantId);
  if (!item) return;

  const product = products.find((entry) => entry.id === productId);
  if (!product) return;

  const variant = getProductVariant(product, item.variantId);
  item.quantity = Math.min(variant.stock, item.quantity + change);

  if (item.quantity <= 0) {
    cart = cart.filter((entry) => !(entry.id === productId && entry.variantId === item.variantId));
  }

  saveCartToStorage();
  updateCart();
}

function removeFromCart(productId, variantId = null) {
  cart = cart.filter((item) => {
    if (String(item.id) !== String(productId)) return true;
    if (!variantId) return false;
    return String(item.variantId || `${item.id}-default`) !== String(variantId);
  });
  saveCartToStorage();
  updateCart();
}

function updateCart() {
  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="empty-cart">Your cart is empty.</p>';
    cartSubtotal.textContent = "₦ 0";
    cartDelivery.textContent = "₦ 0";
    cartTotal.textContent = "₦ 0";
    cartCount.textContent = "0";
    return;
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const delivery = 0;
  const total = subtotal + delivery;

  cartCount.textContent = String(cart.reduce((sum, item) => sum + item.quantity, 0));
  cartSubtotal.textContent = formatCurrency(subtotal);
  cartDelivery.textContent = formatCurrency(delivery);
  cartTotal.textContent = formatCurrency(total);

  cartItems.innerHTML = cart
    .map(
      (item) => `
        <div class="cart-item">
          <div class="cart-item-copy">
            <strong>${item.name}</strong>
            <span>${[item.storage, item.color, item.condition].filter((value) => value && value !== "N/A").join(" / ")}</span>
            <span>${formatCurrency(item.finalPrice ?? item.price)}${item.discountPercentage > 0 ? ` · ${getDiscountLabel(item)}` : ""}</span>
            ${item.warranty && item.warranty !== "No Warranty" ? `<span>Warranty: ${escapeHtml(item.warranty)}</span>` : ""}
          </div>
          <div class="cart-item-actions">
            <div class="cart-qty-box">
              <button type="button" class="qty-adjust" data-action="decrease" data-id="${item.id}" data-variant-id="${item.variantId}">−</button>
              <span>${item.quantity}</span>
              <button type="button" class="qty-adjust" data-action="increase" data-id="${item.id}" data-variant-id="${item.variantId}">+</button>
            </div>
            <button class="remove-item" type="button" data-id="${item.id}" data-variant-id="${item.variantId}">Remove</button>
          </div>
        </div>
      `
    )
    .join("");

  document.querySelectorAll(".qty-adjust").forEach((button) => {
    button.addEventListener("click", () => {
      const productId = Number(button.dataset.id);
      const action = button.dataset.action;
      changeQuantity(productId, action === "increase" ? 1 : -1, button.dataset.variantId);
    });
  });

  document.querySelectorAll(".remove-item").forEach((button) => {
    button.addEventListener("click", () => {
      removeFromCart(button.dataset.id, button.dataset.variantId);
    });
  });
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedCategory = button.dataset.category;
    filterButtons.forEach((btn) => btn.classList.toggle("active", btn === button));
    renderProducts();
  });
});

searchInput.addEventListener("input", (event) => {
  searchTerm = event.target.value;
  renderProducts();
  renderSearchResults();
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".search-box")) searchResults.hidden = true;
});

wishlistButton.addEventListener("click", () => {
  window.location.hash = "wishlist";
});

accountButton.addEventListener("click", () => {
  window.location.hash = "account";
});

adminButton.addEventListener("click", () => {
  if (window.location.hash === "#admin") {
    showAdminView();
    return;
  }
  window.location.hash = "#admin";
});

cartToggleButton.addEventListener("click", () => {
  cartPanel.classList.toggle("open");
});

closeCartButton.addEventListener("click", () => {
  cartPanel.classList.remove("open");
});

proceedToCheckoutButton.addEventListener("click", () => {
  window.location.hash = "checkout";
});

menuToggle.addEventListener("click", () => {
  const expanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!expanded));
  mobileMenu.classList.toggle("open");
});

mobileMenu.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mobileMenu.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

window.addEventListener("hashchange", handleHashRouting);
window.addEventListener("hashchange", () => {
  if (!HOME_SECTION_HASHES.includes(window.location.hash)) window.setTimeout(resetPagePosition, 100);
});

function hideAppLoader() {
  if (!appLoader) return;
  if (appLoader.dataset.hidden === "true") return;
  appLoader.dataset.hidden = "true";
  appLoader.classList.add("is-hidden");
  window.setTimeout(() => {
    appLoader.remove();
  }, 260);
}

function initializeApp() {
  try {
    loadCartFromStorage();
    loadWishlistFromStorage();
    loadCustomerFromStorage();
    enforceAuthorizedAdminAccess();
    syncAdminButtonState();
    loadLocalAdminProducts();
    normalizeProducts();
    renderDeals();
    renderProducts();
    renderBillboard();
    updateSeoSchema();
    updateCart();
    updateWishlistCount();
    handleHashRouting();
    if (!HOME_SECTION_HASHES.includes(window.location.hash)) window.setTimeout(resetPagePosition, 100);
  } catch (error) {
    console.error("App initialization failed:", error);
  } finally {
    window.setTimeout(hideAppLoader, 180);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp, { once: true });
} else {
  initializeApp();
}
