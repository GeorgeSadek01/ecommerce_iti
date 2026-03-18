# Run it local

## Prerequisites

Make sure the following are installed on your machine before proceeding:

- Node.js v18+
- npm v9+
- MongoDB (local installation)
- Stripe CLI (for webhook testing , if you will test payments endpoints)
- Git

---

## 1 — Configure MongoDB Replica Set

MongoDB transactions require a Replica Set. Follow these steps **once** on your machine.

> ⚠️ This is a one-time setup. Your existing data will **not** be lost.

- Stop MongoDB

```bash
sudo systemctl stop mongod
```

- Edit MongoDB config

```bash
sudo nano /etc/mongod.conf
```

Find the `replication` section and add the replica set name:

```yaml
replication:
  replSetName: 'rs0'
```

- Start MongoDB

```bash
sudo systemctl start mongod
```

- Initialize the Replica Set

Run this **once only**. Open mongosh and execute:

```bash
mongosh
```

```js
rs.initiate();
```

You should see `{ ok: 1 }` — your replica set is ready.

Verify it is working:

```js
rs.status(); // "stateStr" should show "PRIMARY"
```

---

## 2 — Clone the Repository

```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
```

---

## 3 — Create Environment File

```bash
cp .env.example .env
```

Then open `.env` and fill in your values:

==File is shared in the group==

> ⚠️ `MONGO_URI` must include `?replicaSet=rs0` — without it, transactions will fail.

---

## 4 — Install Dependencies

```bash
npm install
```

---

## 5 — Run the Project

Start the development server:

```bash
npm run dev
```

- Server runs at `http://localhost:4000`

### Start Stripe Webhook Listener (separate terminal)

Required for payment webhook events to reach your local server:

```bash
stripe listen --forward-to localhost:4000/api/v1/payment/webhook
```

> ⚠️ Copy the webhook signing secret printed by this command and set it as `STRIPE_WEBHOOK_KEY` in your `.env`

---

## Verify Everything is Running

```bash
curl http://localhost:4000/health
# Expected: { "status": "ok" }
```

## Endpoints

[Explore it](./endpoints/)

## Postman Collection And Newman

Use the maintained collection and local environment files:

- `endpoints/ecommerce.postman.json`
- `endpoints/ecommerce.local.postman_environment.json`

Run API checks locally:

```bash
npm run test:api
```

Run API checks in CI (with JUnit output):

```bash
npm run test:api:ci
```
