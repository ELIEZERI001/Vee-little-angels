// ============================================
// VICTORY LITTLE ANGELS — Homepage (Firestore)
// ============================================

document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("featuredGrid");
  if (!grid) return;

  grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;padding:40px;color:#888;">Loading products...</p>`;

  try {
    const snap = await db.collection("products").limit(8).get();

    if (snap.empty) {
      grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;padding:40px;color:#888;">No products yet. Check back soon!</p>`;
      return;
    }

    const products = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    grid.innerHTML = products.map(p => {
      const stars = "⭐".repeat(p.rating || 5);
      const badgeHTML = p.oldPrice
        ? `<span class="badge badge-sale">-${Math.round((1 - p.price / p.oldPrice) * 100)}%</span>`
        : "";
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

    // Bind add-to-cart
    grid.querySelectorAll(".add-cart-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const id = btn.dataset.id;
        const product = products.find(x => x.id === id);
        if (!product) return;
        addToCart({
          id: product.id,
          name: product.name,
          price: product.price,
          emoji: product.emoji || "🛒"
        });
      });
    });

  } catch (e) {
    console.error("Homepage products error:", e);
    grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;padding:40px;color:#E53935;">Failed to load products.</p>`;
  }
});