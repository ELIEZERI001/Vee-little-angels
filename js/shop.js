// ============================================
// VICTORY LITTLE ANGELS — Shop Page (Firestore)
// ============================================

// Products loaded from Firestore
let PRODUCTS = [];

const state = {
  category: "",
  minPrice: 0,
  maxPrice: Infinity,
  sort: "popular",
  search: ""
};

document.addEventListener("DOMContentLoaded", async () => {
  readURLParams();
  setupFilters();
  await loadProductsFromFirestore();
  renderProducts();
});

/* Read URL params (?cat=, ?q=) */
function readURLParams() {
  const params = new URLSearchParams(window.location.search);

  const cat = params.get("cat");
  if (cat) {
    state.category = cat;
    const radio = document.querySelector(`input[name="cat"][value="${cat}"]`);
    if (radio) radio.checked = true;
  }

  const q = params.get("q");
  if (q) {
    state.search = q.toLowerCase();
    const searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.value = q;
  }
}

/* Load products from Firestore */
async function loadProductsFromFirestore() {
  const grid = document.getElementById("shopGrid");
  grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;padding:40px;color:#888;">Loading products...</p>`;

  try {
    const snap = await db.collection("products").get();

    PRODUCTS = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    // Sort by sold (for "popular") — falls back to created date
    PRODUCTS.sort((a, b) => (b.sold || 0) - (a.sold || 0));

  } catch (e) {
    console.error("Failed to load products:", e);
    grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;padding:40px;color:#E53935;">Failed to load products. Please refresh.</p>`;
  }
}

/* Setup filter controls */
function setupFilters() {
  document.querySelectorAll('input[name="cat"]').forEach(r => {
    r.addEventListener("change", e => {
      state.category = e.target.value;
      renderProducts();
    });
  });

  document.getElementById("applyPrice").addEventListener("click", () => {
    const min = document.getElementById("minPrice").value;
    const max = document.getElementById("maxPrice").value;
    state.minPrice = min ? parseInt(min) : 0;
    state.maxPrice = max ? parseInt(max) : Infinity;
    renderProducts();
  });

  document.getElementById("sortSelect").addEventListener("change", e => {
    state.sort = e.target.value;
    renderProducts();
  });

  document.getElementById("resetFilters").addEventListener("click", () => {
    state.category = "";
    state.minPrice = 0;
    state.maxPrice = Infinity;
    state.sort = "popular";
    state.search = "";

    document.querySelector('input[name="cat"][value=""]').checked = true;
    document.getElementById("minPrice").value = "";
    document.getElementById("maxPrice").value = "";
    document.getElementById("sortSelect").value = "popular";
    renderProducts();
  });
}

/* Filter + sort */
function getFilteredProducts() {
  let list = [...PRODUCTS];

  if (state.category) list = list.filter(p => p.category === state.category);
  list = list.filter(p => p.price >= state.minPrice && p.price <= state.maxPrice);

  if (state.search) {
    list = list.filter(p => (p.name || "").toLowerCase().includes(state.search));
  }

  switch (state.sort) {
    case "price-asc": list.sort((a, b) => a.price - b.price); break;
    case "price-desc": list.sort((a, b) => b.price - a.price); break;
    case "name-asc": list.sort((a, b) => (a.name || "").localeCompare(b.name || "")); break;
    default: list.sort((a, b) => (b.sold || 0) - (a.sold || 0));
  }

  return list;
}

/* Render grid */
function renderProducts() {
  const grid = document.getElementById("shopGrid");
  const count = document.getElementById("resultCount");
  const list = getFilteredProducts();

  count.textContent = `${list.length} product${list.length === 1 ? "" : "s"} found`;

  if (list.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align:center; padding:60px 20px;">
        <div style="font-size:60px;">🔍</div>
        <h3>No products found</h3>
        <p style="color:#888;margin-top:8px;">Try different filters or search terms.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = list.map(p => {
    const stars = "⭐".repeat(p.rating || 5);
    const badgeHTML = p.badge
      ? `<span class="badge badge-${p.badge}">${
          p.badge === "sale" && p.oldPrice
            ? "-" + Math.round((1 - p.price / p.oldPrice) * 100) + "%"
          : p.badge === "new" ? "NEW"
          : "🔥 HOT"
        }</span>`
      : (p.oldPrice
          ? `<span class="badge badge-sale">-${Math.round((1 - p.price / p.oldPrice) * 100)}%</span>`
          : "");
    const oldPriceHTML = p.oldPrice
      ? `<span class="price-old">${formatKsh(p.oldPrice)}</span>`
      : "";

    return `
      <div class="product-card">
        <div class="product-img">
          ${badgeHTML}
          <a href="product.html?id=${p.id}" class="img-link">
                        <div class="img-placeholder">
              ${p.image
                ? `<img src="${p.image}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">`
                : p.emoji || "🛒"}
            </div>
          </a>
          <button class="wishlist-btn">♡</button>
        </div>
        <div class="product-info">
          <span class="product-cat">${p.category}</span>
          <a href="product.html?id=${p.id}" class="name-link">
            <h3 class="product-name">${p.name}</h3>
          </a>
          <div class="product-rating">${stars} <span>(${p.sold || 0})</span></div>
          <div class="product-price">
            <span class="price-new">${formatKsh(p.price)}</span>
            ${oldPriceHTML}
          </div>
          <button class="btn btn-primary add-cart-btn" data-id="${p.id}">Add to Cart 🛒</button>
        </div>
      </div>
    `;
  }).join("");

  bindAddToCart();
}

/* Bind add-to-cart */
function bindAddToCart() {
  document.querySelectorAll(".add-cart-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const id = btn.dataset.id;
      const product = PRODUCTS.find(p => p.id === id);
      if (!product) return;

      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        emoji: product.emoji || "🛒"
      });
    });
  });
}