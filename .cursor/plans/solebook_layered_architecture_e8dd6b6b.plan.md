---
name: SoleBook layered architecture
overview: "Extend the Hackathon MVP “Customer Payments → Current Account → AI Engine → buckets” story into a production-style reference architecture: explicit sources (POS, ERP, bank), a secure ingestion/normalization boundary, trustworthy AI inputs, policy + rules + ML, and observable security controls—while keeping MVP scope achievable via mocks behind the same interfaces."
todos:
  - id: doc-c4-context
    content: Write a stakeholder-facing C4 Context + Container diagram labeling trust boundaries (client, SoleBook APIs, ingestion workers, data stores, bank/POS/ERP).
    status: pending
  - id: define-ports-contracts
    content: Define stable integration ports (BankPort, PosPort, ErpPort), canonical normalized event schemas, idempotency keys, and webhook security requirements.
    status: pending
  - id: tenant-iam-consent
    content: Specify org/tenant model, RBAC roles, connector consent scopes, and audit events for grants and ingestion runs.
    status: pending
  - id: ai-policy-split
    content: Separate deterministic policy+forecast core from optional LLM explain/recommend wrapper; mandate schema-validated outputs and human-in-the-loop approvals.
    status: pending
  - id: mvp-mock-vs-prod-roadmap
    content: Map Phase 1 mocks to Phase 2+ real connectors keeping the same boundaries (per existing phased plan in `.cursor/plans/solebook_implementation_7bce9835.plan.md`).
    status: pending
isProject: false
---

# SoleBook architecture: ingestion, AI inputs, and security

## Goals (relative to your current diagram)

Your Phase 1 diagram is *correct as a narrative* (money enters, engine allocates). What it omits—and what enterprises and banks eventually require—is **where truth comes from** (sources of record), **how it is authenticated and protected**, and **what the AI is allowed to use** versus what must remain deterministic finance logic.

This plan reframes SoleBook into **layers + trust boundaries** while preserving the core product spine from the existing direction doc.

## Canonical product spine (unchanged)

Keep the owner-facing storyline:

Customer payments and operating cash converge on a **current account view**, then **`AI Cash Allocation Engine`** proposes splits into buckets (operations, obligations, profit reserve, owner salary, growth) with ancillary outputs (reminders, discipline score, leakage insights, forecast).

See the existing MVP flow in [.cursor/plans/solebook_implementation_7bce9835.plan.md](.cursor/plans/solebook_implementation_7bce9835.plan.md).

## Reference architecture (end-to-end)

```mermaid
flowchart TB
  subgraph clients [Clients]
    pwa[PWA Nextjs]
    admin[OpsAdmin_optional]
  end

  subgraph edge [EdgeAndGateway]
    cdn[WAF_TLS_CDN]
    apigw[API_Gateway_rateLimit]
    bff[BFF_optional]
  end

  subgraph identity [IdentityAndAccess]
    idp[IdP_OIDC]
    mfa[MFA_optional]
    rbac[RBAC_OrganizationRoles]
    consent[ConsentAndScopes_bankERP]
    audit[AuditLog_immutable]
  end

  subgraph ingest [SecureIngestion]
    webhookIn[WebhookReceiver_HMAC_rotate]
    poller[ScheduledConnectors_optional]
    fileIn[BulkImport_optional]
    norm[Normalizer_Mapper_Versioned]
    idem[Idempotency_ReplaySafe]
    dlq[DeadLetter_ErrorTaxonomy]
  end

  subgraph sources [ExternalSystems]
    bank[Bank_OpenBanking_Aggregators]
    pos[POS_SalesPaymentsRefunds]
    erp[ERP_AP_AR_GL_PayrollInvoices]
  end

  subgraph store [PlatformData]
    olap[OperationalDB_postgres_mysql]
    obj[ObjectStore_statements_attachments]
    cache[Redis_rateSession_optional]
    events[EventOutbox_domainEvents]
    vector[Embeddings_optional]
  end

  subgraph aiCtx [AIContextLayer_featureStore]
    feats[FinancialFeatures_dailyRollups_counters]
    graph[KnowledgeGraph_optional_vendors_staff]
    pii[PiiMinimizer_tokenization_optional]
    evals[AIEvaluation_Datasets_RedTeaming_optional]
  end

  subgraph engine [FinanceAndAIEngine]
    rules[PolicyRules_mustPay_reserveCaps]
    fore[Forecasting_deterministic]
    alloc[RecommendationGenerator_LLM_optional]
    explain[ExplainabilityTemplates]
    human[HumanInTheLoop_approveAdjust]
  end

  subgraph outputs [Outputs]
    ui[InsightsDashboard]
    alerts[ReminderNotifications_email_push]
    export[Exports_bankReadiness_reports_optional]
  end

  pwa --> cdn --> apigw
  admin --> cdn
  apigw --> idp
  apigw --> bff

  bank --> ingest
  pos --> ingest
  erp --> ingest

  ingest --> norm --> idem --> olap
  norm --> events
  ingest --> dlq

  olap --> feats
  events --> feats
  olap --> vector

  olap --> rules
  feats --> alloc
  rules --> alloc
  fore --> alloc
  alloc --> explain --> human --> ui

  rbac --> apigw
  consent --> bank
  consent --> erp
  audit --> ingest
  audit --> engine
```

