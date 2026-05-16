---
name: ERP integration brief
overview: Produce a vendor-neutral **ERP integration specification** document for SoleBook, grounded entirely in the existing implementation and product plans (`.cursor/plans/`), since the app codebase is not present yet. The doc will tell ERP teams what data, interfaces, security, and operational guarantees SoleBook needs—without prescribing a single ERP product.
todos:
  - id: add-erp-brief-md
    content: Add `docs/ERP_Integration_Brief_for_SoleBook.md` with sections 1–9 above, citing SoleBook as intelligence layer and listing data catalog + sync/security in vendor-neutral language.
    status: pending
  - id: cross-check-plans
    content: While writing, cross-quote only `.cursor/plans/` content for obligations, owner salary, discipline score, and “summaries not operational data” constraints.
    status: pending
  - id: optional-appendix
    content: If user names target ERP later, append vendor-specific mapping table; otherwise leave “Open items” section.
    status: pending
isProject: false
---

# ERP-facing integration document for SoleBook

## Context

- **Source of truth today**: Product and implementation intent live in [`.cursor/plans/solebook_implementation_7bce9835.plan.md`](.cursor/plans/solebook_implementation_7bce9835.plan.md) and the long-form narrative in [`.cursor/plans/SoleBook_Implementation_Plan.txt`](.cursor/plans/SoleBook_Implementation_Plan.txt).
- **Code reality**: There is **no** `src/` tree or TypeScript domain models in the workspace yet, so the brief cannot reference concrete API routes or schemas from code. The document should state that SoleBook will map ERP payloads into internal models once built (Phase 2 in the markdown plan: auth, ingestion layer, database).

## SoleBook positioning (one paragraph for ERP readers)

State clearly that SoleBook is an **AI financial discipline layer** (cash allocation, obligation reserves, forecasts, discipline scoring)—**not** a replacement for ERP, accounting, or inventory operations. ERP remains the system of record; SoleBook consumes **aggregated financial signals** only.

## Document to add (after you approve execution)

Create a single markdown file, for example [`docs/ERP_Integration_Brief_for_SoleBook.md`](docs/ERP_Integration_Brief_for_SoleBook.md) (path can be adjusted if you prefer repo root). Sections below are the full outline.

### 1. Purpose and scope

- What SoleBook does with ERP data (behavioral cash discipline, not full books).
- **In scope for ERP**: summary financials, payables/receivables summaries, payroll and purchase aggregates, invoice-level summaries where needed for due dates.
- **Explicitly out of scope** (from plans): SKU-level inventory, warehouse/serial data, employee HR records, customer master lists, operational-only payloads.

### 2. Business and legal prerequisites

- Merchant/business identity: stable **business ID** and optional **branch/site IDs** aligned with how the SME uses the ERP.
- **Consent and authorization**: documented customer consent, purpose limitation (cash discipline vs general analytics), and right to revoke.
- **Data minimization**: only fields listed in section 4; no PII beyond what is required to reconcile amounts and dates (plans emphasize privacy and “high-level only”).
- **Auditability**: SoleBook’s production roadmap includes compliance-oriented audit trails for recommendations and approvals; ERP should support **correlation IDs** (invoice id, payment batch id) on exported events.

### 3. Connectivity patterns (ERP proposes one or more)

Vendor-neutral options the doc will ask the ERP to support or propose:

- **REST/JSON** pull or push (webhooks for material events).
- **Scheduled bulk** (daily/hourly) for summaries if real-time is not feasible.
- **OAuth2 / API keys / mTLS** as mutually agreed; document token lifecycle and IP allowlists if used.

The markdown plan suggests **real-time** where possible for money movement, **hourly/daily** for ERP summaries—state this as **target SLAs**, not hard requirements for MVP.

### 4. Data catalog (what SoleBook needs from ERP)

Derived from both plans (“ERP/POS summary import layer”, “Minimum ERP Data”, “ERP Integration Should Pull”):

| Domain | Examples (aggregates + key dates) | Notes |
|--------|-----------------------------------|--------|
| **Sales** | Period totals (day/week/month), optional daily breakdown | For revenue behavior and seasonality signals |
| **Purchases / COGS** | Purchase totals, inventory purchase value (cash view) | **Not** SKU detail—financial-level inventory spend only |
| **Payroll** | Payroll totals by period | Totals, not individual payslips |
| **Operating expenses** | Rent, utilities, other recurring categories as totals or rolled-up lines | Align to SME-friendly groupings if possible |
| **Supplier obligations** | Open supplier balance, due dates, credit terms | Feeds obligation priority engine |
| **Receivables** | Outstanding customer invoices (amount, due date, status) | For collection risk / cash timing |
| **Payables** | Outstanding supplier bills (amount, due date, status) | Core to “supplier payments may fail in N days” style alerts |
| **Invoices** | Summary + identifiers for reconciliation | Enough to dedupe with bank payments, not full line-item catalog |

Each field block in the real doc will list: **name**, **description**, **granularity** (daily vs monthly), **required vs optional**, and **example JSON** (illustrative, non-binding).

### 5. Event and sync model

- **Initial backfill**: historical window (e.g. 12–24 months of summaries + open AR/AP) TBD with SME.
- **Incremental updates**: delta by `updated_at` or event sequence.
- **Idempotency**: event or document IDs so SoleBook can safely retry ingestion.

### 6. Mapping to SoleBook concepts (conceptual)

Short diagram or table linking ERP feeds to:

- **Obligations** (rent, salaries, utilities, loans, supplier dues, cheque-related dates if ERP tracks them).
- **Operations / spending behavior** (inventory cash behavior, supplier patterns).
- **Discipline and forecast inputs** (timing of payables, reserve pressure)—aligned with Phase 2–3 in the markdown plan.

### 7. Non-functional requirements

- **Availability and rate limits** for APIs.
- **Clocks and time zones** (Sri Lanka–centric demo in plans; use explicit `Asia/Colombo` or UTC with offset).
- **Currency** (LKR assumed for SME context; multi-currency as future note).
- **Error contract**: structured errors for auth, validation, and partial batch failure.

### 8. Security checklist for ERP teams

Summarize from the long plan’s privacy section: no raw dump of unrelated tables; TLS; least-privilege API scopes; optional field-level redaction of customer/supplier **names** if SoleBook only needs amounts and dates (product decision to confirm later).

### 9. Open items for joint design workshop

- Exact ERP product and version; available APIs vs file exports.
- Whether invoice-level detail includes counterparty names or anonymized references.
- Webhook vs polling vs hybrid.

## Optional follow-up (separate from the markdown brief)

If you later choose a specific ERP (e.g. SAP Business One, Odoo, a local Sri Lankan package), add an appendix with **vendor-specific** endpoint names and field mappings—that is intentionally deferred until the ERP is known.

## Success criteria

ERP stakeholders can answer: what APIs or files to expose, what fields, what frequency, what auth, and what is explicitly **not** required—without assuming SoleBook replaces their ledger.
