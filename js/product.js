// ============================================
// VICTORY LITTLE ANGELS — Product Detail (Firestore)
// ============================================

let allProducts = [];

document.addEventListener("DOMContentLoaded", async () => {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    document.getElementById("productDetail").innerHTML =
      `<p style="text-align:center;padding:40px;">❌ No product selected.</p>`;
    return;
  }

  try {
    // Load current product
    const doc = await db.collection("products").doc(id).get();
    if (!doc.exists) {
      document.getElementById("productDetail").innerHTML =
        `<p style="text-align:center;padding:40px;">❌ Product not found.</p>`;
      return;
    }
    const product = { id: doc.id, ...doc.data() };

    // Load all products for related
    const snap = await db.collection("products").get();
    allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    renderProduct(product);
    renderTabs(product);
    renderRelated(product);
    setupTabSwitcher();

  } catch (e) {
    console.error(e);
    document.getElementById("productDetail").innerHTML =
      `<p style="text-align:center;padding:40px;color:#E53935;">Failed to load product.</p>`;
  }
});

/* Render main product section */
function renderProduct(p) {
  const box = document.getElementById("productDetail");

  document.getElementById("bcShop").textContent = capitalize(p.category || "Shop");
  document.getElementById("bcShop").href = `shop.html?cat=${p.category}`;
  document.getElementById("bcProduct").textContent = p.name;

  const discount = p.oldPrice
    ? Math.round((1 - p.price / p.oldPrice) * 100)
    : 0;

  const oldPriceHTML = p.oldPrice
    ? `<span class="price-old">${formatKsh(p.oldPrice)}</span>
       <span class="save-badge">Save ${discount}%</span>`
    : "";

  const stockHTML = (p.stock || 0) > 0
    ? `<div class="pd-stock">✅ In Stock (${p.stock} available)</div>`
    : `<div class="pd-stock" style="color:#E53935;">❌ Out of Stock</div>`;

  box.innerHTML = `
        <div class="pd-image">
      <div class="pd-emoji">
        ${p.image
          ? `<img src="${p.image}" alt="${p.name}" style="width:100%;height:100%;object-fit:contain;padding:20px;">`
          : p.emoji || "🛒"}
      </div>
           <div class="pd-thumbs">
        ${p.image
          ? `<div class="pd-thumb active"><img src="${p.image}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;"></div>`
          : `
            <div class="pd-thumb active">${p.emoji || "🛒"}</div>
            <div class="pd-thumb">${p.emoji || "🛒"}</div>
            <div class="pd-thumb">${p.emoji || "🛒"}</div>
            <div class="pd-thumb">${p.emoji || "🛒"}</div>
          `}
      </div>
    </div>

    <div class="pd-info">
      <span class="product-cat">${p.category}</span>
      <h1>${p.name}</h1>

      <div class="pd-rating">
        ${"⭐".repeat(p.rating || 5)}
        <span class="muted">(${p.sold || 0} sold)</span>
      </div>

      <div class="pd-price">
        <span class="pd-price-new">${formatKsh(p.price)}</span>
        ${oldPriceHTML}
      </div>

      <p class="pd-desc">${p.description || "Quality product from Victory Little Angels. Loved by parents across Kenya."}</p>

      ${stockHTML}

      <div class="pd-qty-row">
        <label>Quantity:</label>
        <div class="pd-qty">
          <button class="qty-btn" id="qtyMinus">−</button>
          <span id="qtyVal">1</span>
          <button class="qty-btn" id="qtyPlus">+</button>
        </div>
      </div>

      <div class="pd-actions">
        <button class="btn btn-outline" id="addToCartPD">Add to Cart 🛒</button>
        <button class="btn btn-primary" id="buyNowPD">Buy Now ⚡</button>
      </div>

      <div class="pd-meta">
        <div>🚚 <strong>Free delivery</strong> on orders above Ksh 2,000</div>
        <div>↩️ <strong>7-day returns</strong> on eligible items</div>
        <div>🔒 <strong>Secure payment</strong> — M-Pesa, Card, COD</div>
      </div>
    </div>
  `;

  let qty = 1;
  const qtyVal = document.getElementById("qtyVal");
  document.getElementById("qtyMinus").onclick = () => {
    qty = Math.max(1, qty - 1);
    qtyVal.textContent = qty;
  };
  document.getElementById("qtyPlus").onclick = () => {
    const max = Math.min(20, p.stock || 20);
    qty = Math.min(max, qty + 1);
    qtyVal.textContent = qty;
  };

  document.getElementById("addToCartPD").onclick = () => {
    if ((p.stock || 0) <= 0) return showToast("❌ Out of stock");
    for (let i = 0; i < qty; i++) {
      addToCart({ id: p.id, name: p.name, price: p.price, emoji: p.emoji || "🛒" });
    }
  };

  document.getElementById("buyNowPD").onclick = () => {
    if ((p.stock || 0) <= 0) return showToast("❌ Out of stock");
    for (let i = 0; i < qty; i++) {
      addToCart({ id: p.id, name: p.name, price: p.price, emoji: p.emoji || "🛒" });
    }
    window.location.href = "checkout.html";
  };
}

