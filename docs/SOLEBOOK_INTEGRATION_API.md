# SoleBook ↔ Srijaya ERP integration API

SoleBook (external SME layer) talks to Srijaya over **`/api/v1/integrations/solebook/`** using either:

1. **SoleBook JWT** — from `POST …/auth/token.php` (ERP username/password; same credential rules as `api/v1/auth/login.php` today).
2. **Integration API key** — `sb_…` bearer minted once via `keys/create.php` (Admin session/JWT).

All **payment** routes require header **`Idempotency-Key`** (unique per logical operation). Replays return the **same HTTP body** as the first success.

---

## Prerequisites

1. **Run migration:** [`DOC/migrations/009_solebook_integration.sql`](../DOC/migrations/009_solebook_integration.sql) on the ERP database.
2. **Configure signing (Srijaya server):** `SOLEBOOK_JWT_SECRET` / `SOLEBOOK_JWT_EXPIRY` in [`api/v1/config.php`](v1/config.php) (defaults derive from `JWT_SECRET` if unset).
3. **Configure caller (SoleBook app):** see **SoleBook app config** below — this is **not** a Srijaya database setting; it is how the SoleBook product builds HTTP requests.

---

## SoleBook app config (`ERP_ORIGIN` + `Authorization`)

These settings live in **the SoleBook application** (or its backend), not in Srijaya’s DB migration.

### `ERP_ORIGIN`

- **What it is:** The absolute **base URL of the Srijaya ERP** installation — scheme + host (and optional non-default port), **no path and no trailing slash**.
- **Examples:** `https://erp.srijaya.example` or `https://192.168.1.50:8443`
- **Production (Srijaya POS):** SoleBook should set **`ERP_ORIGIN`** to **`https://pos.srijaya.lk`** (no trailing slash — if you paste `https://pos.srijaya.lk/`, strip the final `/` before concatenating paths).
- **What it is not:** Not a path like `/api/v1`; not the SoleBook server’s own URL.
- **How requests are built:** every SoleBook → Srijaya call uses URLs under:

  `{ERP_ORIGIN}/api/v1/integrations/solebook/...`

  Example health check (production Srijaya POS):

  `GET https://pos.srijaya.lk/api/v1/integrations/solebook/health.php`

### `Authorization: Bearer …`

Every **authenticated** SoleBook request (except `health.php` and `auth/token.php`) must send:

```http
Authorization: Bearer <credential>
```

`<credential>` is **exactly one** of:

| Type | How SoleBook gets it | `Bearer` value |
| --- | --- | --- |
| **SoleBook JWT** | `POST https://pos.srijaya.lk/api/v1/integrations/solebook/auth/token.php` (or `POST {ERP_ORIGIN}/…/auth/token.php` in other environments) with JSON `{ "username", "password" }` (same rules as ERP login). Response includes `token`. | That `token` string (starts like `eyJ…` after decoding it’s a JWT; treat as opaque). |
| **Integration API key** | ERP Admin calls `keys/create.php` once (with normal ERP auth); response includes **`key`** once. SoleBook stores it **server-side only**. | The full `sb_…` string returned as `key`. |

**Rules:**

- The header name is always **`Authorization`**; the scheme is always **`Bearer`** (one space, then the token/key).
- Do **not** put the JWT or `sb_…` key in query strings or logs.
- SoleBook JWTs expire (`expires_in` in token response); refresh by calling `auth/token.php` again or switch to an API key for automation.

### Which auth should SoleBook use?

- **Human-in-the-loop / short sessions:** SoleBook JWT from `auth/token.php`.
- **Server automation / no ERP password stored in SoleBook:** integration **`sb_…`** key + scopes; rotate/revoke via `keys/revoke.php`.

---

## Scopes

| Scope | Purpose |
| --- | --- |
| `solebook.read` | `meta`, `snapshot` |
| `solebook.write.expenses` | `payments/expense.php` |
| `solebook.write.grn` | `payments/grn.php` |
| `solebook.write.invoices` | `payments/invoice_balance.php` |

**JWT:** `Admin` / `Manager` receive all read+write scopes; other roles receive **`solebook.read` only**.

**API keys:** scopes are stored per key (defaults include all four when omitted on create).

**Integration keys & branch:** optional `branch_id` on the key **locks** reads to that branch and restricts **expense** payments to that branch. `snapshot` ignores `?branch_id=` when a lock is set.

**Actor for `transaction_log`:** payment mutations use the authenticated employee for JWTs; for API keys the server uses the **first active Admin** (`solebook_actor_employee_id`) — same pattern as other automation.

---

## Invoice balance payment (canonical)

`POST payments/invoice_balance.php` delegates to **`InvoiceBalancePaymentService::applyBalancePayment`** — the same service as `POST /api/v1/invoices/balance_payment.php`.

Body:

| Field | Required | Notes |
| --- | --- | --- |
| `invoice_number` | yes | |
| `amount` | yes | Capped to remaining balance server-side |
| `source` | no | `deposit` (default) or `wallet` (customer on-account) |
| `account_name` | if `deposit` | Must match `accounts.account_name` |
| `solebook_reference` | no | Echoed in JSON only (does not change ledger text today) |

---

## Routes (relative to `/api/v1/integrations/solebook/`)

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `health.php` | none | DB ping |
| GET | `meta.php` | Bearer | |
| GET | `snapshot.php` | Bearer | `?branch_id=` `&privacy=strict` |
| POST | `auth/token.php` | none | Body: `username`, `password` |
| POST | `keys/create.php` | Admin ERP JWT/session | Returns plain `key` once |
| GET | `keys/list.php` | Admin | |
| POST | `keys/revoke.php` | Admin | Body: `{ "id": <int> }` |
| POST | `payments/expense.php` | Bearer + scope | Idempotency-Key |
| POST | `payments/grn.php` | Bearer + scope | Idempotency-Key |
| POST | `payments/invoice_balance.php` | Bearer + scope | Idempotency-Key |

---

## Snapshot & privacy

- **`privacy=strict`:** omits per-customer receivable breakdown (`top` list empty); still returns counts and totals.
- **GRN payables** in snapshot are **global** (GRN rows are not branch-tagged in schema).

---

## Security & operations

- Prefer **HTTPS** and rotate API keys; revoke via `keys/revoke.php`.
- Optional **`allowed_ips`** JSON array on keys for extra caller lockdown.
- **Do not** log bearer tokens or raw API keys.
- **`action_log` (SoleBook):** integration writes audit rows for token attempts, auth/scope failures, key lifecycle, read calls (`meta`, `snapshot`, `keys/list`), idempotent **replays** of payment POSTs, payment successes/failures, and validation rejections. **Idempotency-Key** values are never stored; only a **SHA-256 prefix** (16 hex chars) is logged for correlation. Financial detail still lives in `transaction_log`, `InvoiceBalPayRecords`, `expense_payments`, etc.
- **Finance:** expense and GRN paths insert/update rows that participate in existing triggers/status fields; invoice path uses the **canonical** balance payment service (commission splits, accounts, `transaction_log`, `InvoiceBalPayRecords`).

---

## Related internal APIs

- `POST /api/v1/invoices/balance_payment.php` — same balance engine as SoleBook invoice payments (staff UI / mobile).
