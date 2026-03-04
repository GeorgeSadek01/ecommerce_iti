# ERD Explanation and MongoDB Design Rationale

This document explains every entity and relationship from `docs/erd.mermaid` and the reasoning behind the chosen schema decisions for a MongoDB-based e-commerce system. It also lists practical DB-level recommendations (indexes, validators, embedding vs referencing, concurrency patterns) and migration/implementation notes.

## How to read this doc

- Each entity section explains purpose, important fields, constraints, indexes, relations, and MongoDB-specific rationale.
- Top-level recommendations at the end summarize DB-level changes to implement.

**NOTE:** money fields use `Decimal128` in the ERD to avoid float precision issues. Consider storing amounts in integer cents alternatively.

### USER

- Purpose: account holder (customers, sellers, admins).
- Key fields: `_id`, `firstName`, `lastName`, `email` (unique), `passwordHash`, `role` enum, `isEmailConfirmed`, `isDeleted`, `googleId`, `avatarUrl`, `createdAt`, `updatedAt`.
- Constraints / Indexes:
  - Unique index on `email` (store normalized lowercase for case-insensitive match).
  - Index on `role` when doing role-based queries.
- Rationale: keep auth and profile data separate from heavy activity logs (e.g., EMAIL_LOG) to keep user doc small.

### REFRESH_TOKEN

- Purpose: store issued refresh tokens per user for session management.
- Key fields: `_id`, `userId` (ref `USER`), `token` (unique), `expiresAt`, `createdAt`.
- DB notes:
  - Unique index on `token`.
  - TTL index on `expiresAt` can auto-remove expired tokens (useful for cleanup).
  - Keep token records small and short-lived.

### ADDRESS

- Purpose: shipping/billing addresses for users.
- Key fields: `_id`, `userId` (ref `USER`), `street`, `city`, `state`, `country`, `zipCode`, `isDefault`.
- Constraints / Indexes:
  - Compound/partial unique: enforce at most one `isDefault=true` per `userId` (partial unique index: `{ userId: 1, isDefault: 1 }` where `isDefault:true`).
- Rationale: addresses are relatively small, can be referenced by `ORDER.addressId`. Keep multiple addresses per user.

### SELLER_PROFILE

- Purpose: seller-specific profile (store name, status, earnings).
- Key fields: `_id`, `userId` (ref `USER`), `storeName` (unique), `description`, `logoUrl`, `status` enum, `totalEarnings (Decimal128)`, `createdAt`.
- Constraints / Indexes:
  - Unique index on `userId` if business rule is one seller profile per user.
  - Index on `storeName` / `slug` for discoverability.
- Rationale: separate entity from `USER` to limit exposure of seller-only metadata, and to allow additional seller-specific collections.

### CATEGORY

- Purpose: hierarchical product categories.
- Key fields: `_id`, `name` (unique), `slug` (unique), `parentId` (self-ref), `imageUrl`, `isActive`.
- Rationale and notes:
  - Keep `parentId` for tree structure. Prevent cycles in application logic.
  - Consider storing an `ancestors` array or `path` for fast subtree queries (denormalized).

### PRODUCT

- Purpose: product catalog records listed by sellers.
- Key fields: `_id`, `sellerProfileId` (ref `SELLER_PROFILE`), `categoryId`, `name`, `slug`, `description`, `price (Decimal128)`, `discountedPrice (Decimal128)`, `stock`, `isActive`, `averageRating`, `reviewCount`, `createdAt`, `updatedAt`.
- Indexes:
  - `sellerProfileId`, `categoryId`, `slug` (global unique or combine with seller: `sellerProfileId+slug`), text index on `name + description`, price index for range queries.
- Rationale:
  - Reference `sellerProfileId` (not `user._id`) for clarity.
  - Keep product doc as primary read unit for listings. Images can be embedded or a separate collection depending on query patterns.
  - `averageRating` and `reviewCount` are denormalized counters (keep them updated atomically or recompute periodically).

### PRODUCT_IMAGE

