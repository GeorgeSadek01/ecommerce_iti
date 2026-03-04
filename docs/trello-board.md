# Trello Board: MEAN E-Commerce Platform

**Team:** George · Gergis · Wafaey · Hany · Abdulazim  
**Lists:** Backlog → Todo → In Progress → Done

## Labels (by Developer)

| Label | Color | Developer |
| ------- | ------- | ----------- |
| George | Blue | George Sadek |
| Gergis | Green | Gergis |
| Wafaey | Orange | Wafaey |
| Hany | Red | Hany |
| Abdulazim | Purple | Abdulazim |

---

## BACKLOG

### 🔐 Auth & Users

| # | Card Title | Description | Assignee |
| --- | ----------- | ------------- | ---------- |
| 1 | **User Registration (Email)** | Implement POST /auth/register. Hash password with bcrypt, send confirmation email via Nodemailer, store user with `isEmailConfirmed: false`. | George |
| 2 | **Email Confirmation Flow** | Generate confirmation token (JWT), send link, verify token on GET /auth/confirm/:token, set `isEmailConfirmed: true`. | George |
| 3 | **User Login (JWT)** | POST /auth/login. Validate credentials, issue short-lived access token (15 min) + long-lived refresh token (7 days, HTTP-only cookie). | George |
| 4 | **Token Refresh Endpoint** | POST /auth/refresh. Read refresh token from HTTP-only cookie, validate, rotate token, issue new access token. | George |
| 5 | **Google OAuth 2.0 Login** | Integrate Passport.js GoogleStrategy. Handle callback, upsert user by googleId, issue JWT pair. | Gergis |
| 6 | **Logout Endpoint** | POST /auth/logout. Invalidate refresh token in DB, clear HTTP-only cookie. | George |
| 7 | **Role-Based Access Guard** | NestJS guard for roles: Customer, Seller, Admin. Apply globally with route-level overrides. | George |
| 8 | **Password Reset Flow** | POST /auth/forgot-password, POST /auth/reset-password. Token-based, time-limited (1 hr), email delivery. | Gergis |
| 9 | **User Profile CRUD** | GET/PATCH /users/me. Avatar upload to Cloudinary, address management, contact info. | Hany |
| 10 | **Admin: Soft Delete User** | PATCH /admin/users/:id/delete. Set `isDeleted: true`, exclude from all queries. | Hany |

---

### 🏷️ Categories & Products

| # | Card Title | Description | Assignee |
| --- | ----------- | ------------- | ---------- |
| 11 | **Category CRUD (Admin)** | POST/GET/PATCH/DELETE /admin/categories. Support parent category (self-referencing). Slug generation. | Wafaey |
| 12 | **Product CRUD (Seller)** | POST/GET/PATCH/DELETE /seller/products. Full DTO validation, Cloudinary image upload, stock tracking. | Wafaey |
| 13 | **Product Image Management** | Upload multiple images per product to Cloudinary. Store `cloudinaryPublicId` for deletion. Set primary image. | Wafaey |
| 14 | **Product Search & Filtering** | GET /products?search=&category=&minPrice=&maxPrice=&sort=&page=&limit=. Full-text search + pagination. | Abdulazim |
| 15 | **Stock Management** | Decrement stock on order placement. Block checkout if stock = 0. Low-stock alert threshold configurable. | Wafaey |
| 16 | **Product Reviews & Ratings** | POST /products/:id/reviews. One review per verified purchaser. Recalculate `averageRating` on save. | Hany |

---

### 🛒 Cart & Checkout

| # | Card Title | Description | Assignee |
| --- | ----------- | ------------- | ---------- |
| 17 | **Cart Management (Authenticated)** | GET /cart, POST /cart/items, PATCH /cart/items/:id, DELETE /cart/items/:id. Validate stock on each add. | Gergis |
| 18 | **Guest Cart Support** | Issue `guestToken` cookie. Link guest cart to user on login/register. | Gergis |
| 19 | **Promo Code Validation** | POST /cart/promo. Validate code: active, not expired, usage limit not exceeded, min order met. Apply discount. | Abdulazim |
| 20 | **Checkout Flow** | POST /orders/checkout. Validate cart, apply promo, check stock, create Order + OrderItems, clear cart, trigger payment. | Gergis |

---

### 💳 Payments

| # | Card Title | Description | Assignee |
| --- | ----------- | ------------- | ---------- |
| 21 | **Stripe Integration** | Create PaymentIntent on checkout. Handle webhook: `payment_intent.succeeded` → update Order status. | Abdulazim |
| 22 | **PayPal Integration** | Create PayPal order, capture on approval. Webhook for payment completion. | Abdulazim |
| 23 | **Payment Refund Flow** | Admin/Seller can trigger refund via Stripe/PayPal. Update Payment record to `refunded`, notify user. | Abdulazim |

---

### 📦 Orders

| # | Card Title | Description | Assignee |
| --- | ----------- | ------------- | ---------- |
| 24 | **Order Placement** | Create Order with status `pending` after successful payment confirmation. Snapshot product name & price. | Gergis |
| 25 | **Order Status Tracking** | PATCH /admin/orders/:id/status. States: pending → processing → shipped → delivered. Store `trackingNumber`. | Hany |
| 26 | **Order History (Customer)** | GET /orders/my. Paginated, filterable by status and date range. | Hany |
| 27 | **Order Email Notifications** | Nodemailer: send transactional emails on order placed, processing, and shipped events. | George |

