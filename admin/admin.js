// ============================================
// VICTORY LITTLE ANGELS — Admin Panel (Complete)
// ============================================

let currentUser = null;
let editingProductId = null;

/* ===== LOGIN GATE ===== */
document.getElementById("gateBtn").addEventListener("click", async () => {
  const email = document.getElementById("gateEmail").value.trim();
  const pass = document.getElementById("gatePassword").value;
  const err = document.getElementById("gateErr");
  err.textContent = "";

  try {
    await auth.signInWithEmailAndPassword(email, pass);
  } catch (e) {
    err.textContent = "Wrong email or password.";
  }
});

/* ===== AUTH STATE ===== */
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    document.getElementById("gate").style.display = "flex";
    document.getElementById("adminWrap").classList.remove("show");
    currentUser = null;
    return;
  }

  try {
    const adminDoc = await db.collection("admins").doc(user.uid).get();
    if (!adminDoc.exists) {
      document.getElementById("gateErr").textContent =
        "❌ You are not an admin. Contact the site owner.";
      await auth.signOut();
      return;
    }

    currentUser = user;
    document.getElementById("adminEmail").textContent = user.email;
    document.getElementById("gate").style.display = "none";
    document.getElementById("adminWrap").classList.add("show");

    initAdmin();

  } catch (e) {
    console.error(e);
    document.getElementById("gateErr").textContent = "Error checking admin status.";
  }
});

/* ===== LOGOUT ===== */
document.getElementById("adminLogout").addEventListener("click", async () => {
  await auth.signOut();
  location.reload();
});

/* ===== INIT ===== */
function initAdmin() {
  setupTabs();
  loadDashboard();
  loadProducts();
  loadOrders();
  loadMessages();
  setupProductForm();
}

/* ===== TABS ===== */
function setupTabs() {
  const tabs = document.querySelectorAll(".admin-tab");
  const panels = document.querySelectorAll(".admin-panel");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      panels.forEach(p => p.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById("panel-" + tab.dataset.tab).classList.add("active");
    });
  });
}

/* ===== HELPERS ===== */
function formatKsh(num) {
  return "Ksh " + Number(num || 0).toLocaleString("en-KE");
}

