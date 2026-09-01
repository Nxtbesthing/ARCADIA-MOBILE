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

let products = [...fallbackProducts];

let selectedCategory = "all";
let searchTerm = "";
let cart = [];
let wishlist = [];
let customer = null;
let detailQuantity = 1;

const CART_STORAGE_KEY = "arcadia-cart";
const WISHLIST_STORAGE_KEY = "arcadia-wishlist";
const CUSTOMER_STORAGE_KEY = "arcadia-customer";
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
import { createClient } from "@supabase/supabase-js";

const REPAIR_STATUSES = ["Requested", "Received", "Diagnosing", "Awaiting Approval", "Repairing", "Testing", "Ready", "Completed", "Cancelled"];
const REPAIR_DEVICES = ["iPhone", "Samsung", "Tecno", "Infinix", "Xiaomi", "Laptop", "Tablet", "Other"];
const REPAIR_PROBLEMS = ["Broken Screen", "Battery", "Charging", "Camera", "Speaker", "Software", "Water Damage", "Other"];
const ADMIN_PASSWORD_HASH = "fa9a1e7a490c1c977d563e776092ff8027d8323a9dae9098e24a44325273bfed";
const ADMIN_INACTIVITY_LIMIT = 2 * 60 * 1000;
let adminUnlocked = sessionStorage.getItem("arcadia-admin-unlocked") === "true";
let adminInactivityTimer;

const appLoader = document.getElementById("appLoader");
const localBusinessSchema = document.getElementById("localBusinessSchema");
const productSchema = document.getElementById("productSchema");
const productGrid = document.getElementById("productGrid");
const dealGrid = document.getElementById("dealGrid");
const filterButtons = document.querySelectorAll(".filter-btn");
const searchInput = document.getElementById("searchInput");
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

const supabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL || "",
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || ""
};

