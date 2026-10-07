// ============================================
// VICTORY LITTLE ANGELS — Global Scripts
// ============================================

/* Run when page loads */
document.addEventListener("DOMContentLoaded", () => {

  // Update cart badge on every page load
  updateCartCount();

  // ===== ADD TO CART BUTTONS =====
  document.querySelectorAll(".add-cart-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();

      const id = btn.dataset.id;
      const card = btn.closest(".product-card");

      if (!card) return;

      const product = {
        id: id,
        name: card.querySelector(".product-name").textContent.trim(),
        price: parsePrice(card.querySelector(".price-new").textContent),
        emoji: card.querySelector(".img-placeholder")?.textContent.trim() || "🛒"
      };

      addToCart(product);
    });
  });

  // ===== SEARCH =====
  const searchBtn = document.getElementById("searchBtn");
  const searchInput = document.getElementById("searchInput");

  if (searchBtn && searchInput) {
    searchBtn.addEventListener("click", () => {
      const q = searchInput.value.trim();
      if (q) window.location.href = `shop.html?q=${encodeURIComponent(q)}`;
    });

    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const q = searchInput.value.trim();
        if (q) window.location.href = `shop.html?q=${encodeURIComponent(q)}`;
      }
    });
  }

});

/* Convert "Ksh 1,500" → 1500 */
function parsePrice(str) {
  return parseInt(str.replace(/[^0-9]/g, "")) || 0;
}

/* Format number to Ksh */
function formatKsh(num) {
  return "Ksh " + num.toLocaleString("en-KE");
}