function sortByCreatedDesc(arr) {
  return arr.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

/* ===== DASHBOARD ===== */
async function loadDashboard() {
  try {
    const productsSnap = await db.collection("products").get();
    const ordersSnap = await db.collection("orders").get();
    const messagesSnap = await db.collection("messages").get();

    document.getElementById("statProducts").textContent = productsSnap.size;
    document.getElementById("statOrders").textContent = ordersSnap.size;
    document.getElementById("statMessages").textContent = messagesSnap.size;

    let revenue = 0;
    ordersSnap.forEach(d => { revenue += d.data().total || 0; });
    document.getElementById("statRevenue").textContent = formatKsh(revenue);

    // Recent orders
    const recent = sortByCreatedDesc(
      ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    ).slice(0, 5);

    const box = document.getElementById("recentOrders");
    if (recent.length === 0) {
      box.innerHTML = `<p style="color:#888;">No orders yet.</p>`;
    } else {
      box.innerHTML = recent.map(o => `
        <div style="padding:10px 0;border-bottom:1px solid #eee;font-size:13px;">
          <strong>#${o.id.slice(0,8).toUpperCase()}</strong>
          — ${o.customer?.name || "Unknown"} — ${formatKsh(o.total)}
          <span class="status-pill status-${o.status}" style="margin-left:8px;">${o.status}</span>
        </div>
      `).join("");
    }

  } catch (e) {
    console.error("Dashboard error:", e);
  }
}

/* ===== PRODUCTS LIST ===== */
async function loadProducts() {
  const box = document.getElementById("adminProductsList");
  try {
    const snap = await db.collection("products").get();

    if (snap.empty) {
      box.innerHTML = `<p style="color:#888;">No products yet. Add your first one!</p>`;
      return;
    }

    const products = sortByCreatedDesc(
      snap.docs.map(d => ({ id: d.id, ...d.data() }))
    );

    box.innerHTML = products.map(p => `
      <div class="admin-list-item">
        <div class="list-emoji">${p.emoji || "🛒"}</div>
        <div class="list-info">
          <h4>${p.name}</h4>
          <p>${p.category} • Stock: ${p.stock || 0}</p>
        </div>
        <div class="list-price">${formatKsh(p.price)}</div>
        <div class="list-actions">
          <button class="adm-btn small secondary" onclick="editProduct('${p.id}')">Edit</button>
          <button class="adm-btn small danger" onclick="deleteProduct('${p.id}')">Del</button>
        </div>
      </div>
    `).join("");

  } catch (e) {
    console.error(e);
    box.innerHTML = `<p style="color:#E53935;">Failed to load. Make sure Firestore rules are set.</p>`;
  }
}

/* ===== PRODUCT FORM ===== */
function setupProductForm() {
  const urlInput = document.getElementById("pImage");
  const previewBox = document.getElementById("imagePreview");
  const previewImg = document.getElementById("previewImg");

  // Preview image when URL is pasted
  urlInput.addEventListener("input", () => {
    const url = urlInput.value.trim();
    if (url) {
      previewImg.src = url;
      previewBox.style.display = "block";
      previewImg.onerror = () => { previewBox.style.display = "none"; };
      previewImg.onload = () => { previewBox.style.display = "block"; };
    } else {
      previewBox.style.display = "none";
    }
  });

  document.getElementById("productForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      name: document.getElementById("pName").value.trim(),
      category: document.getElementById("pCategory").value,
      price: parseInt(document.getElementById("pPrice").value),
      oldPrice: parseInt(document.getElementById("pOldPrice").value) || null,
      emoji: document.getElementById("pEmoji").value.trim() || "🛒",
      stock: parseInt(document.getElementById("pStock").value) || 0,
      image: document.getElementById("pImage").value.trim() || null,
      description: document.getElementById("pDesc").value.trim() || ""
    };

    const btn = document.getElementById("saveProductBtn");
    btn.disabled = true;
    btn.textContent = "Saving...";

    try {
      if (editingProductId) {
        await db.collection("products").doc(editingProductId).update(data);
        alert("✅ Product updated!");
        resetProductForm();
      } else {
        data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection("products").add(data);
        alert("✅ Product added!");
        document.getElementById("productForm").reset();
        document.getElementById("imagePreview").style.display = "none";
      }
      loadProducts();
      loadDashboard();

    } catch (e) {
      console.error(e);
      alert("❌ Save failed: " + e.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "Save Product";
    }
  });

  document.getElementById("cancelEditBtn").addEventListener("click", resetProductForm);
}

async function editProduct(id) {
  try {
    const doc = await db.collection("products").doc(id).get();
    if (!doc.exists) return;
    const p = doc.data();

    editingProductId = id;
    document.getElementById("productFormTitle").textContent = "Edit Product";
    document.getElementById("pId").value = id;
    document.getElementById("pName").value = p.name || "";
    document.getElementById("pCategory").value = p.category || "";
    document.getElementById("pPrice").value = p.price || "";
    document.getElementById("pOldPrice").value = p.oldPrice || "";
    document.getElementById("pEmoji").value = p.emoji || "";
    document.getElementById("pStock").value = p.stock || 0;
    document.getElementById("pImage").value = p.image || "";
        const previewBox = document.getElementById("imagePreview");
    const previewImg = document.getElementById("previewImg");
    if (p.image) {
      previewImg.src = p.image;
      previewBox.style.display = "block";
    } else {
      previewBox.style.display = "none";
    }
    document.getElementById("pDesc").value = p.description || "";

    document.getElementById("cancelEditBtn").style.display = "inline-block";

    document.querySelector('.admin-tab[data-tab="add-product"]').click();
    window.scrollTo(0, 0);

  } catch (e) {
    console.error(e);
    alert("Could not load product.");
  }
}

function resetProductForm() {
  editingProductId = null;
  document.getElementById("productForm").reset();
  document.getElementById("productFormTitle").textContent = "Add New Product";
  document.getElementById("cancelEditBtn").style.display = "none";
}

