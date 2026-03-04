# 🛒 MEAN E-Commerce Platform

Angular + NestJS + MongoDB — Production Monorepo

---

## Project Overview

A scalable, production-ready e-commerce system built using:

- **Angular** (Frontend SPA)
- **NestJS** (Backend — Monolithic Architecture)
- **MongoDB** (Database)
- **Docker** (Containerization)
- **GitHub Actions** (CI/CD)
- **Cloudinary** (Cloud Image Storage)
- **Stripe & PayPal** (Payments)

---

## Prerequisites

Ensure the following are installed before setting up the project:

| Tool | Minimum Version |
| ------ | ----------------- |
| Node.js | v18.x or higher |
| pnpm | v9.x or higher (`npm install -g pnpm`) |
| Angular CLI | v17.x (`pnpm add -g @angular/cli`) |
| NestJS CLI | v10.x (`pnpm add -g @nestjs/cli`) |
| Docker | v24.x or higher |
| Docker Compose | v2.x or higher |
| MongoDB | v6.x (or use MongoDB Atlas) |

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/georgesadek/ecommerce-monorepo.git
cd ecommerce-monorepo
```

### 2. Install dependencies

```bash
pnpm install
```

This installs all workspace dependencies via Turborepo.

### 3. Set up environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

See the [Environment Variables](#environment-variables) section for details.

### 4. Run in development mode

```bash
# Start both frontend and backend
pnpm turbo dev

# Or individually:
cd apps/frontend && ng serve
cd apps/backend  && pnpm run start:dev
```

### 5. Seed the database (optional)

```bash
cd apps/backend
pnpm run seed
```

Frontend: <http://localhost:4200>  
Backend: <http://localhost:3000>

---

## Architecture Overview

```architecture
Angular (Client)
       │
       │  HTTP / REST API
       ▼
NestJS (Monolith Backend)
       │
       ├──▶ MongoDB (Primary Database)
       ├──▶ Cloudinary (Image Storage)
       └──▶ Stripe / PayPal (Payment Processing)
```

---

## Entity Relationship Diagram

The full ERD is maintained in [docs/erd.mermaid](docs/erd.mermaid).

It covers the following entities and their relationships:

| Entity | Description |
| -------- | ------------- |
| `USER` | All user accounts (customers, sellers, admins) |
| `REFRESH_TOKEN` | Long-lived tokens stored server-side |
| `ADDRESS` | Shipping addresses linked to a user |
| `SELLER_PROFILE` | Extended profile for seller accounts |
| `CATEGORY` | Self-referencing hierarchy of product categories |
| `PRODUCT` | Product listings with pricing and stock |
| `PRODUCT_IMAGE` | Multiple Cloudinary images per product |
| `REVIEW` | User ratings and comments on products |
| `WISHLIST` / `WISHLIST_ITEM` | Saved products per user |
| `CART` / `CART_ITEM` | Active shopping cart (authenticated or guest) |
| `PROMO_CODE` | Discount codes with usage limits |
| `ORDER` / `ORDER_ITEM` | Placed orders and their line items |
| `PAYMENT` | Stripe/PayPal transaction records |
| `BANNER` | Admin-managed promotional banners |
| `EMAIL_LOG` | Audit trail of all system emails sent |

---

## Monorepo Structure

```architecture
ecommerce-monorepo/
│
├── apps/
│   ├── frontend/          # Angular SPA
│   └── backend/           # NestJS monolith
│
├── packages/
│   └── shared-types/      # Shared TypeScript interfaces & DTOs
│                          # consumed by both frontend and backend
│
├── docker/
│   ├── backend.Dockerfile
│   ├── frontend.Dockerfile
│   └── docker-compose.yml
│
├── .github/
│   └── workflows/
│       └── ci.yml         # GitHub Actions pipeline
│
├── pnpm-workspace.yaml    # pnpm workspace configuration
├── turbo.json             # Turborepo pipeline config (build, lint, test, dev)
└── README.md
```

### `packages/shared-types`

Contains shared TypeScript types, interfaces, and DTOs used across both the Angular frontend and NestJS backend. This avoids type duplication and keeps contracts consistent. Import as:

```typescript
import { ProductDto } from '@ecommerce/shared-types';
```

### Turborepo Pipeline (`turbo.json`)

| Task | Description |
| ------ | ------------- |
| `build` | Builds all apps and packages in dependency order |
| `dev` | Starts all apps in watch/dev mode |
| `lint` | Runs ESLint across all workspaces |
| `test` | Runs all unit tests |

---

## Authentication Strategy

- **JWT Access Token** — Short-lived (15 min), sent in Authorization header
- **Refresh Token** — Long-lived (7 days), stored in HTTP-only cookie
- **Google OAuth 2.0** — Social login via Passport.js
- **Role-Based Access Control (RBAC)** — Roles: `Customer`, `Seller`, `Admin`
- **Email Confirmation** — Account activation via confirmation link

---

## Security

- **Helmet** — Secure HTTP headers
- **CORS** — Configured per environment (dev/prod)
- **Rate Limiting** — `@nestjs/throttler` (100 req/min per IP by default)
- **Input Validation** — `class-validator` + `class-transformer` on all DTOs
- **Password Hashing** — bcrypt with salt rounds
- **HTTPS** — Enforced in production

---

## Core Features

### User Management

- Email & Google login
- Email confirmation on registration
- Profile management (avatar, address, contact)
- Wishlist
- Order history
- Reviews & ratings
- Soft delete (Admin only)

### Product Management

- Category hierarchy
- Full product CRUD
- Image upload via Cloudinary (multiple images per product)
- Stock management & low-stock alerts
- Search, filtering, and pagination

### Shopping Cart & Checkout

- Add/remove items, adjust quantity
- Guest checkout support
- Promo/discount codes
- Multiple payment methods (Stripe, PayPal)

### Order Management

- Order placement & confirmation
- Status tracking (Pending → Processing → Shipped → Delivered)
- Transactional email notifications (Nodemailer)

### Admin Panel

- User management (view, edit roles, soft-delete)
- Product & category management
- Order & shipping management
- Promo code & banner management

### Seller Panel

- Seller registration & approval workflow
- Product listing & management
- Inventory tracking
- Earnings dashboard

---

## API Documentation

Swagger UI is available in development at:

```url
http://localhost:3000/api/docs
```

The OpenAPI JSON spec can be exported at:

```url
http://localhost:3000/api/docs-json
```

A Postman collection is available at `docs/postman_collection.json`.

---

## Docker Setup

**Requirements:** Docker v24+ and Docker Compose v2+

Build and run all services:

```bash
docker-compose up --build
```

Stop all services:

```bash
docker-compose down
```

| Service | URL |
| --------- | ----- |
| Frontend | <http://localhost:4200> |
| Backend | <http://localhost:3000> |
| MongoDB | localhost:27017 |

**Common troubleshooting:**

- Port already in use: `docker-compose down` then retry.
- Mongo connection refused: ensure the `mongo` service is healthy before the backend starts (health check is configured in `docker-compose.yml`).

---

## Environment Variables

Copy `.env.example` to `.env` and populate:

```env
# Database
MONGO_URI=mongodb://localhost:27017/ecommerce   # MongoDB connection string

