const API_BASE = "https://flick-declared-appease.ngrok-free.dev/api";
let authToken = localStorage.getItem("kullu_token") || null;
let currentUser = JSON.parse(localStorage.getItem("kullu_user") || "null");

let cart = JSON.parse(localStorage.getItem("kullu_cart") || "[]");
function authHeaders() {
  return {
    "Content-Type": "application/json",
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };
}

async function apiFetch(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    headers: authHeaders(),
    ...options,
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

function toggleSearch() {
  const w = document.getElementById("searchWrap");
  w.classList.toggle("open");
  if (w.classList.contains("open"))
    document.getElementById("searchInput").focus();
}

const searchInputEl = document.getElementById("searchInput");
if (searchInputEl) {
  searchInputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") doSearch();
  });
}

async function doSearch() {
  const q = document.getElementById("searchInput").value.trim();
  if (!q) return;
  showToast("Searching: " + q);
  await loadProducts({ search: q });
}
async function loadProducts(filters = {}) {
  try {
    const params = new URLSearchParams(filters).toString();
    const { ok, data } = await apiFetch(`/products?${params}`);
    if (ok && data.products) {
      renderProducts(data.products);
    }
  } catch (err) {
    console.error("Failed to load products:", err);
  }
}

function renderProducts(products) {
  const grid = document.querySelector(
    ".products-grid, .product-grid, #productGrid",
  );
  if (!grid) return;

  if (products.length === 0) {
    grid.innerHTML = '<p class="no-results">No products found.</p>';
    return;
  }

  grid.innerHTML = products
    .map((p) => {
      const img =
        p.images && p.images[0]
          ? `${API_BASE.replace("/api", "")}${p.images[0]}`
          : "";
      const imgTag = img
        ? `<img src="${img}" alt="${p.name}" loading="lazy" />`
        : `<div class="product-img-placeholder"></div>`;

      return `
      <div class="product-card reveal" data-id="${p._id}">
        <div class="product-img">${imgTag}</div>
        <div class="product-info">
          <h3 class="product-name">${p.name}</h3>
          <p class="product-price">₹${p.price.toLocaleString("en-IN")}</p>
          <p class="product-category">${p.category}</p>
          <button
            class="btn-add-cart"
            onclick="addToCart('${p.name}', ${p.price}, '${p._id}')"
            ${p.stock < 1 ? "disabled" : ""}
          >
            ${p.stock < 1 ? "Out of Stock" : "Add to Cart"}
          </button>
        </div>
      </div>`;
    })
    .join("");
  document
    .querySelectorAll(".reveal:not(.visible)")
    .forEach((el) => revealObs.observe(el));
}
function openCart() {
  document.getElementById("cartPanel").classList.add("open");
  document.getElementById("cartOverlay").classList.add("open");
}
function closeCart() {
  document.getElementById("cartPanel").classList.remove("open");
  document.getElementById("cartOverlay").classList.remove("open");
}

async function addToCart(name, price, productId) {
  if (authToken && productId) {
    const { ok, data } = await apiFetch("/cart/add", {
      method: "POST",
      body: JSON.stringify({ productId, qty: 1 }),
    });
    if (ok) {
      syncCartFromServer(data.items);
      showToast(name + " added to cart!");
      openCart();
      return;
    } else {
      showToast(data.message || "Failed to add item", "err");
      return;
    }
  }
  const existing = cart.find((i) => i.name === name);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ name, price, qty: 1, productId: productId || null });
  }
  saveCart();
  renderCart();
  showToast(name + " added to cart!");
  openCart();
}
async function removeFromCart(name, productId) {
  if (authToken && productId) {
    const { ok, data } = await apiFetch(`/cart/remove/${productId}`, {
      method: "DELETE",
    });
    if (ok) {
      syncCartFromServer(data.items);
      return;
    }
  }
  cart = cart.filter((i) => i.name !== name);
  saveCart();
  renderCart();
}
async function changeQty(name, delta, productId) {
  if (authToken && productId) {
    const item = cart.find((i) => i.name === name);
    const newQty = (item ? item.qty : 1) + delta;
    const { ok, data } = await apiFetch("/cart/update", {
      method: "PATCH",
      body: JSON.stringify({ productId, qty: newQty }),
    });
    if (ok) {
      syncCartFromServer(data.items);
      return;
    }
  }

  const item = cart.find((i) => i.name === name);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter((i) => i.name !== name);
  saveCart();
  renderCart();
}

function syncCartFromServer(serverItems) {
  cart = serverItems.map((i) => ({
    name: i.name,
    price: i.price,
    qty: i.qty,
    productId: i.product,
    image: i.image || "",
  }));
  saveCart();
  renderCart();
}

async function loadCartFromServer() {
  if (!authToken) return;
  const { ok, data } = await apiFetch("/cart");
  if (ok && data.items.length > 0) {
    syncCartFromServer(data.items);
  }
}

function saveCart() {
  localStorage.setItem("kullu_cart", JSON.stringify(cart));
  updateBadge();
}

