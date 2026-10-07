// ============================================
// VICTORY LITTLE ANGELS — Cart System
// ============================================

const CART_KEY = "vla_cart";

/* Get cart from localStorage */
function getCart() {
  const cart = localStorage.getItem(CART_KEY);
  return cart ? JSON.parse(cart) : [];
}

/* Save cart to localStorage */
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

/* Add item to cart */
function addToCart(product) {
  const cart = getCart();
  const existing = cart.find(item => item.id === product.id);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image || "",
      emoji: product.emoji || "🛒",
      qty: 1
    });
  }

  saveCart(cart);
  showToast(`✅ ${product.name} added to cart!`);
}

/* Remove item from cart */
function removeFromCart(id) {
  const cart = getCart().filter(item => item.id !== id);
  saveCart(cart);
}

/* Update quantity */
function updateQty(id, qty) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (!item) return;

  if (qty <= 0) {
    removeFromCart(id);
    return;
  }
  item.qty = qty;
  saveCart(cart);
}

/* Get total number of items */
function getCartTotalItems() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

/* Get cart subtotal */
function getCartSubtotal() {
  return getCart().reduce((sum, item) => sum + (item.price * item.qty), 0);
}

/* Update cart count badge in navbar */
function updateCartCount() {
  const badge = document.getElementById("cartCount");
  if (badge) {
    badge.textContent = getCartTotalItems();
  }
}

/* Clear entire cart */
function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartCount();
}

/* ===== TOAST NOTIFICATION ===== */
function showToast(message) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}