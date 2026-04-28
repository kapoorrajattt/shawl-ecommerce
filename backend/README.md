# Kullu Valley Shawls — Full Stack Setup Guide

## Project Structure

```
your-project/
├── index.html          ← Your existing HTML (unchanged)
├── style.css           ← Your existing CSS (unchanged)
├── script.js           ← REPLACE with the new script.js from this package
│
└── kullu-backend/      ← The backend folder (place anywhere)
    ├── server.js
    ├── .env
    ├── seed.js
    ├── package.json
    ├── models/
    │   ├── User.js
    │   ├── Product.js
    │   └── Cart.js
    ├── controllers/
    │   ├── authController.js
    │   ├── productController.js
    │   ├── cartController.js
    │   ├── userController.js
    │   └── adminController.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── productRoutes.js
    │   ├── cartRoutes.js
    │   ├── userRoutes.js
    │   └── adminRoutes.js
    ├── middleware/
    │   ├── authMiddleware.js
    │   └── uploadMiddleware.js
    └── uploads/        ← Product images stored here (auto-created)
```

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | v18+ | https://nodejs.org |
| MongoDB | v6+ | https://www.mongodb.com/try/download/community |
| npm | v9+ | (comes with Node.js) |

---

## Step-by-Step Setup

### 1. Start MongoDB

**Windows:**
```bash
net start MongoDB
```

**macOS (with Homebrew):**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

---

### 2. Install Backend Dependencies

```bash
cd kullu-backend
npm install
```

---

### 3. Configure Environment

Edit `kullu-backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/kullu_valley
JWT_SECRET=change_this_to_a_long_random_string_in_production
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

> ⚠️ Change `JWT_SECRET` to a strong random string before going live.

---

### 4. Seed the Database

```bash
cd kullu-backend
node seed.js
```

This creates:
- 6 sample products
- Admin account: `admin@kulluvalley.com` / `Admin@1234`

---

### 5. Start the Backend Server

**Development (auto-restart on save):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server runs at: **http://localhost:5000**

---

### 6. Connect Your Frontend

1. **Replace** your existing `script.js` with the new `script.js` from this package
2. Open `index.html` directly in browser **or** serve it with any static server:

```bash
# Option A — VS Code Live Server extension (recommended)
# Option B — npx
npx serve .

# Option C — Python
python -m http.server 8080
```

---

## HTML Elements to Add

Add these to your `index.html` to wire up auth and admin features.
Place them wherever fits your existing layout:

### Auth Modal
```html
<!-- Auth Modal — place before </body> -->
<div id="authModal" class="modal-overlay">
  <div class="modal-box">
    <button class="modal-close" onclick="closeAuthModal()">✕</button>
    
    <!-- Tabs -->
    <div class="auth-tabs">
      <button class="auth-tab active" data-tab="login" onclick="switchAuthTab('login')">Login</button>
      <button class="auth-tab" data-tab="register" onclick="switchAuthTab('register')">Register</button>
    </div>

    <!-- Login Form -->
    <div id="loginForm" class="auth-form active">
      <input id="loginEmail" type="email" placeholder="Email" />
      <input id="loginPassword" type="password" placeholder="Password" />
      <button onclick="handleLoginSubmit()">Login</button>
    </div>

    <!-- Register Form -->
    <div id="registerForm" class="auth-form">
      <input id="regName" type="text" placeholder="Full Name" />
      <input id="regEmail" type="email" placeholder="Email" />
      <input id="regPassword" type="password" placeholder="Password (min 6 chars)" />
      <button onclick="handleRegisterSubmit()">Create Account</button>
    </div>
  </div>
</div>
```

### Nav Buttons
```html
<!-- Add to your nav -->
<span id="userGreet" style="display:none"></span>
<button id="loginBtn" onclick="openAuthModal('login')">Login</button>
<button id="logoutBtn" onclick="logout()" style="display:none">Logout</button>
<a id="adminLink" href="admin.html" style="display:none">Admin</a>
```

### Product Grid
```html
<!-- Where you want products to appear -->
<div class="products-grid" id="productGrid"></div>
```

### Cart Checkout Button
```html
<!-- Inside your cart panel, replace your checkout button with: -->
<button onclick="checkout()">Proceed to Checkout</button>
```

---

## API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ✗ | Register new user |
| POST | `/api/auth/login` | ✗ | Login, returns JWT |
| GET | `/api/auth/me` | ✓ | Get current user |

### Products (Public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all products |
| GET | `/api/products?search=wool` | Search products |
| GET | `/api/products?category=shawl` | Filter by category |
| GET | `/api/products?featured=true` | Featured only |
| GET | `/api/products/:id` | Single product |

### Cart (Login Required)
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| GET | `/api/cart` | — | Get user's cart |
| POST | `/api/cart/add` | `{productId, qty}` | Add item |
| PATCH | `/api/cart/update` | `{productId, qty}` | Update qty |
| DELETE | `/api/cart/remove/:productId` | — | Remove item |
| DELETE | `/api/cart/clear` | — | Empty cart |
| POST | `/api/cart/sync` | `{items:[]}` | Sync guest cart |

### User Profile (Login Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/profile` | Get profile |
| PUT | `/api/user/profile` | Update profile |
| PUT | `/api/user/change-password` | Change password |

### Admin (Admin Role Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard stats |
| POST | `/api/admin/products` | Create product (multipart) |
| PUT | `/api/admin/products/:id` | Update product (multipart) |
| DELETE | `/api/admin/products/:id` | Delete product |
| GET | `/api/admin/users` | List all users |
| PATCH | `/api/admin/users/:id/role` | Change user role |

---

## Upload Images via Admin API

Use `multipart/form-data` with field name `images` (max 6 files, 5MB each):

```js
const formData = new FormData();
formData.append("name", "New Shawl");
formData.append("price", "1999");
formData.append("description", "Beautiful shawl");
formData.append("category", "shawl");
formData.append("stock", "10");
formData.append("images", file1);
formData.append("images", file2);

await adminCreateProduct(formData); // function in script.js
```

Images are served at: `http://localhost:5000/uploads/filename.jpg`

---

## Default Admin Credentials

```
Email:    admin@kulluvalley.com
Password: Admin@1234
```

> 🔒 Change the password immediately after first login in production.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `ECONNREFUSED` on port 5000 | Backend not running — run `npm run dev` |
| `MongoServerError` | MongoDB not running — start it first |
| `401 Unauthorized` on cart | User not logged in — login first |
| `403 Forbidden` on admin routes | Logged-in user is not an admin |
| Images not showing | Check `/uploads` folder exists and server is running |
| CORS error in browser | Make sure frontend is served (not opened as `file://`) |