/* Tabs */
function renderTabs(p) {
  document.getElementById("panel-desc").innerHTML = `
    <h3>About this product</h3>
    <p>${p.description || p.name + " is a top-quality product available at Victory Little Angels."}</p>
    <ul style="margin-top:14px;padding-left:20px;line-height:1.8;">
      <li>Category: ${capitalize(p.category)}</li>
      <li>Premium quality materials</li>
      <li>Safe for babies</li>
      <li>Fast nationwide delivery</li>
    </ul>
  `;

  document.getElementById("panel-reviews").innerHTML = `
    <h3>Customer Reviews</h3>
    <p class="muted">Average rating: ${"⭐".repeat(p.rating || 5)} (${p.sold || 0} sold)</p>
    <div style="margin-top:20px;">
      <div class="review">
        <strong>Wanjiru M.</strong> ${"⭐".repeat(p.rating || 5)}
        <p>Amazing quality! My baby loves it. Delivery was fast too. Highly recommend!</p>
      </div>
      <div class="review">
        <strong>Aisha K.</strong> ⭐⭐⭐⭐⭐
        <p>Worth every shilling. Will definitely buy again from Victory Little Angels.</p>
      </div>
    </div>
  `;

  document.getElementById("panel-delivery").innerHTML = `
    <h3>Delivery & Returns</h3>
    <p><strong>Delivery Time:</strong> 1-3 business days within Nairobi, 2-5 days countrywide.</p>
    <p style="margin-top:10px;"><strong>Delivery Fee:</strong> Ksh 250 within Kenya. FREE for orders above Ksh 2,000.</p>
    <p style="margin-top:10px;"><strong>Returns:</strong> 7-day return policy for unused items in original packaging.</p>
  `;
}

/* Related products */
function renderRelated(p) {
  const related = allProducts
    .filter(x => x.category === p.category && x.id !== p.id)
    .slice(0, 4);

  const fallback = related.length ? related : allProducts.slice(0, 4);
  const grid = document.getElementById("relatedGrid");

  grid.innerHTML = fallback.map(r => `
    <a href="product.html?id=${r.id}" class="product-card" style="text-decoration:none;">
      <div class="product-img">
        <div class="img-placeholder">${r.emoji || "🛒"}</div>
      </div>
      <div class="product-info">
        <span class="product-cat">${r.category}</span>
        <h3 class="product-name">${r.name}</h3>
        <div class="product-price">
          <span class="price-new">${formatKsh(r.price)}</span>
        </div>
      </div>
    </a>
  `).join("");
}

/* Tab switcher */
function setupTabSwitcher() {
  const tabs = document.querySelectorAll(".p-tab");
  const panels = document.querySelectorAll(".p-panel");
  tabs.forEach(t => {
    t.addEventListener("click", () => {
      tabs.forEach(x => x.classList.remove("active"));
      panels.forEach(x => x.classList.remove("active"));
      t.classList.add("active");
      document.getElementById("panel-" + t.dataset.tab).classList.add("active");
    });
  });
}

function capitalize(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}