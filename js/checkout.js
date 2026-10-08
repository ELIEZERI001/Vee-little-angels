// ============================================
// VICTORY LITTLE ANGELS — Checkout Logic
// ============================================

const DELIVERY_FEE = 250;
const FREE_DELIVERY_MIN = 2000;

document.addEventListener("DOMContentLoaded", () => {
  renderOrderSummary();
  setupPlaceOrder();
  prefillUserInfo();
});

function prefillUserInfo() {
  auth.onAuthStateChanged(user => {
    if (user && user.email) {
      const emailField = document.getElementById("email");
      if (emailField && !emailField.value) {
        emailField.value = user.email;
      }
    }
  });
}

/* Render order summary on the right */
function renderOrderSummary() {
  const cart = getCart();
  const itemsBox = document.getElementById("orderItems");

  if (cart.length === 0) {
    itemsBox.innerHTML = `<p style="color:#888;text-align:center;padding:20px 0;">Cart is empty</p>`;
  } else {
    itemsBox.innerHTML = cart.map(item => `
      <div class="order-item">
        <span class="order-emoji">${item.emoji || "🛒"}</span>
        <span class="order-name">${item.name}</span>
        <span class="order-qty">×${item.qty}</span>
        <span class="order-price">${formatKsh(item.price * item.qty)}</span>
      </div>
    `).join("");
  }

  const subtotal = getCartSubtotal();
  const delivery = subtotal === 0 ? 0
                  : subtotal >= FREE_DELIVERY_MIN ? 0
                  : DELIVERY_FEE;
  const total = subtotal + delivery;

  document.getElementById("subtotal").textContent = formatKsh(subtotal);
  document.getElementById("delivery").textContent =
    delivery === 0 && subtotal > 0 ? "FREE 🎉" : formatKsh(delivery);
  document.getElementById("total").textContent = formatKsh(total);
}

/* Handle place order button */
function setupPlaceOrder() {
  const btn = document.getElementById("placeOrderBtn");
  btn.addEventListener("click", async (e) => {
    e.preventDefault();

    const cart = getCart();
    if (cart.length === 0) {
      showToast("❌ Your cart is empty");
      return;
    }

    // Validate form
    const form = document.getElementById("checkoutForm");
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Gather data
    const order = {
      customer: {
        name: document.getElementById("fullName").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        email: document.getElementById("email").value.trim() || null,
        county: document.getElementById("county").value,
        town: document.getElementById("town").value.trim(),
        address: document.getElementById("address").value.trim()
      },
      payment: document.querySelector('input[name="payment"]:checked').value,
      items: cart,
      subtotal: getCartSubtotal(),
      delivery: getCartSubtotal() >= FREE_DELIVERY_MIN ? 0 : DELIVERY_FEE,
      total: getCartSubtotal() + (getCartSubtotal() >= FREE_DELIVERY_MIN ? 0 : DELIVERY_FEE),
      status: "pending",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Loading state
    btn.disabled = true;
    btn.textContent = "Placing order...";

    try {
      const docRef = await db.collection("orders").add(order);
      console.log("✅ Order placed:", docRef.id);

      // Save order ID for confirmation
      localStorage.setItem("vla_last_order", docRef.id);

      // Clear cart
      clearCart();

      // Redirect to confirmation
      window.location.href = `account.html?order=${docRef.id}&success=1`;

    } catch (err) {
      console.error("❌ Order failed:", err);
      showToast("❌ Failed to place order. Try again.");
      btn.disabled = false;
      btn.textContent = "Place Order ✅";
    }
  });
}