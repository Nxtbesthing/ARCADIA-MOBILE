const products = [
  {
    id: 1,
    name: "iPhone 15 Pro",
    category: "apple",
    price: 145000,
    rating: 4.9,
    stock: "In stock",
    icon: "📱",
    description: "A16 Bionic, Pro camera system, titanium finish."
  },
  {
    id: 2,
    name: "Samsung Galaxy S24",
    category: "samsung",
    price: 118000,
    rating: 4.8,
    stock: "In stock",
    icon: "📲",
    description: "Premium AMOLED display and AI-powered camera system."
  },
  {
    id: 3,
    name: "Redmi Note 13 Pro",
    category: "redmi",
    price: 42000,
    rating: 4.7,
    stock: "In stock",
    icon: "📱",
    description: "Powerful camera, sleek design, all-day battery life."
  },
  {
    id: 4,
    name: "Tecno Camon 20",
    category: "tecno",
    price: 36000,
    rating: 4.6,
    stock: "Limited",
    icon: "📷",
    description: "High-quality self-portrait camera for creators and social media."
  },
  {
    id: 5,
    name: "Infinix Zero 30",
    category: "infinix",
    price: 40000,
    rating: 4.5,
    stock: "In stock",
    icon: "📸",
    description: "Smooth gaming power, vibrant display, and fast charging."
  },
  {
    id: 6,
    name: "AirPods Pro",
    category: "gadgets",
    price: 26000,
    rating: 4.9,
    stock: "In stock",
    icon: "🎧",
    description: "Noise-canceling sound with wireless charging case."
  },
  {
    id: 7,
    name: "Apple Watch SE",
    category: "gadgets",
    price: 33000,
    rating: 4.8,
    stock: "In stock",
    icon: "⌚",
    description: "Fitness tracking and notifications in a lightweight design."
  },
  {
    id: 8,
    name: "Samsung Tab A9",
    category: "samsung",
    price: 50000,
    rating: 4.7,
    stock: "In stock",
    icon: "💻",
    description: "Portable tablet for work, entertainment, and study."
  }
];

let selectedCategory = "all";
let searchTerm = "";
let cart = [];

const productGrid = document.getElementById("productGrid");
const filterButtons = document.querySelectorAll(".filter-btn");
const searchInput = document.querySelector('.search-box input');
const cartPanel = document.getElementById("cartPanel");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const cartCount = document.getElementById("cartCount");
const cartToggleButton = document.querySelector(".cart-btn");
const closeCartButton = document.querySelector(".close-cart");

function formatCurrency(amount) {
  return `₦ ${amount.toLocaleString()}`;
}

function getFilteredProducts() {
  return products.filter((product) => {
    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;
    const text = `${product.name} ${product.description}`.toLowerCase();
    const matchesSearch = text.includes(searchTerm.trim().toLowerCase());

    return matchesCategory && matchesSearch;
  });
}

function renderProducts() {
  const items = getFilteredProducts();

  if (items.length === 0) {
    productGrid.innerHTML = `
      <div class="product-empty">
        <h3>No devices match your search.</h3>
        <p>Try another brand or a different keyword.</p>
      </div>
    `;
    return;
  }

  productGrid.innerHTML = items
    .map(
      (product) => `
        <article class="product-card">
          <div class="product-visual">
            <span class="product-badge">${product.stock}</span>
            <span>${product.icon}</span>
          </div>

          <h3>${product.name}</h3>
          <p>${product.description}</p>

          <div class="product-meta">
            <span class="rating">★ ${product.rating}</span>
            <span>${product.category}</span>
          </div>

          <div class="product-footer">
            <span class="product-price">${formatCurrency(product.price)}</span>
            <button class="add-btn" type="button" data-id="${product.id}">Add</button>
          </div>
        </article>
      `
    )
    .join("");

  document.querySelectorAll(".add-btn").forEach((button) => {
    button.addEventListener("click", () => {
      addToCart(Number(button.dataset.id));
    });
  });
}

function addToCart(productId) {
  const product = products.find((item) => item.id === productId);
  if (!product) return;

  const existing = cart.find((item) => item.id === productId);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  updateCart();
  cartPanel.classList.add("open");
}

function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId);
  updateCart();
}

function updateCart() {
  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="empty-cart">Your cart is empty.</p>';
    cartTotal.textContent = "₦ 0";
    cartCount.textContent = "0";
    return;
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  cartCount.textContent = String(cart.reduce((sum, item) => sum + item.quantity, 0));
  cartTotal.textContent = formatCurrency(total);

  cartItems.innerHTML = cart
    .map(
      (item) => `
        <div class="cart-item">
          <div>
            <strong>${item.name}</strong>
            <span>${item.quantity} × ${formatCurrency(item.price)}</span>
          </div>
          <button class="remove-item" type="button" data-id="${item.id}">Remove</button>
        </div>
      `
    )
    .join("");

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

cartToggleButton.addEventListener("click", () => {
  cartPanel.classList.toggle("open");
});

closeCartButton.addEventListener("click", () => {
  cartPanel.classList.remove("open");
});

renderProducts();
updateCart();
