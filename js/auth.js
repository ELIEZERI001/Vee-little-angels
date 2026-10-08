// ============================================
// VICTORY LITTLE ANGELS — Authentication
// ============================================

document.addEventListener("DOMContentLoaded", () => {
  setupTabs();
  setupLogin();
  setupSignup();
});

/* ===== TABS ===== */
function setupTabs() {
  const tabs = document.querySelectorAll(".auth-tab");
  const forms = document.querySelectorAll(".auth-form");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      forms.forEach(f => f.classList.remove("active"));

      tab.classList.add("active");
      const target = document.getElementById(tab.dataset.tab + "Form");
      if (target) target.classList.add("active");
    });
  });
}

/* ===== LOGIN ===== */
function setupLogin() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const errBox = document.getElementById("loginError");
    errBox.textContent = "";

    try {
            await auth.signInWithEmailAndPassword(email, password);
      showToast("✅ Logged in successfully!");
      setTimeout(() => window.location.replace("account.html"), 800);
    } catch (err) {
      console.error(err);
      errBox.textContent = friendlyError(err.code);
    }
  });
}

/* ===== SIGNUP ===== */
function setupSignup() {
  const form = document.getElementById("signupForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const phone = document.getElementById("signupPhone").value.trim();
    const password = document.getElementById("signupPassword").value;
    const errBox = document.getElementById("signupError");
    errBox.textContent = "";

    if (password.length < 6) {
      errBox.textContent = "Password must be at least 6 characters.";
      return;
    }

    try {
      const cred = await auth.createUserWithEmailAndPassword(email, password);

      // Save extra user info to Firestore
      await db.collection("users").doc(cred.user.uid).set({
        name: name,
        email: email,
        phone: phone,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

           showToast("🎉 Account created!");
      setTimeout(() => window.location.replace("account.html"), 800);
    } catch (err) {
      console.error(err);
      errBox.textContent = friendlyError(err.code);
    }
  });
}

/* Friendly error messages */
function friendlyError(code) {
  switch (code) {
    case "auth/email-already-in-use": return "That email is already registered.";
    case "auth/invalid-email": return "Please enter a valid email.";
    case "auth/weak-password": return "Password too weak (min. 6 characters).";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential": return "Wrong email or password.";
    case "auth/too-many-requests": return "Too many attempts. Try again later.";
    default: return "Something went wrong. Try again.";
  }
}