function updateBadge() {
  const total = cart.reduce((s, i) => s + i.qty, 0);
  const badge = document.getElementById("cartBadge");
  if (!badge) return;
  badge.textContent = total;
  badge.classList.toggle("on", total > 0);
}

function renderCart() {
  const list = document.getElementById("cartList");
  const total = document.getElementById("cartTotal");
  if (!list || !total) return;

  if (cart.length === 0) {
    list.innerHTML =
      '<div class="cart-empty">Your cart is empty.<br/>Add some mountain warmth!</div>';
    total.textContent = "₹0";
    return;
  }

  list.innerHTML = cart
    .map(
      (item) => `
  <div class="cart-item-row">
    <div class="cart-item-img" style="background:linear-gradient(160deg,#7A3010,#3D1508);border-radius:3px;${
      item.image
        ? `background-image:url('${item.image}');background-size:cover;`
        : ""
    }"></div>
    <div class="cart-item-info">
      <div class="cart-item-name">${item.name}</div>
      <div class="cart-item-price">₹${item.price.toLocaleString("en-IN")}</div>
      <div class="cart-qty-row">
        <button class="qty-btn" onclick="changeQty('${item.name}', -1, '${item.productId || ""}')">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn" onclick="changeQty('${item.name}', 1, '${item.productId || ""}')">+</button>
        <button class="remove-btn" onclick="removeFromCart('${item.name}', '${item.productId || ""}')">Remove</button>
      </div>
    </div>
  </div>
`,
    )
    .join("");

  const sum = cart.reduce((s, i) => s + i.price * i.qty, 0);
  total.textContent = "₹" + sum.toLocaleString("en-IN");
}

async function checkout() {
  if (!authToken) {
    openAuthModal("login");
    showToast("Please login to checkout", "err");
    return;
  }
  const localCart = JSON.parse(localStorage.getItem("kullu_cart") || "[]");
  if (localCart.length === 0) {
    showToast("Your cart is empty!", "err");
    return;
  }
  window.location.href = "checkout.html";
}
async function register(name, email, password) {
  const { ok, data } = await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
  if (ok) {
    setAuth(data.token, data.user);
    await syncGuestCart();
    showToast("Welcome, " + data.user.name + "! 🏔️");
    closeAuthModal();
    updateAuthUI();
  } else {
    showToast(data.message || "Registration failed", "err");
  }
  return ok;
}
async function login(email, password) {
  const { ok, data } = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (ok) {
    setAuth(data.token, data.user);
    await syncGuestCart();
    await loadCartFromServer();
    showToast("Welcome back, " + data.user.name + "!");
    closeAuthModal();
    updateAuthUI();
  } else {
    showToast(data.message || "Login failed", "err");
  }
  return ok;
}
function logout() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem("kullu_token");
  localStorage.removeItem("kullu_user");
  cart = [];
  saveCart();
  renderCart();
  updateAuthUI();
  showToast("Logged out. See you soon! 🏔️");
}

function setAuth(token, user) {
  authToken = token;
  currentUser = user;
  localStorage.setItem("kullu_token", token);
  localStorage.setItem("kullu_user", JSON.stringify(user));
}

async function syncGuestCart() {
  const guestCart = JSON.parse(localStorage.getItem("kullu_cart") || "[]");
  const withIds = guestCart.filter((i) => i.productId);
  if (withIds.length === 0) return;

  const items = withIds.map((i) => ({ productId: i.productId, qty: i.qty }));
  const { ok, data } = await apiFetch("/cart/sync", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
  if (ok) syncCartFromServer(data.items);
}

function updateAuthUI() {
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const userGreet = document.getElementById("userGreet");
  const adminLink = document.getElementById("adminLink");

  if (currentUser) {
    if (loginBtn) loginBtn.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "inline-flex";
    if (userGreet) {
      userGreet.textContent = currentUser.name;
      userGreet.style.display = "inline";
    }
    if (adminLink) {
      adminLink.style.display =
        currentUser.role === "admin" ? "inline-flex" : "none";
    }
  } else {
    if (loginBtn) loginBtn.style.display = "inline-flex";
    if (logoutBtn) logoutBtn.style.display = "none";
    if (userGreet) userGreet.style.display = "none";
    if (adminLink) adminLink.style.display = "none";
  }
}

function openAuthModal(tab = "login") {
  const modal = document.getElementById("authModal");
  if (!modal) return;
  modal.classList.add("open");
  switchAuthTab(tab);
}
function closeAuthModal() {
  const modal = document.getElementById("authModal");
  if (modal) modal.classList.remove("open");
}
function switchAuthTab(tab) {
  document
    .querySelectorAll(".auth-tab")
    .forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
  document
    .querySelectorAll(".auth-form")
    .forEach((f) => f.classList.toggle("active", f.id === tab + "Form"));
}

async function handleLoginSubmit(e) {
  e && e.preventDefault();
  const email = document.getElementById("loginEmail")?.value.trim();
  const password = document.getElementById("loginPassword")?.value;
  if (!email || !password) {
    showToast("Fill all fields", "err");
    return;
  }
  await login(email, password);
}

async function handleRegisterSubmit(e) {
  e && e.preventDefault();
  const name = document.getElementById("regName")?.value.trim();
  const email = document.getElementById("regEmail")?.value.trim();
  const password = document.getElementById("regPassword")?.value;
  if (!name || !email || !password) {
    showToast("Fill all fields", "err");
    return;
  }
  await register(name, email, password);
}

async function loadProfile() {
  if (!authToken) return;
  const { ok, data } = await apiFetch("/user/profile");
  if (!ok) return;

  const u = data.user;
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || "";
  };
  set("profileName", u.name);
  set("profileEmail", u.email);
  set("profilePhone", u.phone);
  set("profileStreet", u.address?.street);
  set("profileCity", u.address?.city);
  set("profileState", u.address?.state);
  set("profilePincode", u.address?.pincode);
}

