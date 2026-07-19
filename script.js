// ---------- Product data ----------
// In a real capstone this would come from an API; kept local here to keep the
// project scoped and avoid a backend for a front-end focused assignment.
const BOOKS = [
    { id: 1, title: "The Silent Orchard", author: "Mara Quinn", category: "Fiction", price: 14.99, seed: "orchard" },
    { id: 2, title: "Atoms & Ideas", author: "D. Fenwick", category: "Non-Fiction", price: 19.5, seed: "atoms" },
    { id: 3, title: "Midnight Ledger", author: "R. Costa", category: "Mystery", price: 12.0, seed: "ledger" },
    { id: 4, title: "The Long Coastline", author: "Aiko Tanaka", category: "Fiction", price: 16.25, seed: "coast" },
    { id: 5, title: "Minds at Work", author: "S. Okoye", category: "Non-Fiction", price: 22.0, seed: "minds" },
    { id: 6, title: "Glass Horizon", author: "P. Herrera", category: "Sci-Fi", price: 15.75, seed: "glass" },
    { id: 7, title: "A Quiet Reckoning", author: "Mara Quinn", category: "Mystery", price: 13.4, seed: "reckon" },
    { id: 8, title: "Fields of Static", author: "J. Marchetti", category: "Sci-Fi", price: 17.0, seed: "fields" },
    { id: 9, title: "The Kitchen Almanac", author: "L. Bergström", category: "Non-Fiction", price: 24.9, seed: "kitchen" },
    { id: 10, title: "Paper Boats", author: "Aiko Tanaka", category: "Fiction", price: 11.5, seed: "paper" },
];

const CART_KEY = "bookstore_cart";

// ---------- State ----------
let activeCategory = "All";
let searchTerm = "";
let cart = JSON.parse(localStorage.getItem(CART_KEY) || "{}"); // { bookId: qty }

// ---------- Elements ----------
const productGrid = document.getElementById("productGrid");
const filtersEl = document.getElementById("filters");
const noResults = document.getElementById("noResults");
const searchInput = document.getElementById("searchInput");
const cartCount = document.getElementById("cartCount");
const cartItemsEl = document.getElementById("cartItems");
const cartTotalEl = document.getElementById("cartTotal");
const cartDrawer = document.getElementById("cartDrawer");
const overlay = document.getElementById("overlay");

// ---------- Render filters ----------
function renderFilters() {
    const categories = ["All", ...new Set(BOOKS.map(b => b.category))];
    filtersEl.innerHTML = categories.map(cat => `
    <button class="filter-btn ${cat === activeCategory ? "active" : ""}" data-cat="${cat}">
      ${cat}
    </button>
  `).join("");

    filtersEl.querySelectorAll(".filter-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            activeCategory = btn.dataset.cat;
            renderFilters();
            renderProducts();
        });
    });
}

// ---------- Render products ----------
function renderProducts() {
    const filtered = BOOKS.filter(b => {
        const matchesCategory = activeCategory === "All" || b.category === activeCategory;
        const matchesSearch =
            b.title.toLowerCase().includes(searchTerm) ||
            b.author.toLowerCase().includes(searchTerm);
        return matchesCategory && matchesSearch;
    });

    noResults.hidden = filtered.length !== 0;

    // loading="lazy" on <img> defers offscreen image requests — a real
    // performance win when a catalog grows beyond a handful of products.
    productGrid.innerHTML = filtered.map(b => `
    <article class="card">
      <img src="https://picsum.photos/seed/${b.seed}/300/400" alt="Cover of ${b.title}" loading="lazy" width="300" height="400">
      <div class="card-body">
        <div class="card-category">${b.category}</div>
        <h3 class="card-title">${b.title}</h3>
        <p class="card-author">by ${b.author}</p>
        <div class="card-footer">
          <span class="card-price">$${b.price.toFixed(2)}</span>
          <button class="add-btn" data-id="${b.id}">Add to cart</button>
        </div>
      </div>
    </article>
  `).join("");

    productGrid.querySelectorAll(".add-btn").forEach(btn => {
        btn.addEventListener("click", () => addToCart(Number(btn.dataset.id)));
    });
}

// ---------- Cart logic ----------
function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(id) {
    cart[id] = (cart[id] || 0) + 1;
    saveCart();
    renderCart();
    openCart();
}

function changeQty(id, delta) {
    cart[id] = (cart[id] || 0) + delta;
    if (cart[id] <= 0) delete cart[id];
    saveCart();
    renderCart();
}

function renderCart() {
    const entries = Object.entries(cart);
    const totalItems = entries.reduce((sum, [, qty]) => sum + qty, 0);
    cartCount.textContent = totalItems;

    if (entries.length === 0) {
        cartItemsEl.innerHTML = `<p class="empty-cart-msg">Your cart is empty.</p>`;
        cartTotalEl.textContent = "$0.00";
        return;
    }

    let total = 0;
    cartItemsEl.innerHTML = entries.map(([id, qty]) => {
        const book = BOOKS.find(b => b.id === Number(id));
        const lineTotal = book.price * qty;
        total += lineTotal;
        return `
      <div class="cart-item">
        <div>
          <div class="cart-item-name">${book.title}</div>
          <div class="cart-item-meta">$${book.price.toFixed(2)} × ${qty}</div>
        </div>
        <div class="qty-controls">
          <button data-id="${book.id}" data-delta="-1" aria-label="Decrease quantity">−</button>
          <span>${qty}</span>
          <button data-id="${book.id}" data-delta="1" aria-label="Increase quantity">+</button>
        </div>
      </div>
    `;
    }).join("");

    cartTotalEl.textContent = `$${total.toFixed(2)}`;

    cartItemsEl.querySelectorAll(".qty-controls button").forEach(btn => {
        btn.addEventListener("click", () =>
            changeQty(Number(btn.dataset.id), Number(btn.dataset.delta))
        );
    });
}

// ---------- Drawer open/close ----------
function openCart() {
    cartDrawer.classList.add("open");
    overlay.classList.add("show");
    cartDrawer.setAttribute("aria-hidden", "false");
}
function closeCart() {
    cartDrawer.classList.remove("open");
    overlay.classList.remove("show");
    cartDrawer.setAttribute("aria-hidden", "true");
}

document.getElementById("cartToggle").addEventListener("click", openCart);
document.getElementById("closeCart").addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);

document.getElementById("checkoutBtn").addEventListener("click", () => {
    if (Object.keys(cart).length === 0) return;
    alert("This is a demo checkout — no real payment is processed.");
    cart = {};
    saveCart();
    renderCart();
    closeCart();
});

// ---------- Search (debounced to avoid re-rendering on every keystroke) ----------
let debounceTimer;
searchInput.addEventListener("input", (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        searchTerm = e.target.value.trim().toLowerCase();
        renderProducts();
    }, 200);
});

// ---------- Init ----------
renderFilters();
renderProducts();
renderCart();