async function deleteProduct(id) {
  if (!confirm("Delete this product? This cannot be undone.")) return;
  try {
    await db.collection("products").doc(id).delete();
    loadProducts();
    loadDashboard();
  } catch (e) {
    console.error(e);
    alert("Delete failed.");
  }
}

/* ===== ORDERS ===== */
async function loadOrders() {
  const box = document.getElementById("adminOrdersList");
  try {
    const snap = await db.collection("orders").get();

    if (snap.empty) {
      box.innerHTML = `<p style="color:#888;">No orders yet.</p>`;
      return;
    }

    const orders = sortByCreatedDesc(
      snap.docs.map(d => ({ id: d.id, ...d.data() }))
    );

    box.innerHTML = orders.map(o => {
      const date = o.createdAt?.toDate?.().toLocaleString("en-KE") || "—";
      const items = (o.items || []).map(it => `${it.emoji || ""} ${it.name} ×${it.qty}`).join(", ");
      return `
        <div class="order-row">
          <div class="row-top">
            <span class="row-id">#${o.id.slice(0,8).toUpperCase()}</span>
            <select class="status-select" onchange="updateOrderStatus('${o.id}', this.value)">
              <option value="pending" ${o.status==="pending"?"selected":""}>Pending</option>
              <option value="processing" ${o.status==="processing"?"selected":""}>Processing</option>
              <option value="delivered" ${o.status==="delivered"?"selected":""}>Delivered</option>
              <option value="cancelled" ${o.status==="cancelled"?"selected":""}>Cancelled</option>
            </select>
          </div>
          <div class="row-details">
            <div>👤 <strong>${o.customer?.name || "—"}</strong> — ${o.customer?.phone || "—"}</div>
            <div>📍 ${o.customer?.address || "—"}, ${o.customer?.town || ""}, ${o.customer?.county || ""}</div>
            <div>💳 ${(o.payment || "").toUpperCase()} — <strong>${formatKsh(o.total)}</strong></div>
            <div>📦 ${items}</div>
            <div style="color:#aaa;font-size:12px;margin-top:4px;">${date}</div>
          </div>
        </div>
      `;
    }).join("");

  } catch (e) {
    console.error(e);
    box.innerHTML = `<p style="color:#E53935;">Failed to load orders.</p>`;
  }
}

async function updateOrderStatus(id, status) {
  try {
    await db.collection("orders").doc(id).update({ status });
    alert("✅ Status updated to: " + status);
    loadDashboard();
  } catch (e) {
    console.error(e);
    alert("Update failed.");
  }
}

/* ===== MESSAGES ===== */
async function loadMessages() {
  const box = document.getElementById("adminMessagesList");
  try {
    const snap = await db.collection("messages").get();

    if (snap.empty) {
      box.innerHTML = `<p style="color:#888;">No messages yet.</p>`;
      return;
    }

    const messages = sortByCreatedDesc(
      snap.docs.map(d => ({ id: d.id, ...d.data() }))
    );

    box.innerHTML = messages.map(m => {
      const date = m.createdAt?.toDate?.().toLocaleString("en-KE") || "—";
      return `
        <div class="order-row">
          <div class="row-top">
            <span class="row-id">${m.name} — ${m.email}</span>
            <button class="adm-btn small danger" onclick="deleteMessage('${m.id}')">Delete</button>
          </div>
          <div class="row-details">
            ${m.subject ? `<div><strong>Subject:</strong> ${m.subject}</div>` : ""}
            <div style="margin-top:6px;">${m.message}</div>
            <div style="color:#aaa;font-size:12px;margin-top:6px;">${date}</div>
          </div>
        </div>
      `;
    }).join("");

  } catch (e) {
    console.error(e);
    box.innerHTML = `<p style="color:#E53935;">Failed to load messages.</p>`;
  }
}

async function deleteMessage(id) {
  if (!confirm("Delete this message?")) return;
  await db.collection("messages").doc(id).delete();
  loadMessages();
  loadDashboard();
}

/* ===== EXPOSE TO GLOBAL (for inline onclick) ===== */
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.updateOrderStatus = updateOrderStatus;
window.deleteMessage = deleteMessage;