# SoleBook client implementation notes

## 0. Database

Run [`DOC/migrations/009_solebook_integration.sql`](DOC/migrations/009_solebook_integration.sql) on the Srijaya MySQL instance before calling authenticated SoleBook routes or **keys/create**.

## 1. SoleBook app config: `ERP_ORIGIN` + `Authorization`

These are **SoleBook-side** settings (environment variables, config file, or secrets store). Srijaya does **not** define `ERP_ORIGIN` in PHP for SoleBook — you configure it wherever SoleBook keeps its “which ERP do I talk to?” setting.

### `ERP_ORIGIN`

| Field | Rule |
| --- | --- |
| Value | Scheme + host, optional port; **no** path segment; **no** trailing `/`. |
| **Production Srijaya POS** | `https://pos.srijaya.lk` — if you copy `https://pos.srijaya.lk/`, remove the trailing `/` before use. |
| Other examples | `https://erp.company.lk` · `https://10.0.0.5:8443` |
| Wrong | `https://pos.srijaya.lk/` · `https://erp.company.lk/api` |

**Full path pattern:**

```text
{ERP_ORIGIN}/api/v1/integrations/solebook/<endpoint>.php
```

Example (production): `GET https://pos.srijaya.lk/api/v1/integrations/solebook/health.php`

### `Authorization: Bearer …`

On every authenticated request (everything except **`health.php`** and **`auth/token.php`**), send:

```http
Authorization: Bearer <one-credential-only>
```

`<one-credential-only>` is **either**:

1. **SoleBook JWT** — obtain with `POST https://pos.srijaya.lk/api/v1/integrations/solebook/auth/token.php` (same path pattern on other hosts) and body `{"username":"…","password":"…"}`. Use the `token` field from JSON as the Bearer value. Expires per `expires_in`; call token again to refresh.
2. **Integration API key** — Admin creates once via `keys/create.php` (with normal ERP session/JWT). Response includes a **`key`** string starting with `sb_`. SoleBook stores that **full string** and sends it as the Bearer value for automation (no ERP password in SoleBook).

**Important:**

- It is always the HTTP header **`Authorization`**, value **`Bearer `** + token (single space after `Bearer`).
- Never append the key to `ERP_ORIGIN` as a query parameter.

### Quick checklist for SoleBook developers

- [ ] Set `ERP_ORIGIN` to **`https://pos.srijaya.lk`** for production Srijaya POS (no trailing `/`).
- [ ] Choose JWT **or** `sb_…` key; implement `Authorization: Bearer` on all SoleBook → Srijaya calls.
- [ ] For payments, add header **`Idempotency-Key`** (stable per logical operation).

## 2. Authentication (summary)

- **JWT path:** `POST …/auth/token.php` → store `token` → `Authorization: Bearer <token>` on subsequent calls.
- **API key path:** Admin `POST …/keys/create.php` (ERP auth) → SoleBook stores `key` → `Authorization: Bearer <key>` on subsequent calls.

## 3. Idempotency

Every **POST** under `payments/` **must** send a stable `Idempotency-Key` header (UUID recommended). Retries after timeouts must reuse the same key to avoid double pay.

## 4. Invoice payments

Use the same semantics as the internal API:

- `source: "deposit"` + `account_name` for cash/bank buckets in `accounts`.
- `source: "wallet"` for customer on-account (`customer_extra_fund`); invoice must resolve to a customer.

See [`api/SOLEBOOK_INTEGRATION_API.md`](../api/SOLEBOOK_INTEGRATION_API.md) for field tables and scopes.

## 5. POS / v2 UI

SoleBook does **not** require POS bundle changes. POS continues to use `api/v1` for sales; SoleBook is a **parallel** integration surface.