const supabaseClient = supabaseConfig.url && supabaseConfig.anonKey
  ? createClient(supabaseConfig.url, supabaseConfig.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

const paymentConfig = {
  publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "",
  verifyEndpoint: import.meta.env.VITE_PAYSTACK_VERIFY_ENDPOINT || "",
  methodsEndpoint: import.meta.env.VITE_PAYMENT_METHODS_ENDPOINT || ""
};
let publicPaymentMethods = [];
let supabaseSession = null;

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

function validateCustomerFields(values) {
  const name = String(values.name || "").trim();
  const phone = String(values.phone || "").trim();
  const email = String(values.email || "").trim();
  if (name.length < 2 || name.length > 100) return "Enter a valid name.";
  if (!/^[+\d][\d\s()-]{7,20}$/.test(phone)) return "Enter a valid phone number.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address.";
  return "";
}

async function supabaseAuth(path, body) {
  if (!supabaseConfig.url || !supabaseConfig.anonKey) return null;
  const response = await fetch(`${supabaseConfig.url}/auth/v1/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: supabaseConfig.anonKey },
    body: JSON.stringify(body)
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error_description || result.msg || "Authentication failed.");
  if (result.access_token) {
    supabaseSession = result;
    sessionStorage.setItem("arcadia-supabase-session", JSON.stringify(result));
  }
  return result;
}

function loadSupabaseSession() {
  try {
    supabaseSession = JSON.parse(sessionStorage.getItem("arcadia-supabase-session") || "null");
  } catch (error) {
    supabaseSession = null;
  }
}

function loadLocalAdminProducts() {
  try {
    const savedProducts = JSON.parse(localStorage.getItem("arcadia-admin-products") || "null");
    if (Array.isArray(savedProducts) && savedProducts.length > 0) products = savedProducts;
  } catch (error) {
    products = [...fallbackProducts];
  }
}

async function loadProductsFromSupabase() {
  if (!supabaseConfig.url || !supabaseConfig.anonKey) return;

  try {
    const response = await fetch(`${supabaseConfig.url}/rest/v1/products?select=*,categories(name,slug),inventory(quantity),product_images(url,alt_text,sort_order)&is_active=eq.true&order=created_at.desc`, {
      headers: {
        apikey: supabaseConfig.anonKey,
        Authorization: `Bearer ${supabaseSession?.access_token || supabaseConfig.anonKey}`
      }
    });
    if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length === 0) return;

    products = rows.map((product) => ({
      ...product,
      category: product.categories?.name || "Products",
      categoryKey: product.categories?.slug || "all",
      oldPrice: product.old_price,
      stock: product.inventory?.[0]?.quantity || 0,
      images: (product.product_images || []).sort((a, b) => a.sort_order - b.sort_order).map((image) => image.url),
      specifications: product.specifications || [],
      rating: product.rating || 0,
      reviews: product.reviews || 0
    }));
    products = products.map((product) => ({ ...product, images: product.images.length ? product.images : [fallbackProducts[0].images[0]] }));
    renderDeals();
    renderProducts();
  } catch (error) {
    console.warn("Supabase catalog unavailable; using fallback catalog.", error);
  }
}

function adminRestHeaders() {
  return { "Content-Type": "application/json", apikey: supabaseConfig.anonKey, Authorization: `Bearer ${supabaseSession?.access_token || supabaseConfig.anonKey}` };
}

async function adminProductAction(action, productId, payload = {}) {
  if (supabaseConfig.url && supabaseConfig.anonKey) {
    const endpoint = `${supabaseConfig.url}/rest/v1/products${productId ? `?id=eq.${productId}` : ""}`;
    const productPayload = { ...payload };
    delete productPayload.stock;
    delete productPayload.images;
    const response = await fetch(endpoint, {
      method: action === "delete" ? "DELETE" : action === "create" ? "POST" : "PATCH",
      headers: { ...adminRestHeaders(), Prefer: action === "create" ? "return=representation" : "return=minimal" },
      body: action === "delete" ? undefined : JSON.stringify(productPayload)
    });
    if (!response.ok) throw new Error(`Admin request failed: ${response.status}`);
    if (action === "update" && payload.stock !== undefined) {
      const inventoryResponse = await fetch(`${supabaseConfig.url}/rest/v1/inventory?on_conflict=product_id`, {
        method: "POST",
        headers: { ...adminRestHeaders(), Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ product_id: productId, quantity: payload.stock })
      });
      if (!inventoryResponse.ok) throw new Error(`Inventory request failed: ${inventoryResponse.status}`);
    }
    return;
  }

  if (action === "delete") products = products.filter((product) => product.id !== productId);
  if (action === "update") products = products.map((product) => product.id === productId ? { ...product, ...payload } : product);
  if (action === "create") products = [{ id: Date.now(), images: [fallbackProducts[0].images[0]], specifications: [], rating: 0, reviews: 0, stock: 0, ...payload }, ...products];
  localStorage.setItem("arcadia-admin-products", JSON.stringify(products));
}

function renderAdminPage(section = "overview", notice = "") {
  const orders = loadOrdersFromStorage();
  const repairs = loadRepairsFromStorage();
  const sectionBody = section === "products" ? `
    <form class="admin-product-form" id="adminProductForm">
      <input name="name" placeholder="Product name" required />
      <input name="brand" placeholder="Brand" required />
      <input name="price" type="number" min="0" placeholder="Price" required />
      <input name="stock" type="number" min="0" placeholder="Stock" required />
      <input name="image" type="url" placeholder="Image URL" />
      <button class="primary-btn" type="submit">ADD PRODUCT</button>
    </form>
    <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead><tbody>
      ${products.map((product) => `<tr><td><strong>${product.name}</strong><small>${product.brand}</small></td><td><input class="admin-inline" data-field="price" data-id="${product.id}" type="number" value="${product.price}" /></td><td><input class="admin-inline" data-field="stock" data-id="${product.id}" type="number" min="0" value="${product.stock}" /></td><td><button class="admin-action" data-action="save" data-id="${product.id}">SAVE</button><button class="admin-action danger" data-action="delete" data-id="${product.id}">DELETE</button><label class="upload-label">UPLOAD IMAGES<input class="admin-upload" data-id="${product.id}" type="file" accept="image/*" multiple /></label></td></tr>`).join("")}
    </tbody></table></div>
  ` : section === "orders" ? `<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Order ID</th><th>Customer</th><th>Amount</th><th>Payment</th><th>Status</th><th>Date</th></tr></thead><tbody>${orders.map((order) => `<tr><td>${order.orderNumber}</td><td>${order.customer.name}</td><td>${formatCurrency(order.total)}</td><td>${order.paymentMethod}</td><td>${order.status}</td><td>${new Date(order.createdAt).toLocaleDateString()}</td></tr>`).join("") || '<tr><td colspan="6">No orders yet.</td></tr>'}</tbody></table></div>` : section === "repairs" ? `<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Repair ID</th><th>Customer</th><th>Device</th><th>Problem</th><th>Status</th><th>Diagnosis</th><th>Cost</th><th>Action</th></tr></thead><tbody>${repairs.map((repair) => `<tr><td>${repair.repairId}</td><td>${repair.customer.name}</td><td>${repair.device}</td><td>${repair.problem}</td><td><select class="repair-status-select" data-id="${repair.repairId}">${REPAIR_STATUSES.map((status) => `<option ${repair.status === status ? "selected" : ""}>${status}</option>`).join("")}</select></td><td><input class="repair-inline" data-field="diagnosis" data-id="${repair.repairId}" value="${repair.diagnosis || ""}" placeholder="Add diagnosis" /></td><td><input class="repair-inline" data-field="repairCost" data-id="${repair.repairId}" type="number" min="0" value="${repair.repairCost || ""}" placeholder="Cost" /></td><td><button class="admin-action" data-action="repair-save" data-id="${repair.repairId}">UPDATE</button><a class="admin-action" href="mailto:${repair.customer.email}">CONTACT</a></td></tr>`).join("") || '<tr><td colspan="8">No repair requests yet.</td></tr>'}</tbody></table></div>` : `<div class="admin-metric-grid"><div><strong>${formatCurrency(orders.reduce((sum, order) => sum + order.total, 0))}</strong><span>Sales</span></div><div><strong>${orders.length}</strong><span>Orders</span></div><div><strong>${products.length}</strong><span>Products</span></div><div><strong>${repairs.length}</strong><span>Repairs</span></div></div>`;

  adminPage.innerHTML = `<div class="container admin-shell"><div class="admin-header"><div><p class="eyebrow">OPERATIONS CONSOLE</p><h1>ARCADIA ADMIN</h1></div><div class="admin-header-actions"><span class="admin-security">Auto logout after 2 minutes idle</span><button class="admin-logout" id="adminLogout" type="button">LOG OUT OF ADMIN</button></div></div><nav class="admin-nav">${["overview", "orders", "products", "inventory", "customers", "repairs", "reviews", "payments"].map((item) => `<a class="${section === item ? "active" : ""}" href="#admin/${item}">${item[0].toUpperCase() + item.slice(1)}</a>`).join("")}</nav>${notice ? `<p class="admin-notice">${notice}</p>` : ""}<section class="admin-section">${section === "products" ? "<h2>Products</h2>" : section === "orders" ? "<h2>Orders</h2>" : section === "repairs" ? "<h2>Repairs</h2>" : "<h2>Overview</h2>"}${sectionBody}</section></div>`;

  document.getElementById("adminLogout").addEventListener("click", logoutAdmin);

  document.getElementById("adminProductForm")?.addEventListener("submit", async (event) => { event.preventDefault(); const data = new FormData(event.currentTarget); await adminProductAction("create", null, { name: data.get("name"), brand: data.get("brand"), price: Number(data.get("price")), stock: Number(data.get("stock")), images: [data.get("image") || fallbackProducts[0].images[0]] }); renderAdminPage("products", "Product added."); });
  adminPage.querySelectorAll(".admin-action[data-action='delete']").forEach((button) => button.addEventListener("click", async () => { await adminProductAction("delete", Number(button.dataset.id)); renderAdminPage("products", "Product deleted."); }));
  adminPage.querySelectorAll(".admin-action[data-action='save']").forEach((button) => button.addEventListener("click", async () => { const id = Number(button.dataset.id); const price = Number(adminPage.querySelector(`.admin-inline[data-id='${id}'][data-field='price']`).value); const stock = Number(adminPage.querySelector(`.admin-inline[data-id='${id}'][data-field='stock']`).value); await adminProductAction("update", id, { price, stock }); renderAdminPage("products", "Price and stock updated."); }));
  adminPage.querySelectorAll(".admin-upload").forEach((input) => input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const productId = Number(input.dataset.id);
      const product = products.find((item) => item.id === productId);
      if (!product) return;
      product.images = [reader.result];
      localStorage.setItem("arcadia-admin-products", JSON.stringify(products));
      renderAdminPage("products", "Image uploaded to the local catalog. Configure Supabase Storage for production uploads.");
    });
    reader.readAsDataURL(file);
  }));
  adminPage.querySelectorAll(".repair-status-select").forEach((select) => select.addEventListener("change", () => { const repairs = loadRepairsFromStorage().map((repair) => repair.repairId === select.dataset.id ? { ...repair, status: select.value } : repair); localStorage.setItem(REPAIRS_STORAGE_KEY, JSON.stringify(repairs)); }));
  adminPage.querySelectorAll(".admin-action[data-action='repair-save']").forEach((button) => button.addEventListener("click", () => { const repairId = button.dataset.id; const diagnosis = adminPage.querySelector(`.repair-inline[data-id='${repairId}'][data-field='diagnosis']`).value; const repairCost = Number(adminPage.querySelector(`.repair-inline[data-id='${repairId}'][data-field='repairCost']`).value) || null; const repairs = loadRepairsFromStorage().map((repair) => repair.repairId === repairId ? { ...repair, diagnosis, repairCost, status: adminPage.querySelector(`.repair-status-select[data-id='${repairId}']`).value } : repair); localStorage.setItem(REPAIRS_STORAGE_KEY, JSON.stringify(repairs)); renderAdminPage("repairs", "Repair details updated." ); }));
}

function startAdminInactivityTimer() {
  clearTimeout(adminInactivityTimer);
  adminInactivityTimer = setTimeout(logoutAdmin, ADMIN_INACTIVITY_LIMIT);
}

function resetAdminInactivityTimer() {
  if (!adminUnlocked || !window.location.hash.startsWith("#admin")) return;
  startAdminInactivityTimer();
}

function logoutAdmin() {
  adminUnlocked = false;
  clearTimeout(adminInactivityTimer);
  sessionStorage.removeItem("arcadia-admin-unlocked");
  if (window.location.hash.startsWith("#admin")) {
    window.location.hash = "";
  } else {
    showHomeView();
  }
}

function formatCurrency(amount) {
  return `₦ ${amount.toLocaleString()}`;
}

function getFilteredProducts() {
  return products.filter((product) => {
    const matchesCategory =
      selectedCategory === "all" || product.categoryKey === selectedCategory;

    const combinedText = [
      product.name,
      product.brand,
      product.category,
      product.description,
      product.condition,
      product.storage,
      product.color,
      product.warranty,
      product.sku,
      ...(product.specifications || [])
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = combinedText.includes(searchTerm.trim().toLowerCase());
    return matchesCategory && matchesSearch;
  });
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
    .filter((product) => product.oldPrice)
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
              <span class="old-price">${formatCurrency(product.oldPrice)}</span>
              <span class="new-price">${formatCurrency(product.price)}</span>
            </div>
            <span class="save-badge">SAVE ${formatCurrency(product.oldPrice - product.price)}</span>
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
                <span class="current-price">${formatCurrency(product.price)}</span>
                <span class="old-price">${formatCurrency(product.oldPrice)}</span>
              </div>
              <span class="stock-status">${product.stock > 0 ? `Stock: ${product.stock}` : "OUT OF STOCK"}</span>
            </div>
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
  } catch (error) {
    customer = null;
  }
}

function renderAccountPage() {
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
    document.getElementById("accountLogout").addEventListener("click", () => {
      customer = null;
      supabaseSession = null;
      localStorage.removeItem(CUSTOMER_STORAGE_KEY);
      sessionStorage.removeItem("arcadia-supabase-session");
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

  document.getElementById("signupForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const message = document.getElementById("signupMessage");
    const validationError = validateCustomerFields({ name: formData.get("fullName"), phone: formData.get("phone"), email: formData.get("email") });
    if (validationError) { message.textContent = validationError; return; }
    try {
      const authResult = await supabaseAuth("signup", { email: formData.get("email"), password: formData.get("password"), data: { full_name: formData.get("fullName"), phone: formData.get("phone") } });
      if (authResult) supabaseSession = authResult;
    } catch (error) { message.textContent = error.message; return; }
    customer = {
      fullName: String(formData.get("fullName")).trim(),
      email: String(formData.get("email")).trim().toLowerCase(),
      phone: String(formData.get("phone")).trim()
    };
    saveCustomerToStorage();
    renderAccountPage();
  });

  document.getElementById("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email")).trim();
    const message = document.getElementById("loginMessage");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || String(formData.get("password")).length < 6) { message.textContent = "Enter a valid email and password."; return; }
    try {
      const authResult = await supabaseAuth("token?grant_type=password", { email, password: formData.get("password") });
      if (authResult) supabaseSession = authResult;
    } catch (error) { message.textContent = error.message; return; }
    customer = { fullName: email.split("@")[0], email, phone: "Phone not added" };
    saveCustomerToStorage();
    renderAccountPage();
  });

  document.getElementById("forgotPassword").addEventListener("click", () => {
    document.getElementById("loginMessage").textContent = "Password reset instructions will be sent to your email.";
  });
}

function getPaymentMethods() {
  return Array.isArray(window.ARCADIA_PAYMENT_METHODS) ? window.ARCADIA_PAYMENT_METHODS : [];
}

function getCheckoutPaymentMarkup() {
  const bankMethods = publicPaymentMethods.length > 0 ? publicPaymentMethods.map((method) => `
    <label class="payment-option">
      <input type="radio" name="paymentMethod" value="${method.id}" required />
      <span><strong>${method.name}</strong><small>Account: ${method.accountNumber} | Name: ${method.accountName}</small></span>
    </label>
  `).join("") : `
    <label class="payment-option">
      <input type="radio" name="paymentMethod" value="bank-transfer" required />
      <span><strong>Bank transfer</strong><small>Payment details will be supplied securely by the server.</small></span>
    </label>
  `;

  return `
    <label class="payment-option payment-option-primary">
      <input type="radio" name="paymentMethod" value="paystack" required />
      <span><strong>Pay with Paystack</strong><small>Cards, bank transfer, USSD, and supported Nigerian payment methods.</small></span>
    </label>
    ${bankMethods}
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
  const delivery = calculateDeliveryFee(form.elements.state.value, form.elements.city.value);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  document.getElementById("checkoutDelivery").textContent = formatCurrency(delivery);
  document.getElementById("checkoutTotal").textContent = formatCurrency(subtotal + delivery);
}

async function loadPaymentMethods() {
  if (!paymentConfig.methodsEndpoint) return;
  try {
    const response = await fetch(paymentConfig.methodsEndpoint);
    if (!response.ok) throw new Error(`Payment methods request failed: ${response.status}`);
    const methods = await response.json();
    publicPaymentMethods = Array.isArray(methods) ? methods : [];
    if (window.location.hash === "#checkout") renderCheckoutPage();
  } catch (error) {
    console.warn("Secure payment methods unavailable.", error);
  }
}

async function finalizeVerifiedPayment(paymentMethod, reference, formData, total) {
  if (!paymentConfig.verifyEndpoint) {
    throw new Error("Secure payment verification is not configured yet.");
  }

  const response = await fetch(paymentConfig.verifyEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reference,
      paymentMethod,
      expectedAmount: total,
      customer: {
        name: formData.get("name"),
        phone: formData.get("phone"),
        email: formData.get("email")
      },
      delivery: {
        state: formData.get("state"),
        city: formData.get("city"),
        address: formData.get("address")
      },
      items: cart.map((item) => ({ id: item.id, quantity: item.quantity }))
    })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.verified || !result.order) {
    throw new Error(result.message || "Payment could not be verified.");
  }
  return result.order;
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
  });
  localStorage.setItem("arcadia-admin-products", JSON.stringify(products));
  renderDeals();
  renderProducts();
}