- Purpose: one-to-many images per product.
- Key fields: `_id`, `productId`, `url`, `cloudinaryPublicId`, `isPrimary`, `sortOrder`, `createdAt`, `updatedAt`.
- Rationale:
  - Option A (current ERD): separate collection with `productId` ref. Add partial unique index to ensure only one image has `isPrimary=true` per `productId` (partial index).
  - Option B (recommended when product images are small and commonly fetched with product): embed `images` array on `PRODUCT` (faster reads, simpler consistency). Choose Option B unless images are very large or individually queried.

### REVIEW

- Purpose: product reviews left by users.
- Key fields: `_id`, `productId`, `userId`, `rating` (1–5), `comment`, `isVerifiedPurchase`, `createdAt`.
- Indexes:
  - Compound index `{productId, createdAt}` for recent-reviews queries.
  - Optional unique compound `{productId, userId}` if you want to enforce one review per user per product.
- Rationale:
  - Keep reviews in separate collection to avoid unbounded growth of product document.
  - Keep snapshots (rating, timestamp); if you need to link reviews to orders, store `orderId` when needed.

### WISHLIST

- Purpose: user's wishlist container.
- Key fields: `_id`, `userId`, `createdAt`.
- Constraints:
  - Unique index on `userId` if you want one wishlist per user.
- Rationale: One wishlist (or many — adapt to product requirements). Items are stored in `WISHLIST_ITEM`.

### WISHLIST_ITEM

- Purpose: items saved in a wishlist.
- Key fields: `_id`, `wishlistId`, `productId`, `addedAt`.
- Constraints:
  - Compound unique index `{wishlistId, productId}` to prevent duplicates.
- Rationale: separate collection helps queries for removing/updating items; they are small records.

### CART

- Purpose: shopping cart for a user or a guest (via `guestToken`).
- Key fields: `_id`, `userId` (nullable for guests), `guestToken` (nullable), `updatedAt`.
- Constraints / Design:
  - Enforce either `userId` OR `guestToken` to be non-null. Unique index on `userId` (one active cart per user) and unique on `guestToken` for guest carts.
  - Option: embed items as an array inside the cart for fast reads.
- Rationale: carts are often updated frequently; embedding items reduces joins and simplifies checkout flow.

### CART_ITEM

- Purpose: cart line items if cart items are stored as separate docs.
- Key fields: `_id`, `cartId`, `productId`, `quantity`, `priceSnapshot (Decimal128)`, `createdAt`.
- Constraints:
  - Compound unique index `{cartId, productId}` to avoid duplicate lines.
- Rationale: prefer embedding cart items inside `CART` unless carts become huge or concurrent updates require per-item locking.

### PROMO_CODE

- Purpose: discount coupons and promotion codes.
- Key fields: `_id`, `code` (unique), `discountType` enum, `discountValue (Decimal128)`, `minOrderAmount (Decimal128)`, `usageLimit`, `usageCount`, `expiresAt`, `isActive`.
- Concurrency notes:
  - Use atomic `findOneAndUpdate` with `$inc` and a query that ensures `usageCount < usageLimit` to redeem safely.
  - Consider transactions if redemption must also apply to an order doc atomically.
- Rationale: store `usageCount` as a counter, but be careful of race conditions; perform server-side atomic checks.

### ORDER

- Purpose: customer order record (master document for an order).
- Key fields: `_id`, `userId`, `addressId`, `promoCodeId` (nullable), `status` enum, `subtotal`, `discountAmount`, `shippingCost`, `total` (Decimal128), `trackingNumber`, `placedAt`, `updatedAt`.
- Rationale:
  - Embed `ORDER_ITEM` array into `ORDER` (recommended) because order and items are read together, and orders are immutable after placement.
  - Keep snapshots of product name, price, etc. in items to preserve history.

### ORDER_ITEM

- Purpose: line items for an order (snapshot of product at purchase time).
- Key fields (if separate): `_id`, `orderId`, `productId`, `sellerId`, `productNameSnapshot`, `priceSnapshot (Decimal128)`, `quantity`, `lineTotal (Decimal128)`, `createdAt`.
- Rationale: prefer embedding inside `ORDER`. If stored separately, include `createdAt` and snapshots to keep history intact even if product is deleted.

### PAYMENT

- Purpose: record of payment attempts and completions.
- Key fields: `_id`, `orderId`, `provider` enum, `providerTransactionId` (unique when present), `status` enum, `amount (Decimal128)`, `currency`, `createdAt`.
- Constraints:
  - Use a unique partial index on `providerTransactionId` where it is not null (some payments may be pending without a provider txn id).
