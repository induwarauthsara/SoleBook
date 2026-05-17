---
name: SoleBook Backend Implementation
overview: "Full A-Z backend for SoleBook: consolidated DB schema, user auth (registration/login/2FA/biometric), deterministic finance engine (discipline score, cash runway, risk, allocations), AI layer (Gemini chat/insights with privacy-preserving architecture), ERP sync, payment gateways (Seylan + MPGS card), obligation payments, owner withdrawal, loan readiness, notifications, settings, history, and frontend wiring."
todos:
  - id: consolidate-sql
    content: "Consolidate 3 migrations into supabase/schema.sql adding: waitlist, erp_sync_log, chat_messages, notifications, user_settings, expense_categories, totp_secrets, user_sessions tables. Delete old migration files."
    status: completed
  - id: env-setup
    content: Create .env.local with all credentials (Supabase, Seylan sandbox + accounts, Gemini, ERP URL + auth, MPGS merchant ID)
    status: completed
  - id: auth-system
    content: "Build auth system: Supabase Auth registration/login, TOTP 2FA (Google Authenticator), WebAuthn/biometric, session management, password reset, email verification"
    status: completed
  - id: db-queries
    content: "Build src/lib/db/queries.ts: typed CRUD for all tables, transaction ingestion pipeline, bucket balance mutations"
    status: completed
  - id: finance-engine
    content: "Build src/lib/engine/ with: allocator.ts (dynamic priority allocation), discipline.ts (score computation), runway.ts (cash runway/risk), loan-readiness.ts (scoring), duplicate-detection.ts"
    status: completed
  - id: erp-integration
    content: "Build ERP client + routes: auth (JWT/API key), snapshot pull, expense/GRN/invoice push, sync scheduling, normalize to transactions"
    status: completed
  - id: ai-layer
    content: "Build privacy-preserving AI: data sanitizer, Gemini client, prompt templates, chat streaming route, insights generation route, audit logging"
    status: completed
  - id: payment-gateway
    content: "Complete all payment methods: bank_transfer (done), JustPay flow, QR payment (fix status), MPGS card payment (Mastercard test gateway integration)"
    status: completed
  - id: obligations-payments
    content: Obligations CRUD + pay via Seylan (internal/CEFTS), priority engine, auto-status updates, recurring obligation generation
    status: completed
  - id: owner-withdrawal
    content: "Owner withdrawal routes: record withdrawal, enforce salary plan limits, leakage detection, withdrawal history"
    status: completed
  - id: dashboard-api
    content: "Dashboard aggregation route: metrics (revenue, expenses, balance, runway, risk), bucket balances, chart data (cash flow forecast), recent activity"
    status: completed
  - id: accounts-api
    content: "Accounts routes: list accounts, sync balance from Seylan, transaction history from bank, link/unlink accounts"
    status: completed
  - id: history-api
    content: "Transaction history: paginated list with filters (date, direction, category, source), save from ERP/bank, category assignment"
    status: completed
  - id: loan-readiness
    content: "Loan readiness engine + route: stability score, cash flow health, reserve behavior, repayment consistency, generate report"
    status: completed
  - id: settings-api
    content: "Settings routes: business profile CRUD, bucket percentages, notification preferences, owner salary goal, language, integrations config"
    status: completed
  - id: notifications
    content: "Notifications system: generate on events (obligation due, low reserve, leakage, AI insight), store in DB, mark read, list route"
    status: completed
  - id: wire-frontend
    content: Update AppDataProvider to fetch real API data, wire auth (register/login/2FA/biometric), chat page to stream AI, subscription page all 4 methods (incl MPGS card), settings persistence
    status: completed
isProject: false
---

# SoleBook Full Backend Implementation (A-Z)

## Architecture Philosophy

SoleBook = AI-Powered Financial Discipline Layer, NOT accounting software.

- **Deterministic Finance Engine** (rules-based): handles all money logic -- allocations, scoring, duplicate detection, priority payments, risk assessment
- **AI/LLM Layer** (Gemini): ONLY for chat, insights, summaries, behavioral coaching -- never moves money
- **Privacy-Preserving AI Pipeline**: raw data -> internal processing -> anonymized/summarized context -> Gemini
- **Human Approval**: AI suggests, user approves