function renderOrderConfirmation(order) {
  checkoutPage.innerHTML = `
    <div class="container confirmation-shell">
      <div class="confirmation-mark">✓</div>
      <p class="eyebrow">THANK YOU FOR SHOPPING WITH ARCADIA</p>
      <h1>ORDER CONFIRMED</h1>
      <div class="confirmation-details">
        <div><span>Order</span><strong>${order.orderNumber}</strong></div>
        <div><span>Total</span><strong>${formatCurrency(order.total)}</strong></div>
        <div><span>Status</span><strong class="status-badge">${order.status}</strong></div>
      </div>
      <p class="confirmation-note">We have received your order and will confirm your payment details securely.</p>
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
            <h2>Delivery information</h2>
            <div class="checkout-fields">
              <label>State<input name="state" type="text" list="deliveryStates" autocomplete="address-level1" required /></label>
              <label>City<input name="city" type="text" list="deliveryCities" autocomplete="address-level2" required /></label>
              <label class="full-field">Address<textarea name="address" rows="4" autocomplete="street-address" required></textarea></label>
            </div>
            <datalist id="deliveryStates"><option value="Plateau"></option><option value="Lagos"></option><option value="Abuja"></option><option value="Kaduna"></option><option value="Kano"></option><option value="Rivers"></option></datalist>
            <datalist id="deliveryCities"><option value="Jos"></option><option value="Jos North"></option><option value="Rayfield"></option><option value="Lagos"></option><option value="Abuja"></option><option value="Kaduna"></option><option value="Kano"></option><option value="Port Harcourt"></option></datalist>
            <p class="delivery-note">Delivery fee updates automatically for Jos, Jos North, Rayfield, other Plateau locations, and supported cities.</p>
          </section>
          <section class="checkout-section">
            <h2>Payment</h2>
            <div class="payment-options">${paymentMarkup}</div>
            <p class="payment-note">Payment verification and order creation happen on the secure server before stock is reduced.</p>
          </section>
          <button class="primary-btn place-order-btn" type="submit">PLACE ORDER</button>
          <p class="form-message" id="checkoutMessage" role="status"></p>
        </div>
        <aside class="order-summary">
          <h2>Order summary</h2>
          <div class="summary-products">
            ${cart.map((item) => `<div class="summary-product"><span>${item.name} <small>× ${item.quantity}</small></span><strong>${formatCurrency(item.price * item.quantity)}</strong></div>`).join("")}
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

  document.getElementById("checkoutForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const paymentMethod = formData.get("paymentMethod");
    const currentDelivery = calculateDeliveryFee(formData.get("state"), formData.get("city"));
    const currentTotal = subtotal + currentDelivery;
    const submitButton = event.currentTarget.querySelector(".place-order-btn");
    const message = document.getElementById("checkoutMessage");
    submitButton.disabled = true;
    message.textContent = "";

    const completePayment = async (reference) => {
      try {
        const order = await finalizeVerifiedPayment(paymentMethod, reference, formData, currentTotal);
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
              <strong>${formatCurrency(product.price)}</strong>
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

  detailQuantity = 1;
  const route = `#product-${product.id}`;
  window.location.hash = route;
  renderProductDetail(product);
  showDetailView();
}

