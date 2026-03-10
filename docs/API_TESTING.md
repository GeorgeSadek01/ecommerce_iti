# API Testing Guide

This document explains how to import, configure, and run the Postman collection for the Ecommerce backend API.

---

## Files

| File | Purpose |
|------|---------|
| `postman/postman_collection.json` | Full Postman collection (v2.1) with all endpoints and automated tests |
| `postman/postman_environment.json` | Local dev environment variables (`base_url`, `token`, etc.) |
| `scripts/generate-postman.js` | Node.js script that auto-regenerates the collection by scanning Express routes |
| `scripts/run-tests.sh` | Shell script to run the collection with Newman (CLI + HTML report) |

---

## 1. Import into Postman

1. Open **Postman → File → Import** (or drag and drop).
2. Import `postman/postman_collection.json`.
3. Then import `postman/postman_environment.json` via **Environments → Import**.
4. Select **"Ecommerce — Local Dev"** as the active environment.

---

## 2. Environment Variables

The environment file ships with these variables:

| Variable | Default | Description |
|---|---|---|
| `base_url` | `http://localhost:4000` | Backend server URL |
| `token` | *(empty)* | JWT access token — auto-populated by the Login test script |
| `confirmToken` | *(empty)* | Email-confirmation token — copy from the confirmation link |
| `userId` | *(empty)* | Auto-populated after Register |
| `productId` | *(empty)* | Set after creating a product |
| `categoryId` | *(empty)* | Set after creating a category |
| `orderId` | *(empty)* | Set after placing an order |
| `cartItemId` | *(empty)* | Set after adding to cart |
| `addressId` | *(empty)* | MongoDB ObjectId of a saved address |
| `paymentId` | *(empty)* | Set after creating a payment intent |
| `sellerProfileId` | *(empty)* | Set after creating a seller profile |

After a successful **Login**, the test script automatically saves the `accessToken` to `{{token}}` so all subsequent protected requests work without manual copy-paste.

---

## 3. Running the Full Auth Flow

Execute these requests **in order**:

1. `POST /api/v1/auth/register` — creates the user  
2. Grab the `token` from the confirmation email link → paste into `confirmToken` env variable  
3. `GET /api/v1/auth/confirm/{{confirmToken}}` — confirms email  
4. `POST /api/v1/auth/login` — obtains `accessToken` (auto-saved to `{{token}}`) + sets refresh cookie  
5. All protected requests — use `Authorization: Bearer {{token}}` (pre-configured in headers)  
6. `POST /api/v1/auth/refresh` — rotates tokens, updates `{{token}}`  
7. `POST /api/v1/auth/logout` — clears token and cookie  

---

## 4. Installing Newman

Newman is the CLI runner for Postman collections.

```bash
npm install -g newman newman-reporter-htmlextra
```

---

## 5. Running Tests with Newman

```bash
# Run all requests
bash scripts/run-tests.sh

# Run only the Auth folder
bash scripts/run-tests.sh --folder Auth

# Run against a different environment file
bash scripts/run-tests.sh --env postman/postman_environment.staging.json
```

Newman will produce:

- **CLI output** — coloured pass/fail per request in the terminal  
- **HTML report** — saved to `postman/reports/report_<timestamp>.html`  
- **JUnit XML** — saved to `postman/reports/junit_<timestamp>.xml` (useful for CI)

---

## 6. Auto-Regenerating the Collection

When new routes are added to the backend, regenerate the collection:

```bash
node scripts/generate-postman.js
```

The script:

- Reads `app.js` to detect `app.use()` mount prefixes
- Scans every `*.routes.js` file under `apps/backend/src`
- Resolves full paths (prefix + router path)
- Writes a fresh `postman/postman_collection.json`

> **Note:** The hand-crafted collection (`postman/postman_collection.json`) contains richer example bodies and descriptions. Run the generator only when you want a quick baseline rebuild, then customise as needed.

---

## 7. Example curl Commands

```bash
BASE=http://localhost:4000

# Health check
curl "$BASE/health"

# Register
curl -s -X POST "$BASE/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","email":"john@example.com","password":"Password1"}'

# Confirm email (paste token from email)
curl -s "$BASE/api/v1/auth/confirm/<TOKEN>"

# Login — capture access token
TOKEN=$(curl -s -X POST "$BASE/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"john@example.com","password":"Password1"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

# Refresh token (requires cookie)
curl -s -X POST "$BASE/api/v1/auth/refresh" \
  -b cookies.txt \
  -c cookies.txt

# Logout
curl -s -X POST "$BASE/api/v1/auth/logout" \
  -H "Authorization: Bearer $TOKEN" \
  -b cookies.txt
```

---

## 8. Rate Limiting

The API applies two rate limiters:

| Limiter | Applied to | Limit |
|---------|-----------|-------|
| `authLimiter` | All `/api/v1/auth/*` routes | Strict (short window) |
| `globalLimiter` | All other routes | Relaxed |

If Newman runs trigger `429 Too Many Requests`, add a delay between requests:

```bash
newman run postman/postman_collection.json \
  -e postman/postman_environment.json \
  --delay-request 300
```

---

## 9. CI Integration (GitHub Actions example)

```yaml
- name: Install Newman
  run: npm install -g newman newman-reporter-htmlextra

- name: Run API tests
  run: bash scripts/run-tests.sh

- name: Upload HTML report
  uses: actions/upload-artifact@v4
  with:
    name: api-test-report
    path: postman/reports/
```