async function saveProfile() {
  const get = (id) => document.getElementById(id)?.value.trim() || "";
  const payload = {
    name: get("profileName"),
    phone: get("profilePhone"),
    address: {
      street: get("profileStreet"),
      city: get("profileCity"),
      state: get("profileState"),
      pincode: get("profilePincode"),
    },
  };
  const { ok, data } = await apiFetch("/user/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  showToast(
    data.message || (ok ? "Profile saved!" : "Failed to save"),
    ok ? "" : "err",
  );
}
async function adminCreateProduct(formData) {
  const res = await fetch(`${API_BASE}/admin/products`, {
    method: "POST",
    headers: { Authorization: `Bearer ${authToken}` },
    body: formData, // FormData with images
  });
  const data = await res.json();
  showToast(
    data.message || (res.ok ? "Product created!" : "Failed"),
    res.ok ? "" : "err",
  );
  if (res.ok) await loadProducts();
  return res.ok;
}
async function adminUpdateProduct(id, formData) {
  const res = await fetch(`${API_BASE}/admin/products/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${authToken}` },
    body: formData,
  });
  const data = await res.json();
  showToast(
    data.message || (res.ok ? "Product updated!" : "Failed"),
    res.ok ? "" : "err",
  );
  if (res.ok) await loadProducts();
  return res.ok;
}
async function adminDeleteProduct(id) {
  if (!confirm("Delete this product?")) return;
  const { ok, data } = await apiFetch(`/admin/products/${id}`, {
    method: "DELETE",
  });
  showToast(data.message || (ok ? "Deleted!" : "Failed"), ok ? "" : "err");
  if (ok) await loadProducts();
}
async function loadAdminStats() {
  const { ok, data } = await apiFetch("/admin/stats");
  if (!ok) return;
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  set("statProducts", data.stats.totalProducts);
  set("statUsers", data.stats.totalUsers);
  set("statOutOfStock", data.stats.outOfStock);
}
async function loadAdminUsers() {
  const { ok, data } = await apiFetch("/admin/users");
  if (!ok) return;
  const tbody = document.getElementById("adminUsersList");
  if (!tbody) return;
  tbody.innerHTML = data.users
    .map(
      (u) => `
    <tr>
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td>${u.role}</td>
      <td>
        <button onclick="toggleUserRole('${u._id}', '${u.role}')">
          Make ${u.role === "admin" ? "User" : "Admin"}
        </button>
      </td>
    </tr>
  `,
    )
    .join("");
}
async function toggleUserRole(userId, currentRole) {
  const newRole = currentRole === "admin" ? "user" : "admin";
  const { ok, data } = await apiFetch(`/admin/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role: newRole }),
  });
  showToast(data.message || (ok ? "Role updated!" : "Failed"), ok ? "" : "err");
  if (ok) await loadAdminUsers();
}
function subscribeNL() {
  const v = document.getElementById("nlEmail").value.trim();
  if (!v || !v.includes("@")) {
    showToast("Please enter a valid email", "err");
    return;
  }
  document.getElementById("nlEmail").value = "";
  showToast("Subscribed! Welcome to Kullu Valley 🏔️");
}

function showToast(msg, type) {
  document.querySelectorAll(".toast").forEach((t) => t.remove());
  const t = document.createElement("div");
  t.className = "toast";
  t.style.background =
    type === "err" ? "#c62828" : type === "info" ? "#1565c0" : "var(--rust)";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => {
    t.style.opacity = "0";
    t.style.transition = "opacity 0.3s";
    setTimeout(() => t.remove(), 300);
  }, 3000);
}
const revealObs = new IntersectionObserver(
  (entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add("visible"), i * 80);
        revealObs.unobserve(e.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
);

document.querySelectorAll(".reveal").forEach((el) => revealObs.observe(el));
(async function init() {
  updateBadge();
  renderCart();
  updateAuthUI();
  if (authToken) {
    await loadCartFromServer();
  }
  if (document.getElementById("productGrid")) {
    await loadProducts();
  }

  if (document.getElementById("statProducts")) {
    await loadAdminStats();
    await loadAdminUsers();
  }
  if (document.getElementById("profileName")) {
    await loadProfile();
  }
})();
function goToProduct(name, price, old) {
  let url = `product.html?name=${encodeURIComponent(name)}&price=${price}`;
  if (old) url += `&old=${old}`;
  window.location.href = url;
}
