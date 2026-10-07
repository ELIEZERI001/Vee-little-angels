// ============================================
// VICTORY LITTLE ANGELS — Cart Page Logic
// ============================================

const DELIVERY_FEE = 250;
const FREE_DELIVERY_MIN = 2000;

document.addEventListener("DOMContentLoaded", () => {
  renderCart();
});

function renderCart() {
  const cart = getCart();
  const itemsBox = document.getElementById("cartItems");

  // Empty cart
  if (cart.length === 0) {
    itemsBox.innerHTML = `
      <div class="empty-cart">
        <div class="empty-emoji">🛒</div>
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added anything yet.</p>
        <a href="shop.html" class="btn btn-primary">Start Shopping</a>
      </div>
    `;
    updateSummary(0);
    return;
  }

  // Build items
  itemsBox.innerHTML = cart.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <div class="cart-item-img">${item.emoji || "🛒"}</div>

      <div class="cart-item-info">
        <h3>${item.name}</h3>
        <p class="cart-item-price">${formatKsh(item.price)}</p>
      </div>

      <div class="cart-item-qty">
        <button class="qty-btn" onclick="changeQty('${item.id}', -1)">−</button>
        <span>${item.qty}</span>
        <button class="qty-btn" onclick="changeQty('${item.id}', 1)">+</button>
      </div>

      <div class="cart-item-total">
        ${formatKsh(item.price * item.qty)}
      </div>

      <button class="remove-btn" onclick="removeItem('${item.id}')">✕</button>
    </div>
  `).join("");

  updateSummary(getCartSubtotal());
}

function changeQty(id, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (!item) return;

  const newQty = item.qty + delta;
  updateQty(id, newQty);
  renderCart();
}

function removeItem(id) {
  removeFromCart(id);
  renderCart();
  showToast("🗑️ Item removed");
}

function updateSummary(subtotal) {
  const delivery = subtotal === 0 ? 0
                  : subtotal >= FREE_DELIVERY_MIN ? 0
                  : DELIVERY_FEE;
  const total = subtotal + delivery;

  document.getElementById("subtotal").textContent = formatKsh(subtotal);
  document.getElementById("delivery").textContent =
    delivery === 0 && subtotal > 0 ? "FREE 🎉" : formatKsh(delivery);
  document.getElementById("total").textContent = formatKsh(total);

  // Disable checkout if empty
  const checkoutBtn = document.getElementById("checkoutBtn");
  if (subtotal === 0) {
    checkoutBtn.style.pointerEvents = "none";
    checkoutBtn.style.opacity = "0.5";
  } else {
    checkoutBtn.style.pointerEvents = "auto";
    checkoutBtn.style.opacity = "1";
  }
}