## Current State

- **Database**: 3 well-designed migration files in `supabase/migrations/`
- **Seylan Bank client**: [`src/lib/seylan/client.ts`](src/lib/seylan/client.ts) - all API methods
- **Supabase client**: [`src/lib/supabase.ts`](src/lib/supabase.ts) - anon + admin
- **Auth**: Frontend has localStorage-based mock auth (`AuthProvider`) -- needs real Supabase Auth
- **Existing routes**: Payment initiate (bank_transfer only), balance status, QR generate, plans, waitlist
- **Frontend**: All pages use mock data via `AppDataProvider`
- **Finance engine**: [`src/lib/finance-engine.ts`](src/lib/finance-engine.ts) - basic allocation (frontend types)
- **MPGS**: Seylan Mastercard Payment Gateway test environment available at `test-seylan.mtf.gateway.mastercard.com`

---

## Phase 1: Database Consolidation

Merge 3 migrations into single `supabase/schema.sql` and ADD these new tables:

- **`waitlist`** - already referenced in waitlist route but missing from schema
- **`erp_sync_log`** - track ERP sync events (last_synced, status, error, data_hash)
- **`chat_messages`** - persist AI chat history per org (role, content, context_hash, created_at)
- **`notifications`** - event-driven notifications (type, title, body, read_at, org_id, metadata)
- **`user_settings`** - per-user preferences (language, notification_prefs, theme)
- **`expense_categories`** - configurable categories per org (name, group, is_default, icon)
- **`totp_secrets`** - TOTP 2FA secrets per user (user_id, encrypted_secret, verified_at, backup_codes)
- **`webauthn_credentials`** - passkey/biometric credentials (user_id, credential_id, public_key, sign_count, device_name)
- **`user_sessions`** - active session tracking for multi-device management (user_id, device_info, ip, last_active, revoked_at)

Add to existing `obligations` table: `recurrence_rule` (cron-like for auto-generation).

Delete individual migration files after consolidation.

---

## Phase 1b: Authentication & User Onboarding (`src/lib/auth/`, `src/app/api/auth/`)

Uses **Supabase Auth** as the identity provider, extended with custom 2FA and biometric layers.

### 1b-1. Registration (User Onboarding)

**Route**: `POST /api/auth/register`

Flow:
1. Collect: email, password, full_name, business_name, business_type
2. Call `supabase.auth.signUp()` -- creates user in Supabase Auth
3. Trigger email verification (Supabase handles the email)
4. On verification callback: create `organization` + link user with `owner` role via existing `create_organization` RPC
5. Return JWT access token + refresh token

**Route**: `POST /api/auth/verify-email` -- handles the redirect from Supabase email verification

**File**: `src/lib/auth/registration.ts`

```typescript
interface RegisterInput {
  email: string;
  password: string;
  full_name: string;
  business_name: string;
  business_type: 'retail' | 'restaurant' | 'services' | 'manufacturing';
}
```

### 1b-2. Login

**Route**: `POST /api/auth/login`

Flow:
1. Call `supabase.auth.signInWithPassword()`
2. If 2FA is enabled for user -> return `{ requires_2fa: true, session_token: partial_token }`
3. Client must then call `/api/auth/2fa/verify` with TOTP code
4. On success: return full session + user profile + org context
5. Record login in `user_sessions` table

**Route**: `POST /api/auth/logout` -- invalidate session, revoke refresh token
**Route**: `POST /api/auth/refresh` -- rotate refresh token
**Route**: `POST /api/auth/forgot-password` -- trigger Supabase password reset email
**Route**: `POST /api/auth/reset-password` -- handle password reset with token

### 1b-3. Two-Factor Authentication (TOTP - Google Authenticator)

**Library**: `otpauth` (npm) for TOTP generation/verification