- Rationale: Payments are separate because they may have multiple attempts and need their own lifecycle.

### BANNER

- Purpose: marketing banners / rotating homepage assets.
- Key fields: `_id`, `title`, `imageUrl`, `linkUrl`, `sortOrder`, `isActive`, `startsAt`, `endsAt`.
- Rationale: simple collection; remove or archive when expired.

### EMAIL_LOG

- Purpose: audit of transactional emails sent to users.
- Key fields: `_id`, `userId`, `type` enum, `recipient`, `status`, `sentAt`.
- Rationale: logging external communications for troubleshooting and audits.

---

## Top-level DB Recommendations

- Money: use `Decimal128` or integer cents for all financial fields to avoid floating point errors.
- Timestamps: add `createdAt` and `updatedAt` consistently across collections. Use middleware (Mongoose) or DB triggers to set them.
- Uniqueness & partial indexes:
  - `USER.email`: unique (lowercased).
  - `SELLER_PROFILE.userId`: unique.
  - `ADDRESS`: partial unique on `(userId, isDefault:true)`.
  - `PRODUCT_IMAGE`: partial unique on `(productId, isPrimary:true)`.
  - `WISHLIST_ITEM` & `CART_ITEM`: compound unique on `(parentId, productId)`.
  - `REFRESH_TOKEN.token`: unique + TTL on `expiresAt`.
  - `PROMO_CODE.code`: unique.
- Embedding vs referencing:
  - Embed `ORDER.items` inside `ORDER`.
  - Embed `PRODUCT.images` inside `PRODUCT` unless images are large or queried separately.
  - Embed `CART.items` inside `CART` when cart sizes are manageable.
  - Keep `REVIEW` separate (unbounded growth).
- Schema validation & enums: use MongoDB JSON Schema validators or your ODM (Mongoose) to enforce enum values, ranges (rating 1–5), required fields, and types.
- Concurrency & transactions:
  - Use transactions when placing an order to create `ORDER`, create `PAYMENT`, decrement `PRODUCT.stock`, and update `PROMO_CODE.usageCount` atomically.
  - For promo redemptions and stock decrements, prefer `findOneAndUpdate` with conditions, or use multi-document transactions if you need strong consistency.
- Denormalized counters:
  - `PRODUCT.reviewCount` and `averageRating`: update atomically when reviews are added/updated/removed OR periodically recompute using aggregation.
- Category tree:
  - Prevent cycles in application logic. Consider storing `ancestors` array for O(1) subtree queries.

### Schema Validation Snippets (example patterns)

- Enforce rating range (example JSON Schema fragment):

```json
"review": {
  "bsonType": "object",
  "required": ["productId", "userId", "rating"],
  "properties": {
    "rating": { "bsonType": "int", "minimum": 1, "maximum": 5 }
  }
}
```

### Index Examples (mongo shell commands)

- Unique user email (lowercased at application level):

```js
db.users.createIndex({ email: 1 }, { unique: true })
```

- Partial unique for default address:

```js
db.addresses.createIndex({ userId: 1, isDefault: 1 }, { unique: true, partialFilterExpression: { isDefault: true } })
```

- Ensure a single primary image per product:

```js
db.product_images.createIndex({ productId: 1, isPrimary: 1 }, { unique: true, partialFilterExpression: { isPrimary: true } })
```

- TTL for refresh tokens:

```js
db.refresh_tokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
```

### Migration & Implementation Tips

- When switching money fields to `Decimal128`, update application models and run a migration to convert existing floats to `Decimal128` or integer cents.
- Add the minimal production indexes first (email, slug, common query patterns) and monitor query performance with the profiler to add more.
- Use feature flags for schema changes that require application logic updates (e.g., enforcing one wishlist per user).
- Add DB-level partial unique indexes before enabling application-level uniqueness enforcement to avoid races.

### Next steps I can take for you

- Generate a MongoDB migration script that creates the recommended indexes and validators.
- Produce example Mongoose schemas for each entity with validators and middleware for timestamps.

If you want one of those, tell me which and I will generate it next.