## Layer-by-layer decisions (what to build, and why)

### 1) External sources (AI + finance “inputs of record”)

- **Bank**: canonical *cash movements* (credits/debits/balance snapshots), statement metadata, reconciliation anchors.
- **POS**: high-frequency operational truth—**gross sales, refunds, fees, tenders**—useful for *velocity* and anomaly detection (“sales up but reserves down”).
- **ERP**: structured obligations and accruals—**AP invoices, payroll runs, recurring bills, FX, inventory cash impacts**—better than guessing due dates from bank alone.

Important pattern: ingest **immutable source payloads** plus **normalized canonical transactions/line items**. Keep provider-specific quirks at the boundary.

### 2) Secure ingestion boundary (often missing in MVP sketches)

Treat ingestion as its own subsystem with explicit contracts:

| Concern | Minimum viable control | Typical production addition |
|---------|-------------------------|------------------------------|
| Transport security | HTTPS only, cert pinning optional for native | mTLS with partners |
| Caller authenticity | webhook HMAC signatures + rotating secrets | OAuth client credentials per integration |
| Authorization | scoped API keys per org | fine-grained integration roles |
| Integrity | payload hashing + replay protection | signed event envelopes |
| Reliability | idempotency keys, retries with backoff | DLQ + compensations |
| Privacy | minimize fields stored; retention policy | vault/tokenization |

This is where **SOC2-minded** design starts: ingestion errors, access, and data changes must be attributable.

### 3) Platform data plane

- **Operational DB**: businesses, accounts, integrations, mappings, transactions, allocations, obligations, user edits/approvals.
- **Outbox/events**: triggers for “allocation recompute,” “risk check,” “insight regeneration.” Avoid “AI reads raw DB directly” as the only pattern.
- **Object store**: PDF statements, receipts, ERP export blobs (helps audits and disputes).
- **Cache/session**: optional; keep secrets out.

### 4) AI context layer (what “AI inputs” actually means here)

Separate **truth** from **features**:

1. **Raw normalized facts** from bank/POS/ERP (stored, auditable).
2. **`FinancialFeatures`** (rolling windows): inflow volatility, obligations coverage days, payroll drag, POS net vs bank net deltas, seasonal baselines.
3. **Optional semantic layer**: vendor catalogs, staffing notes—but only after access control.

The allocation engine should be **policy-first**:

- **`PolicyRules`** enforce hard constraints (“must reserve payroll + statutory before growth”).
- **`Forecasting`** provides deterministic timelines.
- **LLM (optional)** turns outputs into SME-friendly narratives and suggests nuanced tradeoffs—bounded by schemas (JSON outputs validated against a schema; no free-form payment instructions).

This matches the guardrail already stated in your direction doc: AI recommends; it shouldn’t autopilot money movement without explicit rails.

### 5) Identity, consent, org model (multi-tenant essentials)

Minimal production shape:

- **Tenant** = SME organization
- **User** belongs to tenant with roles (owner/finance/read-only/integration-admin)
- **Bank/ERP connectors** authorized via OAuth or partner credentials; consent scopes logged
- **Audit log** covering: connector grants, ingestion runs, manual categorization edits, approvals

### 6) Observability and operations

- Structured logs with **correlation ids** spanning “web → ingest → allocation job”
- Metrics: ingestion latency/fail rate, reconciliation coverage, recomputation backlog
- Security monitoring: brute force, webhook abuse, anomalous data volume spikes

## MVP mapping (Hackathon-safe, still architecturally honest)

Phase 1 can **mock all connectors** behind stable interfaces (`BankPort`, `PosPort`, `ErpPort`) while implementing real:

- webhook signature verification scaffolding (even if mocked)
- idempotency table shape
- deterministic engine + mocked features

Phase 2+ then swaps mocks for real connectors—without rewriting the UX spine. This aligns with the phased roadmap already captured in [.cursor/plans/solebook_implementation_7bce9835.plan.md](.cursor/plans/solebook_implementation_7bce9835.plan.md).

## Security threat model (short, actionable)

Prioritize scenarios that hurt SMEs and integrations:

1. **Stolen webhook secrets** → signature rotation, IP allowlists where possible, per-org endpoints
2. **Token theft / session fixation** → httpOnly cookies or short-lived tokens, MFA for owners handling money movement approvals
3. **Over-privileged AI** → strict output schemas + server-side validation; never trust model for arithmetic—use code
4. **Data leaks between tenants** → tenant scoping enforced in DB queries (not only in UI)
5. **Insider/abuse** → audit trail + anomaly alerts on bulk exports

## Deliverables you can translate into diagrams/docs

When you formalize architecture for stakeholders:

- **C4 Context**: SoleBook + SME users + POS/ERP/bank vendors
- **C4 Containers**: Client, API/BFF, Ingest worker, DB, Queue, AI service (if separated)
- **Sequence diagrams**: onboarding consent, webhook ingest, nightly reconciliation, recommendation refresh
- **Data classification**: PCI scope (often “none” if you never store PAN), bank data sensitivity tiers, ERP document retention

## Optional future split (clean scaling line)

If the product grows heavy on ingestion/async work, separate:

- synchronous **Experience API**
- asynchronous **Integration Workers** consuming queues

This avoids coupling page load latency to ERP export times.
