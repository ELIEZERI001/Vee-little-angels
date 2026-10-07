// ============================================
// VICTORY LITTLE ANGELS — Account Dashboard
// ============================================

document.addEventListener("DOMContentLoaded", () => {
  setupTabs();
  setupLogout();
  checkSuccessBanner();

  // Watch auth state
  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    loadUserProfile(user);
    loadOrders(user.uid);
  });
});

/* ===== TABS ===== */
function setupTabs() {
  const tabs = document.querySelectorAll(".acc-tab");
  const panels = document.querySelectorAll(".acc-panel");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      panels.forEach(p => p.classList.remove("active"));

      tab.classList.add("active");
      document.getElementById("panel-" + tab.dataset.panel).classList.add("active");
    });
  });
}

/* ===== LOGOUT ===== */
function setupLogout() {
  const btn = document.getElementById("logoutBtn");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    await auth.signOut();
    showToast("👋 Logged out");
    setTimeout(() => window.location.href = "index.html", 700);
  });
}

/* ===== SUCCESS BANNER (after checkout) ===== */
function checkSuccessBanner() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("success") === "1") {
    document.getElementById("successBanner").style.display = "block";
  }
}

/* ===== LOAD PROFILE ===== */
async function loadUserProfile(user) {
  try {
    const doc = await db.collection("users").doc(user.uid).get();

    const data = doc.exists ? doc.data() : {};
    const name = data.name || user.email.split("@")[0];
    const email = user.email;
    const phone = data.phone || "--";

    // Header
    document.getElementById("userName").textContent = "Hi, " + name + " 👋";
    document.getElementById("userEmail").textContent = email;
    document.getElementById("userPhone").textContent = phone;
    document.getElementById("userAvatar").textContent = name.charAt(0).toUpperCase();

    // Profile tab
    document.getElementById("pName").textContent = name;
    document.getElementById("pEmail").textContent = email;
    document.getElementById("pPhone").textContent = phone;

  } catch (err) {
    console.error("Profile load error:", err);
  }
}

/* ===== LOAD ORDERS ===== */
async function loadOrders(uid) {
  const list = document.getElementById("ordersList");
  try {
    const snap = await db.collection("orders")
      .where("customer.email", "==", auth.currentUser.email)
      .orderBy("createdAt", "desc")
      .get();

    if (snap.empty) {
      list.innerHTML = `
        <div class="empty-orders">
          <div style="font-size:60px;">📦</div>
          <h3>No orders yet</h3>
          <p class="muted">Start shopping and your orders will appear here.</p>
          <a href="shop.html" class="btn btn-primary" style="margin-top:16px;">Shop Now</a>
        </div>
      `;
      return;
    }

    list.innerHTML = snap.docs.map(doc => {
      const o = doc.data();
      const date = o.createdAt?.toDate?.().toLocaleDateString("en-KE", {
        day: "numeric", month: "short", year: "numeric"
      }) || "Just now";

      const items = o.items.map(it =>
        `<span class="order-chip">${it.emoji || "🛒"} ${it.name} ×${it.qty}</span>`
      ).join("");

      return `
        <div class="order-card">
          <div class="order-top">
            <div>
              <span class="order-id">#${doc.id.slice(0,8).toUpperCase()}</span>
              <span class="order-date">${date}</span>
            </div>
            <span class="order-status status-${o.status}">${o.status}</span>
          </div>
          <div class="order-items-list">${items}</div>
          <div class="order-bottom">
            <span>Payment: <strong>${o.payment.toUpperCase()}</strong></span>
            <span class="order-total">Total: ${formatKsh(o.total)}</span>
          </div>
        </div>
      `;
    }).join("");

  } catch (err) {
    console.error("Orders load error:", err);
    list.innerHTML = `<p class="muted">Could not load orders. Please refresh.</p>`;
  }
}