---

### 🛠️ Admin Panel

| # | Card Title | Description | Assignee |
| --- | ----------- | ------------- | ---------- |
| 28 | **Admin: User Management** | GET /admin/users (paginated, filterable). PATCH roles. Soft delete. View order history per user. | Hany |
| 29 | **Admin: Product Management** | GET/PATCH/DELETE /admin/products. Override any seller's product. | Wafaey |
| 30 | **Admin: Order Management** | GET /admin/orders (paginated, filterable by status/seller). Update status, assign tracking. | Hany |
| 31 | **Admin: Promo Codes CRUD** | POST/GET/PATCH/DELETE /admin/promo-codes. | Abdulazim |
| 32 | **Admin: Banners CRUD** | POST/GET/PATCH/DELETE /admin/banners. Schedule with `startsAt`/`endsAt`. Order by `sortOrder`. | Wafaey |

---

### 🏪 Seller Panel

| # | Card Title | Description | Assignee |
| --- | ----------- | ------------- | ---------- |
| 33 | **Seller Registration & Approval** | POST /seller/register. Creates SellerProfile with status `pending`. Admin approves via PATCH /admin/sellers/:id. Email notification on approval. | Wafaey |
| 34 | **Seller Dashboard** | GET /seller/dashboard. Total earnings, active products, recent orders (per seller). | Gergis |
| 35 | **Seller Earnings Tracking** | Compute earnings from `ORDER_ITEM.lineTotal` per seller. Aggregate on order delivery. | Abdulazim |

---

### 🔒 Security

| # | Card Title | Description | Assignee |
| --- | ----------- | ------------- | ---------- |
| 36 | **Helmet & CORS Setup** | Configure `@nestjs/helmet` and CORS with allowed origins per environment. | George |
| 37 | **Rate Limiting** | `@nestjs/throttler`: 100 req/min global, stricter on /auth/* routes (10 req/min). | George |
| 38 | **Input Validation (Global Pipe)** | `ValidationPipe` globally with `whitelist: true`, `forbidNonWhitelisted: true`. All DTOs use `class-validator`. | George |

---

### 🅰️ Angular Frontend

| # | Card Title | Description | Assignee |
| --- | ----------- | ------------- | ---------- |
| 39 | **Project Setup & Routing** | Angular standalone components, lazy-loaded feature modules, AuthGuard, RoleGuard. | Gergis |
| 40 | **Auth Pages** | Login, Register, Email Confirmation, Forgot/Reset Password pages with reactive forms. | George |
| 41 | **Product Listing & Detail Pages** | Grid layout, search/filter sidebar, pagination, product detail with image gallery and reviews. | Wafaey |
| 42 | **Cart & Checkout Pages** | Cart sidebar, checkout form (address, promo code), payment method selection (Stripe/PayPal). | Gergis |
| 43 | **Customer Dashboard** | Order history, profile settings, wishlist, saved addresses. | Hany |
| 44 | **Seller Dashboard Pages** | Product management table, inventory editor, earnings chart. | Abdulazim |
| 45 | **Admin Panel Pages** | Users table, products table, orders table, promo codes, banners, seller approvals. | Hany |
| 46 | **HTTP Interceptor (JWT)** | Attach access token to all requests. Refresh token on 401, retry original request. | George |

---

### 🐳 DevOps & CI/CD

| # | Card Title | Description | Assignee |
| --- | ----------- | ------------- | ---------- |
| 47 | **Backend Dockerfile** | Multi-stage Dockerfile: build → production image. Non-root user, health check. | Abdulazim |
| 48 | **Frontend Dockerfile** | Multi-stage: build Angular → serve with Nginx. Production-optimised. | Abdulazim |
| 49 | **Docker Compose** | Services: frontend, backend, mongo. Depends-on with health checks. Volume for Mongo data. | Abdulazim |
| 50 | **GitHub Actions CI Pipeline** | install (pnpm --frozen-lockfile) → lint → test → build → docker validation. On push to main/develop. | George |

---

### 🧪 Testing

| # | Card Title | Description | Assignee |
| --- | ----------- | ------------- | ---------- |
| 51 | **Backend Unit Tests (Jest)** | Services & guards. Mock MongoDB with `@nestjs/testing`. 80% coverage target. | Gergis |
| 52 | **Frontend Unit Tests (Karma)** | Components and services. Mock HTTP with `HttpClientTestingModule`. | Wafaey |
| 53 | **E2E Tests (Cypress)** | Critical paths: register → login → add to cart → checkout → view order. | Hany |

---

### 📄 Documentation

| # | Card Title | Description | Assignee |
| --- | ----------- | ------------- | ---------- |
| 54 | **Swagger / OpenAPI Setup** | `@nestjs/swagger` on all controllers. Decorate all DTOs. Accessible at /api/docs in dev. | George |
| 55 | **Postman Collection** | Export Postman collection to `docs/postman_collection.json`. Include all endpoints with example payloads. | Gergis |
| 56 | **`.env.example` File** | Create `.env.example` in repo root with all required keys and placeholder values. | George |
| 57 | **`pnpm-workspace.yaml`** | Define workspace packages: `apps/*`, `packages/*`. | Abdulazim |

---

## Summary

| List | Count |
| ------ | ------- |
| Backlog | 57 cards |
| Todo | 0 (move from Backlog as sprint starts) |
| In Progress | 0 |
| Done | 0 |