function renderProductDetail(product) {
  const thumbs = (product.images || []).map((image, index) => `
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
            ${createResponsiveImageMarkup(product.images[0], product.name, { width: 900, height: 700, loading: "eager" })}
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
            <span class="detail-price">${formatCurrency(product.price)}</span>
            <span class="detail-old-price">${formatCurrency(product.oldPrice)}</span>
            <span class="detail-discount">Save ${product.discount}%</span>
          </div>

          <div class="detail-stock-row">
            <span class="detail-stock">${product.stock > 0 ? `Stock: ${product.stock}` : "OUT OF STOCK"}</span>
            <span class="detail-condition">${product.condition}</span>
          </div>

          <div class="detail-meta-list">
            <div><span>Storage</span><strong>${product.storage}</strong></div>
            <div><span>Color</span><strong>${product.color}</strong></div>
            <div><span>SKU</span><strong>${product.sku}</strong></div>
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
            <button class="primary-btn detail-primary" type="button" data-product-id="${product.id}" ${product.stock <= 0 ? "disabled" : ""}>${product.stock > 0 ? "ADD TO CART" : "OUT OF STOCK"}</button>
            <button class="secondary-btn detail-secondary" type="button">BUY NOW</button>
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
      mainImage.src = nextImage;
      document.querySelectorAll(".thumb-btn").forEach((thumb) => thumb.classList.toggle("active", thumb === button));
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
    const targetId = Number(document.querySelector(".detail-primary").dataset.productId);
    addToCart(targetId, detailQuantity);
  });
}

function showHomeView() {
  productDetailPage.classList.add("hidden");
  wishlistPage.classList.add("hidden");
  accountPage.classList.add("hidden");
  checkoutPage.classList.add("hidden");
  repairPage.classList.add("hidden");
  adminPage.classList.add("hidden");
  homeMain.classList.remove("hidden");
}

function showDetailView() {
  productDetailPage.classList.remove("hidden");
  wishlistPage.classList.add("hidden");
  accountPage.classList.add("hidden");
  checkoutPage.classList.add("hidden");
  repairPage.classList.add("hidden");
  adminPage.classList.add("hidden");
  homeMain.classList.add("hidden");
}

function showWishlistView() {
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
  productDetailPage.classList.add("hidden");
  wishlistPage.classList.add("hidden");
  accountPage.classList.add("hidden");
  checkoutPage.classList.add("hidden");
  repairPage.classList.remove("hidden");
  adminPage.classList.add("hidden");
  homeMain.classList.add("hidden");
  renderRepairBooking();
}

function showAdminView(section = "overview") {
  if (!adminUnlocked) {
    showAdminAccessPrompt();
    return;
  }

  productDetailPage.classList.add("hidden");
  wishlistPage.classList.add("hidden");
  accountPage.classList.add("hidden");
  checkoutPage.classList.add("hidden");
  repairPage.classList.add("hidden");
  adminPage.classList.remove("hidden");
  homeMain.classList.add("hidden");
  renderAdminPage(section);
  startAdminInactivityTimer();
}

async function hashAdminPassword(password) {
  const encodedPassword = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", encodedPassword);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function showAdminAccessPrompt() {
  if (document.getElementById("adminAccessModal")) return;

  const modal = document.createElement("div");
  modal.className = "admin-access-modal";
  modal.id = "adminAccessModal";
  modal.innerHTML = `
    <div class="admin-access-dialog" role="dialog" aria-modal="true" aria-labelledby="adminAccessTitle">
      <button class="admin-access-close" type="button" aria-label="Close admin access">×</button>
      <p class="eyebrow">RESTRICTED AREA</p>
      <h2 id="adminAccessTitle">Only the admin can access it</h2>
      <p>Enter the admin password to continue.</p>
      <form id="adminAccessForm">
        <label>Password<input name="password" type="password" autocomplete="current-password" required autofocus /></label>
        <button class="primary-btn" type="submit">ACCESS ADMIN</button>
        <p class="admin-access-error" id="adminAccessError" role="alert"></p>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  const closeModal = () => {
    modal.remove();
    if (window.location.hash.startsWith("#admin")) window.location.hash = "";
  };

  modal.querySelector(".admin-access-close").addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
  modal.querySelector("#adminAccessForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = new FormData(event.currentTarget).get("password");
    const isValid = await hashAdminPassword(password) === ADMIN_PASSWORD_HASH;
    if (!isValid) {
      modal.querySelector("#adminAccessError").textContent = "Incorrect password. Admin access denied.";
      return;
    }
    adminUnlocked = true;
    sessionStorage.setItem("arcadia-admin-unlocked", "true");
    modal.remove();
    showAdminView(window.location.hash.split("/")[1] || "overview");
  });
}

