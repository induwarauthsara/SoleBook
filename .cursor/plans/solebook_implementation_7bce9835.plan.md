---
name: SoleBook Implementation
overview: Implement SoleBook as a greenfield Next.js + TypeScript fintech MVP that demonstrates AI-powered SME financial discipline, then extend it through production phases. The first deliverable after approval is a root-level `SoleBook_Implementation_Plan.txt` plus the app foundation and core MVP screens/logic.
todos:
  - id: create-plan-txt
    content: Create `SoleBook_Implementation_Plan.txt` in the workspace root with the approved plan.
    status: pending
  - id: bootstrap-next-app
    content: Bootstrap a Next.js + TypeScript app structure in the empty SoleBook workspace.
    status: pending
  - id: define-domain-models
    content: Add TypeScript models for transactions, buckets, obligations, business profiles, insights, and scores.
    status: pending
  - id: build-finance-engine
    content: Implement mock allocation, payment priority, cash forecast, and discipline score logic.
    status: pending
  - id: build-mvp-ui
    content: Create onboarding, dashboard, smart buckets, obligations, owner salary, and AI insights screens.
    status: pending
  - id: seed-demo-data
    content: Add realistic Sri Lankan SME demo data for bank transactions, obligations, ERP summaries, and owner withdrawals.
    status: pending
  - id: verify-demo-flow
    content: Run the app and verify the two-minute hackathon demo flow from income detection to AI recommendation and risk alert.
    status: pending
isProject: false
---

# SoleBook Implementation Plan

## Assumptions
- The current workspace appears empty, so implementation starts as a greenfield web app.
- Use Next.js + TypeScript with mock Seylan Bank/API, ERP/POS, and manual-entry data for the hackathon MVP.
- First file to create after approval: [`SoleBook_Implementation_Plan.txt`](SoleBook_Implementation_Plan.txt), containing this implementation plan in plain text.

## Product Direction
Build SoleBook as an **AI Financial Discipline Engine for SMEs**, not as accounting software or a full ERP. The MVP should prove one clear story: SME owners receive money, SoleBook detects financial behavior, recommends cash allocation into smart buckets, warns about upcoming risks, and encourages disciplined owner salary withdrawals.

Core smart buckets:
- Operations
- Obligations
- Profit Reserve
- Owner Salary
- Growth/Investment

High-level flow:

```mermaid
flowchart TD
    income[Customer Payments] --> currentAccount[Current Account]
    currentAccount --> aiEngine[AI Cash Allocation Engine]
    aiEngine --> operations[Operations Bucket]
    aiEngine --> obligations[Obligations Bucket]
    aiEngine --> reserve[Profit Reserve]
    aiEngine --> ownerSalary[Owner Salary]
    aiEngine --> growth[Growth Investment]
    obligations --> reminders[Payment Reminders]
    reserve --> healthScore[Discipline Score]
    ownerSalary --> leakage[Personal Leakage Insights]
    aiEngine --> forecast[Cash Flow Forecast]
```

## Phase 1: Hackathon MVP
Create a polished dashboard-driven demo focused on clarity and judge impact.

Planned structure:
- [`src/app`](src/app): Next.js app routes and page shell.
- [`src/components`](src/components): dashboard cards, bucket views, insight cards, onboarding UI.
- [`src/lib/finance`](src/lib/finance): allocation engine, scoring rules, forecast logic, mock transaction categorization.
- [`src/lib/mock-data`](src/lib/mock-data): sample bank transactions, ERP summaries, obligations, owner withdrawals.
- [`src/types`](src/types): transaction, bucket, business profile, obligation, insight, and score models.

MVP screens:
- Onboarding: demo mode, business type selection, owner salary goal, AI-generated bucket setup.
- Dashboard: cash balance, smart buckets, AI recommendation card, discipline score, risk alerts.
- Cash Allocation: incoming payment simulation and recommended split with Accept/Adjust UX.
- Obligations: upcoming rent, salaries, utilities, loan payments, supplier dues, cheque dates.
- Owner Salary: recommended monthly owner compensation, withdrawal tracking, leakage warning.
- AI Insights: human-language alerts such as “Supplier payments may fail in 9 days.”

MVP logic:
- Dynamic allocation based on business type, upcoming obligations, recent cash behavior, reserve strength, and owner withdrawal pattern.
- Priority engine for obligations: high priority salaries, utilities, rent, loans; medium priority suppliers; low priority optional growth spending.
- Discipline score based on on-time payments, reserve consistency, owner salary stability, late obligations, and personal leakage.
- Simple forecast that projects cash risk over the next 7, 14, and 30 days.

## Phase 2: Production Foundation
Replace hackathon mock data with real backend boundaries and durable models.

Key additions:
- Authentication and business profiles.
- Bank transaction ingestion layer for Seylan APIs or Open Banking-style connectors.
- ERP/POS summary import layer for sales totals, purchase totals, payroll totals, supplier dues, and invoices.
- Database schema for businesses, accounts, buckets, transactions, obligations, allocations, insights, and scores.
- Event-driven allocation runs when new income arrives, large expenses happen, or deadlines approach.
- Daily AI health check for cash-flow risks.

## Phase 3: AI And Risk Intelligence
Add explainable AI without hiding core rules.

AI responsibilities:
- Categorize transaction intent and detect personal/business mixing.
- Explain allocation recommendations in plain language.
- Predict upcoming cash shortages.
- Detect unusual withdrawals, shrinking reserves, late-payment patterns, and supplier-credit risk.
- Generate bank-friendly financial discipline summaries for loan readiness.

Important guardrail:
- AI recommends first; it should not force transfers or block owner actions in the MVP.

## Phase 4: Bank And SME Ecosystem
Position SoleBook as infrastructure that banks, ERP vendors, and SME platforms can integrate.

Production integrations:
- Banking APIs for transactions and virtual pockets/buckets.
- Payment rails for QR/card settlements and bank transfers.
- ERP/POS connectors for high-level financial summaries only.
- Loan readiness reports for banks.
- Compliance-ready audit trail for recommendation history and user approvals.

## Success Criteria
The MVP is successful if judges can understand the value in under two minutes:
- Money enters one current account.
- SoleBook recommends a smarter allocation.
- Owner salary is separated from random withdrawals.
- Obligations are reserved before they become emergencies.
- The app predicts risk before cash-flow failure happens.
- The product feels like SME financial discipline infrastructure, not another expense tracker.