**Routes**:
- `POST /api/auth/2fa/setup` -- generate TOTP secret, return QR code URI (otpauth:// format for Google Authenticator)
- `POST /api/auth/2fa/verify-setup` -- user enters 6-digit code to confirm setup, mark `totp_secrets.verified_at`
- `POST /api/auth/2fa/verify` -- verify TOTP code during login (with rate limiting)
- `POST /api/auth/2fa/disable` -- disable 2FA (requires current password + valid TOTP code)
- `GET /api/auth/2fa/backup-codes` -- generate one-time backup codes (10 codes, hashed in DB)

**File**: `src/lib/auth/totp.ts`

```typescript
import { TOTP } from 'otpauth';

export function generateTOTPSecret(email: string): { secret: string; uri: string; qr: string };
export function verifyTOTPCode(secret: string, code: string): boolean;
export function generateBackupCodes(): string[];
```

- Secret stored encrypted in `totp_secrets` table (encrypt with server-side key from env)
- QR code rendered client-side using the `otpauth://` URI
- Rate limit: 5 failed attempts -> 15 min lockout
- Backup codes: 10 single-use codes generated at setup time

### 1b-4. Biometric / Passkey Authentication (WebAuthn)

**Library**: `@simplewebauthn/server` (npm)

**Routes**:
- `POST /api/auth/webauthn/register-options` -- generate registration challenge
- `POST /api/auth/webauthn/register-verify` -- verify attestation, store credential in `webauthn_credentials`
- `POST /api/auth/webauthn/login-options` -- generate authentication challenge
- `POST /api/auth/webauthn/login-verify` -- verify assertion, issue session

**File**: `src/lib/auth/webauthn.ts`

```typescript
import { generateRegistrationOptions, verifyRegistrationResponse,
         generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';

const rpName = 'SoleBook';
const rpID = process.env.WEBAUTHN_RP_ID || 'localhost';
```

- Supports: fingerprint, face recognition, hardware keys (YubiKey), phone biometric
- Stored credentials: `credential_id`, `public_key`, `counter`, `device_name`
- Can be used as primary login OR as 2FA step (configurable per user)

### 1b-5. Session Management

- Multi-device tracking in `user_sessions` table
- `GET /api/auth/sessions` -- list active sessions
- `DELETE /api/auth/sessions/:id` -- revoke specific session
- Auto-expire sessions after 30 days of inactivity
- Force logout all devices option

### 1b-6. Auth Middleware

**File**: `src/lib/auth/middleware.ts`

```typescript
export async function requireAuth(req: NextRequest): Promise<{ user: User; org: Organization }>;
export async function requireRole(req: NextRequest, roles: string[]): Promise<void>;
export async function require2FA(req: NextRequest): Promise<void>;
```

Applied to all protected API routes. Validates JWT, checks org membership, enforces RBAC.

---

## Phase 2: Deterministic Finance Engine (`src/lib/engine/`)

This is the CORE -- all money logic lives here, NOT in AI.

### 2a. Allocation Engine (`allocator.ts`)

Dynamic priority-based allocation (NOT fixed percentages):

- Input: incoming amount, business profile, obligations due in 30d, reserve health, spending patterns
- Factors: business_type (retail=inventory-heavy, restaurant=utility-heavy, services=salary-heavy)
- Output: recommended split across 5 buckets (operations, obligations, profit_reserve, owner_salary, growth)
- Adjusts dynamically: healthy month -> save more; risky month -> protect obligations first
- Persists proposal to `allocations` + `allocation_lines` tables
- User can Accept / Adjust / Auto-approve

### 2b. Financial Discipline Score (`discipline.ts`)

Gamified score (0-100) computed from:

- **Payment timeliness** (30%): % of obligations paid on/before due date
- **Reserve consistency** (25%): how stable is profit_reserve vs target
- **Owner salary stability** (20%): structured vs random withdrawals
- **Personal leakage penalty** (-15 max): unplanned owner withdrawals
- **Cash flow health** (10%): trend of inflow vs outflow over 30 days

Store daily snapshot in `discipline_scores` table. Return historical trend for charts.

### 2c. Cash Runway & Risk Engine (`runway.ts`)

- **Cash runway**: current_balance / avg_daily_outflow = days until zero
- **Risk assessment**: compare obligations_due_next_30d vs projected_inflow
- **Status bands**: Comfortable (>30d) / Balanced (14-30d) / Tight (<14d)
- **Horizon forecasting**: 7d / 14d / 30d outlook with confidence
- **Risk signals**: seasonal drop detection, obligation clustering, reserve depletion rate

### 2d. Loan Readiness Score (`loan-readiness.ts`)

Deterministic scoring for bank lending:

- Revenue stability (consistent monthly income vs volatile)
- Reserve behavior (maintains buffer > X months)
- Obligation fulfillment rate (% paid on time over 6 months)
- Cash flow health (positive net flow trend)
- Owner discipline (structured salary, no excess leakage)
- Debt service coverage ratio (income vs existing obligations)
- Output: 0-100 score + breakdown + recommendations

### 2e. Duplicate Payment Detection (`duplicate-detection.ts`)

Rules-based detection:

- Same counterparty + similar amount within 7 days
- Same amount + same category within 3 days
- Flag with confidence level (high/medium/low)
- Store `is_duplicate_of` reference on transaction

### 2f. Priority Payment Engine (`priority.ts`)

Ranks upcoming obligations:

- HIGH: salaries, loan payments, utility disconnection risk
- MEDIUM: supplier invoices within credit period
- LOW: optional purchases, growth spending
- Considers: due date proximity, penalty risk, relationship importance

### 2g. Expense Categorization (`categories.ts`)

Smart category groups for Sri Lankan SMEs:

- **Fixed Expenses**: rent, subscriptions, insurance
- **Variable Expenses**: inventory, fuel, delivery
- **Urgent Payments**: salaries, utilities, loan installments
- **Risky Expenses**: unplanned spending, personal leakage
- **Growth Investments**: equipment, marketing, training
- **Tax & Compliance**: income tax, VAT, EPF/ETF, licenses
- **Debt Obligations**: loan repayments, leasing, credit cards

Auto-categorize transactions based on counterparty_alias and description patterns.

---

## Phase 3: ERP Integration (`src/lib/erp/`)

### ERP Client (`client.ts`)

Per [`docs/SOLEBOOK_INTEGRATION_API.md`](docs/SOLEBOOK_INTEGRATION_API.md):

- `ERP_BASE_URL` = `http://pos.srijaya.lk` (no trailing slash)
- Auth: `POST {ERP_ORIGIN}/api/v1/integrations/solebook/auth/token.php` -> JWT
- OR: `sb_...` API key (stored server-side)
- All payment POSTs require `Idempotency-Key` header

### ERP Routes

- `GET /api/erp/health` - Check ERP connectivity
- `POST /api/erp/auth` - Get/refresh ERP JWT token
- `POST /api/erp/sync` - Pull snapshot (meta + financial summary), normalize to SoleBook transactions
- `GET /api/erp/status` - Last sync time, status, errors
- `POST /api/erp/push/expense` - Push expense payment to ERP
- `POST /api/erp/push/grn` - Push GRN payment to ERP
- `POST /api/erp/push/invoice` - Push invoice balance payment to ERP

### Data Pulled from ERP (financial-level ONLY)

- Sales totals (daily/weekly/monthly)
- Purchase totals & supplier payments
- Outstanding receivables/payables
- Inventory purchase values
- Payroll totals
- NOT: individual SKUs, warehouse details, customer PII

### Normalization Pipeline

ERP snapshot -> `transactions_raw` (immutable) -> normalize to `transactions` (canonical) -> trigger allocation engine if income detected.

---

## Phase 4: AI Layer (Privacy-Preserving)

### Architecture

```
Raw Financial Data
    |
    v
Data Sanitizer (remove account numbers, PII, secrets)
    |
    v
Context Builder (structured financial summary)
    |
    v
Gemini API (ephemeral, no data retention)
    |
    v
Safety Filter (block dangerous outputs)
    |
    v
Audit Log (model_id, prompt_version, context_hash)
    |
    v
User Response
```

### AI Client (`src/lib/ai/gemini.ts`)

- Gemini REST API with key `AIzaSyDJJ5iqpuc6heNvCqCfYxM36eL7f5aC_0c`
- Data sanitizer: strips account numbers, replaces names with aliases
- Context builder: creates structured financial summary from DB data
- Prompt templates versioned (for audit trail)
- Response safety filter: block any "transfer money" / "approve payment" outputs
- Every AI call logged to `ai_audit_log`

### AI Chat Route (`POST /api/ai/chat`)

- Streaming response (SSE/ReadableStream)
- Builds context: recent transactions summary, bucket balances, upcoming obligations, discipline score
- Supports multilingual (en/si/ta) based on user setting
- Persists messages to `chat_messages` table
- Example: "Can I safely pay this supplier today?" -> AI checks reserves, obligations, and advises

### AI Insights Route (`POST /api/ai/insights/generate`)

- Runs on-demand or scheduled
- Input: last 30 days of anonymized financial behavior
- Output: 3-5 actionable insights stored in `insights` table
- Categories: cash_risk, discipline, leakage, supplier_risk, reserve_health, forecast
- Example: "If current spending continues, supplier payments may fail in 9 days."

### AI NEVER does:

- Move money
- Approve payments
- Override deterministic engine decisions
- Access raw account numbers

---

## Phase 5: Payment Gateway (All 3 Methods)

### 5a. Bank Transfer (already working)

Existing `POST /api/payments/initiate` with `method: "bank_transfer"` uses `transferFunds()`.

### 5b. JustPay Flow (NEW)

Full flow implementation:

1. `POST /api/payments/justpay/register` - Register account (calls `justPayRegister`)
2. `POST /api/payments/justpay/verify` - Verify OTP (calls `justPayVerify`, gets token)
3. `POST /api/payments/justpay/certificate` - Get certificate (if needed)
4. `POST /api/payments/justpay/sign` - Sign mandate
5. `POST /api/payments/justpay/pay` - Initiate transaction (calls `justPayInitiateTransaction`)
6. `GET /api/payments/justpay/status` - Poll status (calls `justPayGetStatus`)
7. `POST /api/payments/justpay/refund` - Refund if needed

### 5c. QR Payment (FIX + COMPLETE)

- `POST /api/payments/qr/generate` - Already works (Merchant QR)
- `GET /api/payments/status` - FIX: implement real status polling using `inquireMerchantQRTransaction` instead of stub
- Add LankaQR flow: `POST /api/payments/lankaqr/initiate` + status inquiry
- Add VM QR flow: `POST /api/payments/vmqr/initiate` + status inquiry

### 5d. Mastercard Payment Gateway Services (MPGS) - Card Payments (NEW)

**Integration Type**: Hosted Checkout (redirect to MPGS-hosted payment page)

**Test Environment**:
- Gateway URL: `https://test-seylan.mtf.gateway.mastercard.com`
- Integration Guide: `https://test-seylan.mtf.gateway.mastercard.com/api/documentation/integrationGuidelines/index.html`
- Login: `https://test-seylan.mtf.gateway.mastercard.com/ma/login.s`

**File**: `src/lib/mpgs/client.ts`

```typescript
interface MPGSConfig {
  merchantId: string;
  apiPassword: string;
  gatewayUrl: string; // https://test-seylan.mtf.gateway.mastercard.com
}

export class MPGSClient {
  createCheckoutSession(order: OrderInput): Promise<{ sessionId: string; redirectUrl: string }>;
  verifyTransaction(orderId: string, transactionId: string): Promise<TransactionResult>;
  refundTransaction(orderId: string, transactionId: string, amount: number): Promise<RefundResult>;
}
```

**Routes**:
- `POST /api/payments/mpgs/create-session` -- Create checkout session, return session ID + redirect URL
- `POST /api/payments/mpgs/callback` -- MPGS posts result here after payment (success/failure/cancel)
- `GET /api/payments/mpgs/verify/:orderId` -- Verify transaction status via MPGS API
- `POST /api/payments/mpgs/refund` -- Refund a card payment

**Flow**:
1. Client calls `POST /api/payments/mpgs/create-session` with amount + description
2. Server creates order on MPGS, returns hosted checkout URL
3. User redirected to MPGS hosted page (enters card details on Mastercard-hosted form -- PCI DSS compliant)
4. MPGS redirects back to callback URL with transaction result
5. Server verifies result via MPGS Retrieve Order API, records payment

This adds **card payment** (Visa/Mastercard) as a 4th subscription payment method alongside bank_transfer, JustPay, and QR.

### 5e. Subscription Payment Recording

After any successful payment (bank/JustPay/QR/MPGS card), record in DB and activate subscription.

---

## Phase 6: Obligation Payments & Management

### Routes

- `GET /api/obligations` - List with filters (status, priority, due_date range)
- `POST /api/obligations` - Create (manual or from ERP sync)
- `PATCH /api/obligations/[id]` - Update status, amount, date
- `DELETE /api/obligations/[id]` - Cancel obligation
- `POST /api/obligations/[id]/pay` - Execute payment via Seylan API:
  - Internal transfer for same-bank payees
  - CEFTS for interbank (destination bank code + account)
  - Records transaction, links to obligation, updates status to `paid`
- `GET /api/obligations/upcoming` - Next 30 days with priority ranking
- `POST /api/obligations/generate-recurring` - Auto-create from recurrence rules

### Obligation Categories (Sri Lankan SME)

rent, payroll, utilities, loan, supplier, tax, subscription, other -- maps to expense groups.

---

## Phase 7: Owner Withdrawal System

### Routes

- `POST /api/owner/withdraw` - Record withdrawal (checks against salary plan)
- `GET /api/owner/withdrawals` - History with filters
- `GET /api/owner/salary-status` - Current month: withdrawn vs plan, remaining allowance
- `GET /api/owner/leakage` - Withdrawals flagged as outside salary plan

### Logic

- Compare withdrawal against `business_profiles.target_owner_salary_lkr`
- Flag as `is_within_salary_plan: false` if exceeds monthly limit
- Generate insight: "Owner withdrawals exceeded recommended limit by 22%"
- Feed into discipline score (penalty for leakage)
- Show impact simulation: "If this continues, payroll may be delayed in 9 days"

---

## Phase 8: Dashboard Aggregation API

### `GET /api/dashboard`

Returns ALL dashboard data in one call:

- **metrics**: monthlyRevenue, monthlyExpenses, currentBalance, cashRunway, riskLevel, pendingObligations, ownerSalaryGoal, ownerTotalWithdrawn, avgDailySales
- **buckets**: all 5 with current_balance_lkr, target_pct, health status
- **disciplineScore**: current score + component breakdown + 30-day trend
- **upcomingPayments**: next 5 obligations with priority
- **recentTransactions**: last 10 transactions
- **cashFlowChart**: 30-day forecast data points (date, projected_balance, obligations, income_expected, risk_level)
- **aiInsights**: latest 3 unacknowledged insights
- **notifications**: unread count + latest 5

### Chart Data Calculations

- **Cash Flow Chart**: project forward using avg_daily_inflow - avg_daily_outflow, subtract known obligations on due dates
- **Revenue trend**: aggregate inflows by week/month
- **Expense breakdown**: group outflows by category (pie chart data)
- **Bucket health**: current vs target for each bucket (bar chart)
- **Discipline trend**: last 30 daily scores (line chart)

---

## Phase 9: Accounts & Transaction History

### Accounts Routes

- `GET /api/accounts` - List linked accounts with balances
- `POST /api/accounts` - Add new account (manual or via bank link)
- `POST /api/accounts/[id]/sync` - Sync balance from Seylan `getAccountBalance`
- `GET /api/accounts/[id]/transactions` - Pull history from Seylan `getTransactionHistory`
- `DELETE /api/accounts/[id]` - Unlink account

### Transaction History Routes

- `GET /api/transactions` - Paginated list (offset, limit, filters: date_from, date_to, direction, category, source, account_id)
- `POST /api/transactions` - Manual entry
- `PATCH /api/transactions/[id]` - Update category, mark personal, add notes
- `GET /api/transactions/summary` - Aggregated totals by period/category for charts

### Auto-categorization

When transactions are ingested (from bank or ERP), auto-assign category based on:

- Counterparty alias matching (e.g., "CEB" -> utilities)
- Amount patterns (e.g., same amount monthly -> recurring)
- Description keywords

---

## Phase 10: Loan Readiness

### Routes

- `GET /api/loan-readiness` - Current score + breakdown
- `GET /api/loan-readiness/report` - Detailed PDF-ready report data
- `GET /api/loan-readiness/recommendations` - AI-generated improvement tips

### Score Components

- Revenue stability: coefficient of variation of monthly income (lower = better)
- Reserve discipline: % of months where reserve stayed above target
- Payment history: % obligations paid on/before due date
- Cash flow trend: 3-month moving average direction
- Owner discipline: salary plan adherence rate
- Debt coverage: monthly_income / monthly_obligations ratio

---

## Phase 11: Settings

### Routes

- `GET /api/settings` - All settings for current org/user
- `PATCH /api/settings/profile` - Update business name, type, timezone, currency
- `PATCH /api/settings/buckets` - Update bucket target percentages (must sum to 100)
- `PATCH /api/settings/salary` - Update owner salary goal
- `PATCH /api/settings/notifications` - Notification preferences (email, push, in-app toggles)
- `PATCH /api/settings/language` - Language preference (en/si/ta)
- `PATCH /api/settings/integrations` - ERP/bank connection settings
- `POST /api/settings/onboarding-complete` - Mark onboarding done

### Stored In

- `business_profiles` table: business_type, target_owner_salary_lkr, onboarding_complete
- `user_settings` table (NEW): language, notification_prefs (jsonb), theme
- `buckets` table: target_pct per bucket

---

## Phase 12: Notifications System

### Generation Triggers (server-side, event-driven)

- **Obligation due soon**: 3 days before due date
- **Obligation overdue**: on due date if unpaid
- **Low reserve warning**: profit_reserve < 50% of target
- **Owner leakage detected**: withdrawal outside salary plan
- **AI insight generated**: new critical/warning insight
- **Payment success/failure**: after Seylan API call
- **ERP sync complete/failed**: after sync job
- **Duplicate payment suspected**: from detection engine
- **Cash runway critical**: < 7 days runway

### Routes

- `GET /api/notifications` - List (paginated, unread_first)
- `PATCH /api/notifications/[id]/read` - Mark as read
- `POST /api/notifications/read-all` - Mark all read
- `GET /api/notifications/unread-count` - Badge count

---

## Phase 13: Subscription & Onboarding

### Subscription Routes

- `GET /api/subscription` - Current subscription status
- `POST /api/subscription/activate` - After successful payment, activate plan
- `GET /api/payments/plans` - Already exists (3 plans: starter/growth/scale)

### Onboarding Route

- `POST /api/onboarding` - Creates org via `create_organization` RPC, sets business type, salary goal, seeds buckets

---

## Phase 14: Wire Frontend to Backend

- Replace `AppDataProvider` mock data with `GET /api/dashboard` fetch
- Replace chat `SCRIPTED_REPLY` with streaming `POST /api/ai/chat`
- Replace subscription page stubs with full JustPay + QR flows
- Wire settings page to `GET/PATCH /api/settings/*`
- Wire obligations page to real CRUD routes
- Wire owner withdrawal page to real routes
- Wire accounts page to sync routes
- Wire history page to paginated transaction API
- Wire loan-readiness page to score API
- Wire insights page to stored insights
- Add notification badge polling
- Add Supabase Realtime subscriptions for live updates (transactions, buckets, insights)

---

## Key Configuration (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

SEYLAN_API_KEY=5e248685-bcd2-4196-8e4a-4e5f03e26324
SEYLAN_SANDBOX_URL=http://34.21.206.87:3000
SEYLAN_SOURCE_ACCOUNT=064000012548001
SEYLAN_INTERNAL_DEST_ACCOUNT=001213437904100
SEYLAN_CEFTS_DEST_ACCOUNT=12345678
SEYLAN_CEFTS_DEST_BANK=6990

GEMINI_API_KEY=AIzaSyDJJ5iqpuc6heNvCqCfYxM36eL7f5aC_0c

ERP_BASE_URL=http://pos.srijaya.lk
ERP_AUTH_METHOD=api_key
ERP_API_KEY=<sb_... key from ERP admin>
```

---

## File Structure (New/Modified Files)

```
src/
  lib/
    ai/
      gemini.ts             -- Gemini API client (privacy-preserving)
      sanitizer.ts          -- Strip PII before sending to AI
      prompts.ts            -- Versioned prompt templates
      safety-filter.ts      -- Block dangerous AI outputs
    erp/
      client.ts             -- ERP HTTP client (auth, snapshot, push)
      types.ts              -- ERP response types
      normalizer.ts         -- ERP data -> SoleBook transactions
    engine/
      allocator.ts          -- Dynamic priority-based allocation
      discipline.ts         -- Financial discipline score computation
      runway.ts             -- Cash runway & risk assessment
      loan-readiness.ts     -- Loan readiness scoring
      duplicate-detection.ts -- Duplicate payment detection
      priority.ts           -- Payment priority ranking
      categories.ts         -- Auto-categorization rules
      notifications.ts      -- Event-driven notification generation
    db/
      queries.ts            -- Typed Supabase query functions (all tables)
  app/
    api/
      ai/
        chat/route.ts            -- Streaming AI chat
        insights/route.ts        -- Generate + list insights
      erp/
        health/route.ts
        auth/route.ts
        sync/route.ts
        status/route.ts
        push/
          expense/route.ts
          grn/route.ts
          invoice/route.ts
      allocations/
        route.ts                 -- GET list
        compute/route.ts         -- POST compute
        approve/route.ts         -- POST approve/reject
      obligations/
        route.ts                 -- GET list, POST create
        upcoming/route.ts        -- GET next 30 days
        generate-recurring/route.ts
        [id]/
          route.ts               -- PATCH, DELETE
          pay/route.ts           -- POST pay via Seylan
      owner/
        withdraw/route.ts        -- POST record, GET history
        salary-status/route.ts   -- GET current month status
        leakage/route.ts         -- GET flagged withdrawals
      dashboard/route.ts         -- GET aggregated dashboard
      transactions/
        route.ts                 -- GET paginated, POST manual
        summary/route.ts         -- GET aggregated by period
        [id]/route.ts            -- PATCH update category
      accounts/
        route.ts                 -- GET list, POST add
        [id]/
          route.ts               -- DELETE unlink
          sync/route.ts          -- POST sync balance
          transactions/route.ts  -- GET bank history
      loan-readiness/
        route.ts                 -- GET score
        report/route.ts          -- GET detailed report
        recommendations/route.ts -- GET AI tips
      notifications/
        route.ts                 -- GET list
        [id]/read/route.ts       -- PATCH mark read
        read-all/route.ts        -- POST mark all
        unread-count/route.ts    -- GET count
      settings/
        route.ts                 -- GET all settings
        profile/route.ts         -- PATCH business profile
        buckets/route.ts         -- PATCH bucket percentages
        salary/route.ts          -- PATCH owner salary goal
        notifications/route.ts   -- PATCH notification prefs
        language/route.ts        -- PATCH language
        integrations/route.ts    -- PATCH ERP/bank config
      subscription/
        route.ts                 -- GET current subscription
        activate/route.ts        -- POST activate after payment
      onboarding/route.ts        -- POST create org + setup
      payments/
        justpay/
          register/route.ts
          verify/route.ts
          certificate/route.ts
          sign/route.ts
          pay/route.ts
          status/route.ts
          refund/route.ts
        lankaqr/
          initiate/route.ts
          status/route.ts
        vmqr/
          initiate/route.ts
          status/route.ts
supabase/
  schema.sql                    -- Single consolidated SQL file
.env.local                      -- All environment variables
```