function showRepairTrackingView() {
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

  showHomeView();
}

function saveCartToStorage() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function loadCartFromStorage() {
  try {
    const savedCart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
    cart = Array.isArray(savedCart) ? savedCart : [];
  } catch (error) {
    cart = [];
  }
}

function addToCart(productId, quantity = 1) {
  const product = products.find((item) => item.id === productId);
  if (!product || product.stock <= 0) return;

  const existing = cart.find((item) => item.id === productId);

  if (existing) {
    existing.quantity = Math.min(product.stock, existing.quantity + quantity);
  } else {
    cart.push({ ...product, quantity: Math.min(product.stock, quantity) });
  }

  saveCartToStorage();
  updateCart();
  cartPanel.classList.add("open");
}

function changeQuantity(productId, change) {
  const item = cart.find((entry) => entry.id === productId);
  if (!item) return;

  const product = products.find((entry) => entry.id === productId);
  if (!product) return;

  item.quantity = Math.min(product.stock, item.quantity + change);

  if (item.quantity <= 0) {
    cart = cart.filter((entry) => entry.id !== productId);
  }

  saveCartToStorage();
  updateCart();
}

function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId);
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
            <span>${formatCurrency(item.price)}</span>
          </div>
          <div class="cart-item-actions">
            <div class="cart-qty-box">
              <button type="button" class="qty-adjust" data-action="decrease" data-id="${item.id}">−</button>
              <span>${item.quantity}</span>
              <button type="button" class="qty-adjust" data-action="increase" data-id="${item.id}">+</button>
            </div>
            <button class="remove-item" type="button" data-id="${item.id}">Remove</button>
          </div>
        </div>
      `
    )
    .join("");

  document.querySelectorAll(".qty-adjust").forEach((button) => {
    button.addEventListener("click", () => {
      const productId = Number(button.dataset.id);
      const action = button.dataset.action;
      changeQuantity(productId, action === "increase" ? 1 : -1);
    });
  });

  document.querySelectorAll(".remove-item").forEach((button) => {
    button.addEventListener("click", () => {
      removeFromCart(Number(button.dataset.id));
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
});

wishlistButton.addEventListener("click", () => {
  window.location.hash = "wishlist";
});

accountButton.addEventListener("click", () => {
  window.location.hash = "account";
});

adminButton.addEventListener("click", () => {
  window.location.hash = "admin";
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
document.addEventListener("pointerdown", resetAdminInactivityTimer);
document.addEventListener("keydown", resetAdminInactivityTimer);
document.addEventListener("touchstart", resetAdminInactivityTimer);
document.addEventListener("scroll", resetAdminInactivityTimer, { passive: true });

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
    loadSupabaseSession();
    loadLocalAdminProducts();
    renderDeals();
    renderProducts();
    updateSeoSchema();
    updateCart();
    updateWishlistCount();
    handleHashRouting();
    loadProductsFromSupabase();
    loadPaymentMethods();
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