# JWT
JWT_SECRET=your_jwt_secret                      # Secret for signing access tokens
JWT_REFRESH_SECRET=your_refresh_secret          # Secret for signing refresh tokens

# Stripe
STRIPE_SECRET_KEY=sk_test_...                   # Stripe secret key (use test key in dev)

# PayPal
PAYPAL_CLIENT_ID=your_paypal_client_id          # PayPal app client ID

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name           # Cloudinary cloud name
CLOUDINARY_API_KEY=your_api_key                 # Cloudinary API key
CLOUDINARY_API_SECRET=your_api_secret           # Cloudinary API secret

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com                       # SMTP host
EMAIL_USER=your_email@gmail.com                 # SMTP user
EMAIL_PASS=your_app_password                    # SMTP password or app password

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id          # Google OAuth app client ID
GOOGLE_CLIENT_SECRET=your_google_client_secret  # Google OAuth app client secret
```

---

## GitHub Workflow

### Branch Strategy

| Branch | Purpose |
| -------- | --------- |
| `main` | Production-ready code |
| `develop` | Integration branch for features |
| `feature/*` | Individual feature branches |
| `fix/*` | Bug fix branches |
| `release/*` | Release preparation |

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```example
feat(auth): add Google OAuth login
fix(cart): correct quantity update logic
chore(deps): update Angular to v17
```

### CI Pipeline (GitHub Actions)

On every push/PR to `main` or `develop`:

1. Install dependencies (`pnpm install --frozen-lockfile`)
2. Lint (ESLint)
3. Run unit tests
4. Build all apps
5. Docker image validation

---

## Testing

### Backend (NestJS — Jest)

```bash
cd apps/backend

# Unit tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:cov
```

Coverage threshold: **80%** (statements, branches, functions, lines).

### Frontend (Angular — Karma + Jasmine)

```bash
cd apps/frontend

# Unit tests
pnpm ng test

# Headless (CI)
pnpm ng test --watch=false --browsers=ChromeHeadless
```

### E2E Tests (Cypress — planned)

```bash
pnpm exec cypress open    # interactive
pnpm exec cypress run     # headless
```

---

## Deployment

| Layer | Platform |
| ------- | --------- |
| Frontend | Vercel / Netlify |
| Backend | Render / Railway / AWS (ECS or EC2) |
| Database | MongoDB Atlas |
| Images | Cloudinary |

**Production environment variables** must be set in the respective platform dashboards. Never commit `.env` to the repository.

---

## Contributing

1. Fork the repository
2. Create your branch: `git checkout -b feature/your-feature`
3. Commit your changes following the conventional commit format
4. Push to your branch: `git push origin feature/your-feature`
5. Open a Pull Request against `develop`

Please ensure all tests pass and no lint errors exist before submitting a PR.

---

## License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

---

**Author:** George Sadek
