-- =====================================================================
-- SoleBook – consolidated schema
--
-- Designed against `.cursor/plans/solebook_layered_architecture_e8dd6b6b.plan.md`:
--   * Multi-tenant org model with explicit RBAC roles.
--   * Normalized canonical transactions + immutable raw source payloads.
--   * Deterministic finance core owns money semantics (allocations,
--     obligations, buckets). LLM outputs are siloed in `insights` and
--     `ai_audit_log` only.
--   * Audit-first: every state change is captured.
--   * Tenant isolation enforced in the DB (RLS), not the UI.
--
-- Sections:
--   A. Extensions, enums, utility functions
--   B. Core tables (tenant model, business, finance, ingestion, AI)
--   C. Realtime publication
--   D. Row Level Security policies
--   E. Helper RPCs + demo seeder
-- =====================================================================


-- =====================================================================
-- A. EXTENSIONS + ENUMS + UTILITY FUNCTIONS
-- =====================================================================

-- ---------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";  -- gen_random_uuid()
create extension if not exists "citext";    -- case-insensitive text

-- Dedicated schema for SoleBook helper functions used by RLS so that
-- they sit outside the auto-exposed `public` REST surface.
create schema if not exists solebook;

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
do $$ begin
  create type org_role as enum (
    'owner',
    'finance',
    'read_only',
    'integration_admin'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type business_type as enum (
    'retail',
    'restaurant',
    'services',
    'manufacturing',
    'wholesale',
    'agriculture',
    'other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type bucket_type as enum (
    'operations',
    'obligations',
    'profit_reserve',
    'owner_salary',
    'growth'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type account_type as enum (
    'bank',
    'cash',
    'virtual_bucket',
    'wallet'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type transaction_direction as enum ('inflow', 'outflow');
exception when duplicate_object then null; end $$;

do $$ begin
  create type transaction_source as enum ('bank', 'pos', 'erp', 'manual');
exception when duplicate_object then null; end $$;

do $$ begin
  create type transaction_status as enum ('pending', 'posted', 'reversed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type obligation_status as enum (
    'upcoming',
    'due_soon',
    'overdue',
    'paid',
    'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type obligation_priority as enum ('high', 'medium', 'low');
exception when duplicate_object then null; end $$;

do $$ begin
  create type obligation_category as enum (
    'rent',
    'payroll',
    'utilities',
    'loan',
    'supplier',
    'tax',
    'subscription',
    'other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type allocation_status as enum (
    'proposed',
    'approved',
    'rejected',
    'applied',
    'superseded'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type allocation_trigger as enum (
    'income_detected',
    'scheduled',
    'manual',
    'recompute'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type integration_type as enum ('bank', 'pos', 'erp');
exception when duplicate_object then null; end $$;

do $$ begin
  create type integration_status as enum (
    'pending',
    'active',
    'error',
    'revoked',
    'expired'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type insight_category as enum (
    'cash_risk',
    'discipline',
    'leakage',
    'supplier_risk',
    'reserve_health',
    'forecast',
    'recommendation',
    'fraud_signal',
    'other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type insight_severity as enum ('info', 'warning', 'critical');
exception when duplicate_object then null; end $$;

do $$ begin
  create type risk_band as enum ('low', 'medium', 'high');
exception when duplicate_object then null; end $$;

do $$ begin
  create type audit_outcome as enum ('success', 'failure', 'denied');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_type as enum (
    'obligation_due',
    'obligation_overdue',
    'low_reserve',
    'owner_leakage',
    'ai_insight',
    'payment_success',
    'payment_failure',
    'erp_sync_complete',
    'erp_sync_failed',
    'duplicate_payment',
    'cash_runway_critical',
    'general'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- Shared utility: updated_at trigger
-- ---------------------------------------------------------------------
create or replace function solebook.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;


-- =====================================================================
-- B. CORE TABLES
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tenant model
-- ---------------------------------------------------------------------
create table if not exists public.organizations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          citext not null unique,
  country_code  text not null default 'LK',
  currency      text not null default 'LKR',
  timezone      text not null default 'Asia/Colombo',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

drop trigger if exists trg_organizations_updated_at on public.organizations;
create trigger trg_organizations_updated_at
before update on public.organizations
for each row execute function solebook.set_updated_at();

create table if not exists public.organization_members (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       org_role not null default 'owner',
  invited_by uuid references auth.users(id),
  joined_at  timestamptz not null default now(),
  unique (org_id, user_id)
);

create index if not exists idx_org_members_user on public.organization_members(user_id);
create index if not exists idx_org_members_org on public.organization_members(org_id);

-- ---------------------------------------------------------------------
-- 2. Helper functions used by RLS policies
--    SECURITY DEFINER so they can read membership without recursing
--    through RLS on the membership table itself.
-- ---------------------------------------------------------------------
create or replace function solebook.is_org_member(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.org_id = p_org
      and m.user_id = auth.uid()
  );
$$;

create or replace function solebook.has_org_role(p_org uuid, p_roles org_role[])
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.org_id = p_org
      and m.user_id = auth.uid()
      and m.role = any(p_roles)
  );
$$;

create or replace function solebook.current_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select org_id
  from public.organization_members
  where user_id = auth.uid();
$$;

revoke all on function solebook.is_org_member(uuid) from public;
grant execute on function solebook.is_org_member(uuid) to authenticated, service_role;

revoke all on function solebook.has_org_role(uuid, org_role[]) from public;
grant execute on function solebook.has_org_role(uuid, org_role[]) to authenticated, service_role;

revoke all on function solebook.current_org_ids() from public;
grant execute on function solebook.current_org_ids() to authenticated, service_role;

-- ---------------------------------------------------------------------
-- 3. Business profile (one per org)
-- ---------------------------------------------------------------------
create table if not exists public.business_profiles (
  id                       uuid primary key default gen_random_uuid(),
  org_id                   uuid not null unique references public.organizations(id) on delete cascade,
  business_type            business_type not null default 'other',
  target_owner_salary_lkr  numeric(18,2) not null default 0,
  monthly_revenue_band     text,
  staff_count_band         text,
  onboarding_complete      boolean not null default false,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

drop trigger if exists trg_business_profiles_updated_at on public.business_profiles;
create trigger trg_business_profiles_updated_at
before update on public.business_profiles
for each row execute function solebook.set_updated_at();

-- ---------------------------------------------------------------------
-- 4. Accounts (bank / cash / virtual buckets)
--    NOTE: never store full PAN/IBAN here. Use masked 4 digits + a
--    pointer to a secrets vault (see integration_credentials_ref).
-- ---------------------------------------------------------------------
create table if not exists public.accounts (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  type            account_type not null default 'bank',
  bank_name       text,
  account_mask    text,
  currency        text not null default 'LKR',
  current_balance numeric(18,2) not null default 0,
  is_primary      boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint accounts_mask_short check (account_mask is null or char_length(account_mask) <= 8)
);

create index if not exists idx_accounts_org on public.accounts(org_id);

drop trigger if exists trg_accounts_updated_at on public.accounts;
create trigger trg_accounts_updated_at
before update on public.accounts
for each row execute function solebook.set_updated_at();

create unique index if not exists uq_accounts_primary_per_org
  on public.accounts(org_id)
  where is_primary;

-- ---------------------------------------------------------------------
-- 5. Integrations (bank / POS / ERP connectors)
--    Tokens/credentials live in a secrets manager (Supabase Vault or
--    external KMS). We only store a *reference* here.
-- ---------------------------------------------------------------------
create table if not exists public.integrations (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references public.organizations(id) on delete cascade,
  type             integration_type not null,
  provider         text not null,
  display_name     text not null,
  status           integration_status not null default 'pending',
  consent_scopes   text[] not null default array[]::text[],
  webhook_secret_ref text,
  oauth_secret_ref   text,
  last_synced_at   timestamptz,
  last_error       text,
  created_by       uuid references auth.users(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_integrations_org on public.integrations(org_id);
create index if not exists idx_integrations_type_status on public.integrations(type, status);

drop trigger if exists trg_integrations_updated_at on public.integrations;
create trigger trg_integrations_updated_at
before update on public.integrations
for each row execute function solebook.set_updated_at();

-- ---------------------------------------------------------------------
-- 6. Ingestion plane
--    transactions_raw  = immutable, append-only source payloads
--    transactions      = normalized canonical view used by the engine
--    webhook_events    = inbound webhook envelope (HMAC outcome, etc.)
--    idempotency_keys  = replay protection for ingestion + actions
-- ---------------------------------------------------------------------
create table if not exists public.transactions_raw (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations(id) on delete cascade,
  integration_id  uuid references public.integrations(id) on delete set null,
  source          transaction_source not null,
  external_id     text not null,
  payload         jsonb not null,
  received_at     timestamptz not null default now(),
  ingested_at     timestamptz not null default now(),
  unique (org_id, source, external_id)
);

create index if not exists idx_tx_raw_org_received on public.transactions_raw(org_id, received_at desc);

create table if not exists public.transactions (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null references public.organizations(id) on delete cascade,
  account_id         uuid references public.accounts(id) on delete set null,
  raw_id             uuid references public.transactions_raw(id) on delete set null,
  direction          transaction_direction not null,
  amount_lkr         numeric(18,2) not null check (amount_lkr >= 0),
  currency           text not null default 'LKR',
  occurred_at        timestamptz not null,
  description_clean  text,
  counterparty_alias text,
  category           text,
  source             transaction_source not null,
  is_personal        boolean not null default false,
  is_duplicate_of    uuid references public.transactions(id) on delete set null,
  status             transaction_status not null default 'posted',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists idx_tx_org_occurred on public.transactions(org_id, occurred_at desc);
create index if not exists idx_tx_account_occurred on public.transactions(account_id, occurred_at desc);
create index if not exists idx_tx_org_direction on public.transactions(org_id, direction);
create index if not exists idx_tx_dedup_lookup on public.transactions(org_id, amount_lkr, occurred_at);

drop trigger if exists trg_transactions_updated_at on public.transactions;
create trigger trg_transactions_updated_at
before update on public.transactions
for each row execute function solebook.set_updated_at();

create table if not exists public.webhook_events (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid references public.organizations(id) on delete cascade,
  integration_id      uuid references public.integrations(id) on delete set null,
  provider            text not null,
  event_type          text not null,
  signature_verified  boolean not null default false,
  received_at         timestamptz not null default now(),
  processed_at        timestamptz,
  raw_id              uuid references public.transactions_raw(id) on delete set null,
  error               text
);

create index if not exists idx_webhook_events_org_received on public.webhook_events(org_id, received_at desc);

create table if not exists public.idempotency_keys (
  key            text primary key,
  org_id         uuid references public.organizations(id) on delete cascade,
  scope          text not null,
  response_hash  text,
  created_at     timestamptz not null default now(),
  expires_at     timestamptz not null default (now() + interval '7 days')
);

create index if not exists idx_idempotency_org_scope on public.idempotency_keys(org_id, scope);

-- ---------------------------------------------------------------------
-- 7. Smart buckets, allocations, obligations, owner salary
--    Money semantics are computed here in the deterministic core.
-- ---------------------------------------------------------------------
create table if not exists public.buckets (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null references public.organizations(id) on delete cascade,
  type               bucket_type not null,
  name               text not null,
  target_pct         numeric(5,2) not null default 0 check (target_pct >= 0 and target_pct <= 100),
  current_balance_lkr numeric(18,2) not null default 0,
  target_minimum_lkr numeric(18,2) not null default 0,
  display_order      smallint not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (org_id, type)
);

create index if not exists idx_buckets_org on public.buckets(org_id);

drop trigger if exists trg_buckets_updated_at on public.buckets;
create trigger trg_buckets_updated_at
before update on public.buckets
for each row execute function solebook.set_updated_at();

create table if not exists public.allocations (
  id                    uuid primary key default gen_random_uuid(),
  org_id                uuid not null references public.organizations(id) on delete cascade,
  trigger               allocation_trigger not null,
  source_transaction_id uuid references public.transactions(id) on delete set null,
  total_amount_lkr      numeric(18,2) not null check (total_amount_lkr >= 0),
  status                allocation_status not null default 'proposed',
  engine_version        text not null default 'v1',
  explanation           text,
  proposed_at           timestamptz not null default now(),
  decided_at            timestamptz,
  decided_by            uuid references auth.users(id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_allocations_org_status on public.allocations(org_id, status);
create index if not exists idx_allocations_org_proposed on public.allocations(org_id, proposed_at desc);

drop trigger if exists trg_allocations_updated_at on public.allocations;
create trigger trg_allocations_updated_at
before update on public.allocations
for each row execute function solebook.set_updated_at();

create table if not exists public.allocation_lines (
  id                   uuid primary key default gen_random_uuid(),
  allocation_id        uuid not null references public.allocations(id) on delete cascade,
  bucket_id            uuid not null references public.buckets(id) on delete restrict,
  proposed_amount_lkr  numeric(18,2) not null default 0,
  approved_amount_lkr  numeric(18,2),
  reason_code          text,
  unique (allocation_id, bucket_id)
);

create index if not exists idx_alloc_lines_alloc on public.allocation_lines(allocation_id);

create table if not exists public.obligations (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null references public.organizations(id) on delete cascade,
  bucket_id          uuid references public.buckets(id) on delete set null,
  category           obligation_category not null,
  counterparty_alias text,
  amount_lkr         numeric(18,2) not null check (amount_lkr >= 0),
  due_date           date not null,
  priority           obligation_priority not null default 'medium',
  status             obligation_status not null default 'upcoming',
  recurrence         text,
  notes              text,
  paid_at            timestamptz,
  paid_transaction_id uuid references public.transactions(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists idx_obligations_org_due on public.obligations(org_id, due_date);
create index if not exists idx_obligations_org_status on public.obligations(org_id, status);

drop trigger if exists trg_obligations_updated_at on public.obligations;
create trigger trg_obligations_updated_at
before update on public.obligations
for each row execute function solebook.set_updated_at();

create table if not exists public.owner_withdrawals (
  id                      uuid primary key default gen_random_uuid(),
  org_id                  uuid not null references public.organizations(id) on delete cascade,
  amount_lkr              numeric(18,2) not null check (amount_lkr >= 0),
  withdrawn_at            timestamptz not null,
  is_within_salary_plan   boolean not null default true,
  transaction_id          uuid references public.transactions(id) on delete set null,
  recorded_by             uuid references auth.users(id),
  notes                   text,
  created_at              timestamptz not null default now()
);

create index if not exists idx_owner_withdrawals_org_when on public.owner_withdrawals(org_id, withdrawn_at desc);

-- ---------------------------------------------------------------------
-- 8. AI insights + discipline score
--    Insights are the *only* surface the LLM directly populates.
--    Everything that affects money is computed by the deterministic
--    engine (allocations, buckets, obligations).
-- ---------------------------------------------------------------------
create table if not exists public.discipline_scores (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  snapshot_date date not null,
  score         smallint not null check (score between 0 and 100),
  components    jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  unique (org_id, snapshot_date)
);

create index if not exists idx_discipline_org_date on public.discipline_scores(org_id, snapshot_date desc);

create table if not exists public.insights (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references public.organizations(id) on delete cascade,
  category            insight_category not null,
  severity            insight_severity not null default 'info',
  title               text not null,
  body                text,
  machine_reason_code text,
  payload             jsonb not null default '{}'::jsonb,
  generated_by        text not null default 'rules',
  ai_audit_id         bigint,
  acknowledged_by     uuid references auth.users(id),
  acknowledged_at     timestamptz,
  expires_at          timestamptz,
  generated_at        timestamptz not null default now()
);

create index if not exists idx_insights_org_generated on public.insights(org_id, generated_at desc);
create index if not exists idx_insights_org_severity on public.insights(org_id, severity);

-- ---------------------------------------------------------------------
-- 9. Audit log (immutable) + AI-specific audit log
--    These tables are append-only at the policy level (see RLS).
-- ---------------------------------------------------------------------
create table if not exists public.audit_log (
  id             bigint generated always as identity primary key,
  org_id         uuid references public.organizations(id) on delete set null,
  actor_user_id  uuid references auth.users(id) on delete set null,
  action         text not null,
  resource_type  text,
  resource_id    text,
  outcome        audit_outcome not null default 'success',
  ip_address     inet,
  user_agent     text,
  metadata       jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);

create index if not exists idx_audit_org_created on public.audit_log(org_id, created_at desc);
create index if not exists idx_audit_action on public.audit_log(action);

create table if not exists public.ai_audit_log (
  id                       bigint generated always as identity primary key,
  org_id                   uuid references public.organizations(id) on delete set null,
  actor_user_id            uuid references auth.users(id) on delete set null,
  model_id                 text not null,
  prompt_template_version  text not null,
  context_schema_version   text not null,
  context_hash             text not null,
  rbac_role                org_role,
  input_class              text,
  policy_version           text,
  output_hash              text,
  output_passed_safety     boolean not null default true,
  denied_reasons           text[] not null default array[]::text[],
  latency_ms               integer,
  created_at               timestamptz not null default now()
);

create index if not exists idx_ai_audit_org_created on public.ai_audit_log(org_id, created_at desc);

-- Late-bound FK so insights can reference ai_audit_log without a
-- circular dependency at create-time.
do $$ begin
  alter table public.insights
    add constraint insights_ai_audit_fk
    foreign key (ai_audit_id) references public.ai_audit_log(id) on delete set null;
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- 10. Additional domain tables
-- ---------------------------------------------------------------------

-- 10a. Waitlist (pre-launch signups) --------------------------------
create table if not exists public.waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      citext not null unique,
  name       text,
  business_type text,
  referral_source text,
  created_at timestamptz not null default now()
);

-- 10b. ERP Sync Log -------------------------------------------------
create table if not exists public.erp_sync_log (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  sync_type     text not null default 'snapshot',
  status        text not null default 'pending',
  data_hash     text,
  records_pulled integer default 0,
  records_pushed integer default 0,
  error         text,
  started_at    timestamptz not null default now(),
  completed_at  timestamptz
);

create index if not exists idx_erp_sync_org on public.erp_sync_log(org_id, started_at desc);

-- 10c. Chat Messages (AI chat history) ------------------------------
create table if not exists public.chat_messages (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  role          text not null check (role in ('user', 'assistant', 'system')),
  content       text not null,
  context_hash  text,
  model_id      text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_chat_org_user on public.chat_messages(org_id, user_id, created_at desc);

-- 10d. Notifications ------------------------------------------------
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete cascade,
  type       notification_type not null default 'general',
  title      text not null,
  body       text,
  metadata   jsonb not null default '{}'::jsonb,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_org_unread on public.notifications(org_id, created_at desc) where read_at is null;
create index if not exists idx_notifications_user on public.notifications(user_id, created_at desc);

-- 10e. User Settings (per-user preferences) -------------------------
create table if not exists public.user_settings (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null unique references auth.users(id) on delete cascade,
  language          text not null default 'en',
  theme             text not null default 'system',
  notification_prefs jsonb not null default '{"email":true,"push":true,"in_app":true}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

drop trigger if exists trg_user_settings_updated_at on public.user_settings;
create trigger trg_user_settings_updated_at
before update on public.user_settings
for each row execute function solebook.set_updated_at();

-- 10f. Expense Categories (configurable per org) --------------------
create table if not exists public.expense_categories (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  name       text not null,
  group_name text not null default 'other',
  icon       text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_expense_categories_org on public.expense_categories(org_id);

-- 10g. TOTP Secrets (2FA via Google Authenticator) ------------------
create table if not exists public.totp_secrets (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null unique references auth.users(id) on delete cascade,
  encrypted_secret text not null,
  verified_at      timestamptz,
  backup_codes     text[] not null default array[]::text[],
  failed_attempts  integer not null default 0,
  locked_until     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

drop trigger if exists trg_totp_secrets_updated_at on public.totp_secrets;
create trigger trg_totp_secrets_updated_at
before update on public.totp_secrets
for each row execute function solebook.set_updated_at();

-- 10h. WebAuthn Credentials (biometric / passkey authentication) ----
create table if not exists public.webauthn_credentials (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  credential_id   text not null unique,
  public_key      text not null,
  sign_count      integer not null default 0,
  device_name     text,
  transports      text[],
  created_at      timestamptz not null default now(),
  last_used_at    timestamptz
);

create index if not exists idx_webauthn_user on public.webauthn_credentials(user_id);

-- 10i. User Sessions (multi-device tracking) ------------------------
create table if not exists public.user_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  device_info   text,
  ip_address    inet,
  user_agent    text,
  last_active   timestamptz not null default now(),
  revoked_at    timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists idx_user_sessions_user on public.user_sessions(user_id, last_active desc);


-- =====================================================================
-- C. REALTIME PUBLICATION
-- =====================================================================
-- Opt-in tables the frontend can subscribe to.
-- Supabase pre-creates an empty `supabase_realtime` publication on
-- every project, so we ADD tables to it (idempotently) rather than
-- attempting to CREATE the publication.
-- ---------------------------------------------------------------------
do $$
declare
  v_tables text[] := array[
    'transactions',
    'buckets',
    'allocations',
    'obligations',
    'insights',
    'discipline_scores',
    'notifications',
    'chat_messages'
  ];
  v_table  text;
begin
  if not exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    create publication supabase_realtime;
  end if;

  foreach v_table in array v_tables loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = v_table
    ) then
      execute format('alter publication supabase_realtime add table public.%I', v_table);
    end if;
  end loop;
exception when insufficient_privilege then
  null;
end $$;


-- =====================================================================
-- D. ROW LEVEL SECURITY
-- =====================================================================
--
-- Conventions:
--   * `authenticated` role = logged-in end users via Supabase Auth.
--     Subject to RLS.
--   * `service_role`     = server-side ingestion workers, cron jobs,
--                          and admin tooling. Bypasses RLS by default;
--                          we additionally grant explicit privileges.
--   * `anon`             = pre-login PWA visitors. Granted nothing
--                          except where explicitly noted (e.g. waitlist).
-- ---------------------------------------------------------------------

-- Lock down the default surface, then re-grant table-by-table.
revoke all on schema public from public;
grant usage on schema public to anon, authenticated, service_role;

revoke all on schema solebook from public;
grant usage on schema solebook to authenticated, service_role;

-- ---------------------------------------------------------------------
-- Enable RLS on every business table.
-- ---------------------------------------------------------------------
alter table public.organizations          enable row level security;
alter table public.organization_members   enable row level security;
alter table public.business_profiles      enable row level security;
alter table public.accounts               enable row level security;
alter table public.integrations           enable row level security;
alter table public.transactions_raw       enable row level security;
alter table public.transactions           enable row level security;
alter table public.webhook_events         enable row level security;
alter table public.idempotency_keys       enable row level security;
alter table public.buckets                enable row level security;
alter table public.allocations            enable row level security;
alter table public.allocation_lines       enable row level security;
alter table public.obligations            enable row level security;
alter table public.owner_withdrawals      enable row level security;
alter table public.discipline_scores      enable row level security;
alter table public.insights               enable row level security;
alter table public.audit_log              enable row level security;
alter table public.ai_audit_log           enable row level security;

alter table public.audit_log     force row level security;
alter table public.ai_audit_log  force row level security;

-- ---------------------------------------------------------------------
-- Table-level grants for the authenticated role.
-- ---------------------------------------------------------------------
grant select, insert, update, delete on
  public.organizations,
  public.organization_members,
  public.business_profiles,
  public.accounts,
  public.integrations,
  public.transactions,
  public.buckets,
  public.allocations,
  public.allocation_lines,
  public.obligations,
  public.owner_withdrawals,
  public.insights
to authenticated;

grant select on
  public.audit_log,
  public.ai_audit_log,
  public.transactions_raw,
  public.webhook_events,
  public.discipline_scores,
  public.idempotency_keys
to authenticated;

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- ---------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------
drop policy if exists "org_select_member" on public.organizations;
create policy "org_select_member"
on public.organizations
for select
to authenticated
using (solebook.is_org_member(id));

drop policy if exists "org_insert_self" on public.organizations;
create policy "org_insert_self"
on public.organizations
for insert
to authenticated
with check (true);

drop policy if exists "org_update_owner" on public.organizations;
create policy "org_update_owner"
on public.organizations
for update
to authenticated
using (solebook.has_org_role(id, array['owner']::org_role[]))
with check (solebook.has_org_role(id, array['owner']::org_role[]));

drop policy if exists "org_delete_owner" on public.organizations;
create policy "org_delete_owner"
on public.organizations
for delete
to authenticated
using (solebook.has_org_role(id, array['owner']::org_role[]));

-- ---------------------------------------------------------------------
-- organization_members
-- ---------------------------------------------------------------------
drop policy if exists "members_select_same_org" on public.organization_members;
create policy "members_select_same_org"
on public.organization_members
for select
to authenticated
using (solebook.is_org_member(org_id) or user_id = auth.uid());

drop policy if exists "members_insert_owner" on public.organization_members;
create policy "members_insert_owner"
on public.organization_members
for insert
to authenticated
with check (
  solebook.has_org_role(org_id, array['owner']::org_role[])
  or (user_id = auth.uid() and role = 'owner' and not exists (
        select 1 from public.organization_members existing
        where existing.org_id = organization_members.org_id
     ))
);

drop policy if exists "members_update_owner" on public.organization_members;
create policy "members_update_owner"
on public.organization_members
for update
to authenticated
using (solebook.has_org_role(org_id, array['owner']::org_role[]))
with check (solebook.has_org_role(org_id, array['owner']::org_role[]));

drop policy if exists "members_delete_owner_or_self" on public.organization_members;
create policy "members_delete_owner_or_self"
on public.organization_members
for delete
to authenticated
using (
  solebook.has_org_role(org_id, array['owner']::org_role[])
  or user_id = auth.uid()
);

-- business_profiles --------------------------------------------------
drop policy if exists "bp_select" on public.business_profiles;
create policy "bp_select" on public.business_profiles
for select to authenticated
using (solebook.is_org_member(org_id));

drop policy if exists "bp_write" on public.business_profiles;
create policy "bp_write" on public.business_profiles
for all to authenticated
using (solebook.has_org_role(org_id, array['owner','finance']::org_role[]))
with check (solebook.has_org_role(org_id, array['owner','finance']::org_role[]));

-- accounts -----------------------------------------------------------
drop policy if exists "accounts_select" on public.accounts;
create policy "accounts_select" on public.accounts
for select to authenticated
using (solebook.is_org_member(org_id));

drop policy if exists "accounts_write" on public.accounts;
create policy "accounts_write" on public.accounts
for all to authenticated
using (solebook.has_org_role(org_id, array['owner','finance','integration_admin']::org_role[]))
with check (solebook.has_org_role(org_id, array['owner','finance','integration_admin']::org_role[]));

-- integrations -------------------------------------------------------
drop policy if exists "integrations_select" on public.integrations;
create policy "integrations_select" on public.integrations
for select to authenticated
using (solebook.is_org_member(org_id));

drop policy if exists "integrations_write" on public.integrations;
create policy "integrations_write" on public.integrations
for all to authenticated
using (solebook.has_org_role(org_id, array['owner','integration_admin']::org_role[]))
with check (solebook.has_org_role(org_id, array['owner','integration_admin']::org_role[]));

-- transactions_raw (server-managed; read-only for users) -------------
drop policy if exists "tx_raw_select" on public.transactions_raw;
create policy "tx_raw_select" on public.transactions_raw
for select to authenticated
using (solebook.has_org_role(org_id, array['owner','finance','integration_admin']::org_role[]));

-- transactions -------------------------------------------------------
drop policy if exists "tx_select" on public.transactions;
create policy "tx_select" on public.transactions
for select to authenticated
using (solebook.is_org_member(org_id));

drop policy if exists "tx_write" on public.transactions;
create policy "tx_write" on public.transactions
for all to authenticated
using (solebook.has_org_role(org_id, array['owner','finance']::org_role[]))
with check (solebook.has_org_role(org_id, array['owner','finance']::org_role[]));

-- webhook_events (server-managed; visible to integration_admin) ------
drop policy if exists "webhook_select" on public.webhook_events;
create policy "webhook_select" on public.webhook_events
for select to authenticated
using (solebook.has_org_role(org_id, array['owner','integration_admin']::org_role[]));

-- idempotency_keys (server-only operationally; finance/owner view) ---
drop policy if exists "idem_select" on public.idempotency_keys;
create policy "idem_select" on public.idempotency_keys
for select to authenticated
using (org_id is not null and solebook.has_org_role(org_id, array['owner']::org_role[]));

-- buckets ------------------------------------------------------------
drop policy if exists "buckets_select" on public.buckets;
create policy "buckets_select" on public.buckets
for select to authenticated
using (solebook.is_org_member(org_id));

drop policy if exists "buckets_write" on public.buckets;
create policy "buckets_write" on public.buckets
for all to authenticated
using (solebook.has_org_role(org_id, array['owner','finance']::org_role[]))
with check (solebook.has_org_role(org_id, array['owner','finance']::org_role[]));

-- allocations --------------------------------------------------------
drop policy if exists "alloc_select" on public.allocations;
create policy "alloc_select" on public.allocations
for select to authenticated
using (solebook.is_org_member(org_id));

drop policy if exists "alloc_write" on public.allocations;
create policy "alloc_write" on public.allocations
for all to authenticated
using (solebook.has_org_role(org_id, array['owner','finance']::org_role[]))
with check (solebook.has_org_role(org_id, array['owner','finance']::org_role[]));

-- allocation_lines (mirrors parent allocation's org_id) --------------
drop policy if exists "alloc_lines_select" on public.allocation_lines;
create policy "alloc_lines_select" on public.allocation_lines
for select to authenticated
using (
  exists (
    select 1
    from public.allocations a
    where a.id = allocation_lines.allocation_id
      and solebook.is_org_member(a.org_id)
  )
);

drop policy if exists "alloc_lines_write" on public.allocation_lines;
create policy "alloc_lines_write" on public.allocation_lines
for all to authenticated
using (
  exists (
    select 1
    from public.allocations a
    where a.id = allocation_lines.allocation_id
      and solebook.has_org_role(a.org_id, array['owner','finance']::org_role[])
  )
)
with check (
  exists (
    select 1
    from public.allocations a
    where a.id = allocation_lines.allocation_id
      and solebook.has_org_role(a.org_id, array['owner','finance']::org_role[])
  )
);

-- obligations --------------------------------------------------------
drop policy if exists "obligations_select" on public.obligations;
create policy "obligations_select" on public.obligations
for select to authenticated
using (solebook.is_org_member(org_id));

drop policy if exists "obligations_write" on public.obligations;
create policy "obligations_write" on public.obligations
for all to authenticated
using (solebook.has_org_role(org_id, array['owner','finance']::org_role[]))
with check (solebook.has_org_role(org_id, array['owner','finance']::org_role[]));

-- owner_withdrawals --------------------------------------------------
drop policy if exists "owner_w_select" on public.owner_withdrawals;
create policy "owner_w_select" on public.owner_withdrawals
for select to authenticated
using (solebook.has_org_role(org_id, array['owner','finance']::org_role[]));

drop policy if exists "owner_w_write" on public.owner_withdrawals;
create policy "owner_w_write" on public.owner_withdrawals
for all to authenticated
using (solebook.has_org_role(org_id, array['owner','finance']::org_role[]))
with check (solebook.has_org_role(org_id, array['owner','finance']::org_role[]));

-- discipline_scores (read-only to users; written by engine) ----------
drop policy if exists "discipline_select" on public.discipline_scores;
create policy "discipline_select" on public.discipline_scores
for select to authenticated
using (solebook.is_org_member(org_id));

-- insights -----------------------------------------------------------
drop policy if exists "insights_select" on public.insights;
create policy "insights_select" on public.insights
for select to authenticated
using (solebook.is_org_member(org_id));

drop policy if exists "insights_ack" on public.insights;
create policy "insights_ack" on public.insights
for update
to authenticated
using (solebook.is_org_member(org_id))
with check (solebook.is_org_member(org_id));

-- audit_log + ai_audit_log (append-only for end users) ---------------
drop policy if exists "audit_select" on public.audit_log;
create policy "audit_select" on public.audit_log
for select to authenticated
using (org_id is not null and solebook.has_org_role(org_id, array['owner','finance','integration_admin']::org_role[]));

drop policy if exists "ai_audit_select" on public.ai_audit_log;
create policy "ai_audit_select" on public.ai_audit_log
for select to authenticated
using (org_id is not null and solebook.has_org_role(org_id, array['owner','finance','integration_admin']::org_role[]));

-- ---------------------------------------------------------------------
-- RLS for new tables
-- ---------------------------------------------------------------------

-- waitlist (public insert for pre-launch, select for admin) ----------
alter table public.waitlist enable row level security;
grant insert on public.waitlist to anon, authenticated;
grant select on public.waitlist to authenticated;

drop policy if exists "waitlist_insert" on public.waitlist;
create policy "waitlist_insert" on public.waitlist
for insert to anon, authenticated
with check (true);

drop policy if exists "waitlist_select" on public.waitlist;
create policy "waitlist_select" on public.waitlist
for select to authenticated
using (true);

-- erp_sync_log -------------------------------------------------------
alter table public.erp_sync_log enable row level security;
grant select on public.erp_sync_log to authenticated;

drop policy if exists "erp_sync_select" on public.erp_sync_log;
create policy "erp_sync_select" on public.erp_sync_log
for select to authenticated
using (solebook.has_org_role(org_id, array['owner','finance','integration_admin']::org_role[]));

-- chat_messages ------------------------------------------------------
alter table public.chat_messages enable row level security;
grant select, insert on public.chat_messages to authenticated;

drop policy if exists "chat_select" on public.chat_messages;
create policy "chat_select" on public.chat_messages
for select to authenticated
using (user_id = auth.uid() and solebook.is_org_member(org_id));

drop policy if exists "chat_insert" on public.chat_messages;
create policy "chat_insert" on public.chat_messages
for insert to authenticated
with check (user_id = auth.uid() and solebook.is_org_member(org_id));

-- notifications ------------------------------------------------------
alter table public.notifications enable row level security;
grant select, update on public.notifications to authenticated;

drop policy if exists "notifications_select" on public.notifications;
create policy "notifications_select" on public.notifications
for select to authenticated
using (solebook.is_org_member(org_id) and (user_id is null or user_id = auth.uid()));

drop policy if exists "notifications_update" on public.notifications;
create policy "notifications_update" on public.notifications
for update to authenticated
using (solebook.is_org_member(org_id) and (user_id is null or user_id = auth.uid()));

-- user_settings ------------------------------------------------------
alter table public.user_settings enable row level security;
grant select, insert, update on public.user_settings to authenticated;

drop policy if exists "user_settings_own" on public.user_settings;
create policy "user_settings_own" on public.user_settings
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- expense_categories -------------------------------------------------
alter table public.expense_categories enable row level security;
grant select, insert, update, delete on public.expense_categories to authenticated;

drop policy if exists "expense_cat_select" on public.expense_categories;
create policy "expense_cat_select" on public.expense_categories
for select to authenticated
using (solebook.is_org_member(org_id));

drop policy if exists "expense_cat_write" on public.expense_categories;
create policy "expense_cat_write" on public.expense_categories
for all to authenticated
using (solebook.has_org_role(org_id, array['owner','finance']::org_role[]))
with check (solebook.has_org_role(org_id, array['owner','finance']::org_role[]));

-- totp_secrets (user's own only) -------------------------------------
alter table public.totp_secrets enable row level security;
grant select, insert, update, delete on public.totp_secrets to authenticated;

drop policy if exists "totp_own" on public.totp_secrets;
create policy "totp_own" on public.totp_secrets
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- webauthn_credentials (user's own only) -----------------------------
alter table public.webauthn_credentials enable row level security;
grant select, insert, update, delete on public.webauthn_credentials to authenticated;

drop policy if exists "webauthn_own" on public.webauthn_credentials;
create policy "webauthn_own" on public.webauthn_credentials
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- user_sessions (user's own only) ------------------------------------
alter table public.user_sessions enable row level security;
grant select, insert, update on public.user_sessions to authenticated;

drop policy if exists "sessions_own" on public.user_sessions;
create policy "sessions_own" on public.user_sessions
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());


-- =====================================================================
-- E. HELPER RPCs + DEMO SEEDER
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Atomic org-creation RPC
--    Creates the organization row and the owner membership in one
--    transaction so the creator never observes a half-built state.
-- ---------------------------------------------------------------------
create or replace function solebook.create_organization(
  p_name          text,
  p_slug          text default null,
  p_country_code  text default 'LK',
  p_currency      text default 'LKR',
  p_timezone      text default 'Asia/Colombo',
  p_business_type business_type default 'other'
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user uuid := auth.uid();
  v_org  uuid;
  v_slug citext;
begin
  if v_user is null then
    raise exception 'create_organization requires an authenticated user';
  end if;

  v_slug := coalesce(
    nullif(trim(p_slug), ''),
    lower(regexp_replace(p_name, '[^a-zA-Z0-9]+', '-', 'g'))
      || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)
  )::citext;

  insert into public.organizations (name, slug, country_code, currency, timezone)
  values (p_name, v_slug, p_country_code, p_currency, p_timezone)
  returning id into v_org;

  insert into public.organization_members (org_id, user_id, role)
  values (v_org, v_user, 'owner');

  insert into public.business_profiles (org_id, business_type)
  values (v_org, p_business_type)
  on conflict (org_id) do nothing;

  perform solebook.seed_default_buckets(v_org);

  insert into public.audit_log (org_id, actor_user_id, action, resource_type, resource_id, metadata)
  values (
    v_org,
    v_user,
    'organization.created',
    'organization',
    v_org::text,
    jsonb_build_object('slug', v_slug, 'business_type', p_business_type)
  );

  return v_org;
end;
$$;

revoke all on function solebook.create_organization(text, text, text, text, text, business_type) from public;
grant execute on function solebook.create_organization(text, text, text, text, text, business_type)
  to authenticated, service_role;

-- Public wrapper so the RPC is reachable through PostgREST without
-- having to add `solebook` to API → Exposed schemas. The wrapper
-- simply forwards to the SECURITY DEFINER implementation.
create or replace function public.create_organization(
  p_name          text,
  p_slug          text default null,
  p_country_code  text default 'LK',
  p_currency      text default 'LKR',
  p_timezone      text default 'Asia/Colombo',
  p_business_type business_type default 'other'
)
returns uuid
language sql
security invoker
as $$
  select solebook.create_organization(
    p_name, p_slug, p_country_code, p_currency, p_timezone, p_business_type
  );
$$;

revoke all on function public.create_organization(text, text, text, text, text, business_type) from public;
grant execute on function public.create_organization(text, text, text, text, text, business_type)
  to authenticated, service_role;

-- ---------------------------------------------------------------------
-- 2. Default bucket seeder
--    The 5 canonical buckets from the implementation plan, with
--    reasonable starting percentages for a small Sri Lankan SME.
--    These are *defaults*; the engine and the owner can adjust later.
-- ---------------------------------------------------------------------
create or replace function solebook.seed_default_buckets(p_org uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.buckets (org_id, type, name, target_pct, display_order)
  values
    (p_org, 'operations',     'Operations',     45, 1),
    (p_org, 'obligations',    'Obligations',    25, 2),
    (p_org, 'profit_reserve', 'Profit Reserve', 10, 3),
    (p_org, 'owner_salary',   'Owner Salary',   15, 4),
    (p_org, 'growth',         'Growth',          5, 5)
  on conflict (org_id, type) do nothing;
end;
$$;

revoke all on function solebook.seed_default_buckets(uuid) from public;
grant execute on function solebook.seed_default_buckets(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------
-- 3. Demo seeder (hackathon)
--    Idempotent: safe to re-run; clears prior demo rows for this org
--    in the demo-relevant tables and re-inserts a deterministic set.
--    Restricted to service_role to keep prod-paths clean.
-- ---------------------------------------------------------------------
create or replace function solebook.seed_demo_data(p_org uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account            uuid;
  v_bucket_ops         uuid;
  v_bucket_oblig       uuid;
  v_bucket_reserve     uuid;
  v_bucket_owner       uuid;
  v_bucket_growth      uuid;
  v_tx_income          uuid;
  v_allocation         uuid;
begin
  if not exists (select 1 from public.organizations where id = p_org) then
    raise exception 'seed_demo_data: organization % does not exist', p_org;
  end if;

  -- Ensure buckets exist.
  perform solebook.seed_default_buckets(p_org);

  select id into v_bucket_ops     from public.buckets where org_id = p_org and type = 'operations';
  select id into v_bucket_oblig   from public.buckets where org_id = p_org and type = 'obligations';
  select id into v_bucket_reserve from public.buckets where org_id = p_org and type = 'profit_reserve';
  select id into v_bucket_owner   from public.buckets where org_id = p_org and type = 'owner_salary';
  select id into v_bucket_growth  from public.buckets where org_id = p_org and type = 'growth';

  -- Wipe prior demo rows for this org (safe in dev / hackathon contexts).
  delete from public.allocation_lines
    where allocation_id in (select id from public.allocations where org_id = p_org);
  delete from public.allocations     where org_id = p_org;
  delete from public.insights        where org_id = p_org;
  delete from public.obligations     where org_id = p_org;
  delete from public.owner_withdrawals where org_id = p_org;
  delete from public.transactions    where org_id = p_org;
  delete from public.accounts        where org_id = p_org;

  -- Primary current account (Seylan Bank, mock).
  insert into public.accounts (org_id, name, type, bank_name, account_mask, currency, current_balance, is_primary)
  values (p_org, 'Seylan Current', 'bank', 'Seylan Bank', '4821', 'LKR', 1850000, true)
  returning id into v_account;

  -- Recent transactions (Asia/Colombo dates).
  insert into public.transactions
    (org_id, account_id, direction, amount_lkr, occurred_at, description_clean, counterparty_alias, category, source)
  values
    (p_org, v_account, 'inflow',  450000, now() - interval '1 day',  'POS settlement', 'Daily POS sweep', 'sales',       'pos'),
    (p_org, v_account, 'inflow',  320000, now() - interval '3 day',  'Customer transfer', 'Customer A',    'sales',       'bank'),
    (p_org, v_account, 'outflow', 180000, now() - interval '4 day',  'Supplier payment', 'Supplier #1',    'cogs',        'bank'),
    (p_org, v_account, 'outflow',  95000, now() - interval '6 day',  'Electricity',     'CEB',             'utilities',   'bank'),
    (p_org, v_account, 'outflow', 240000, now() - interval '10 day', 'Payroll batch',   'Staff payroll',   'payroll',     'bank'),
    (p_org, v_account, 'inflow',  610000, now() - interval '12 day', 'POS settlement',  'Daily POS sweep', 'sales',       'pos');

  select id into v_tx_income
  from public.transactions
  where org_id = p_org
  order by occurred_at desc
  limit 1;

  -- Upcoming obligations (next ~30 days).
  insert into public.obligations
    (org_id, bucket_id, category, counterparty_alias, amount_lkr, due_date, priority, status)
  values
    (p_org, v_bucket_oblig, 'rent',       'Landlord',         150000, current_date + 4,  'high',   'due_soon'),
    (p_org, v_bucket_oblig, 'payroll',    'Staff payroll',    260000, current_date + 8,  'high',   'upcoming'),
    (p_org, v_bucket_oblig, 'utilities',  'CEB',               42000, current_date + 11, 'medium', 'upcoming'),
    (p_org, v_bucket_oblig, 'loan',       'Seylan SME Loan',   85000, current_date + 15, 'high',   'upcoming'),
    (p_org, v_bucket_oblig, 'supplier',   'Supplier #1',      210000, current_date + 22, 'medium', 'upcoming'),
    (p_org, v_bucket_oblig, 'tax',        'EPF/ETF',           48000, current_date + 28, 'high',   'upcoming');

  -- Owner withdrawals (one disciplined, one leakage-flagged).
  insert into public.owner_withdrawals
    (org_id, amount_lkr, withdrawn_at, is_within_salary_plan, notes)
  values
    (p_org,  85000, now() - interval '5 day',  true,  'Monthly owner salary'),
    (p_org,  40000, now() - interval '2 day',  false, 'Personal expense — flagged');

  -- A proposed allocation tied to the latest income.
  insert into public.allocations
    (org_id, trigger, source_transaction_id, total_amount_lkr, status, engine_version, explanation)
  values (
    p_org, 'income_detected', v_tx_income, 610000, 'proposed', 'v1',
    'Income detected. Reserve payroll + rent before discretionary spend.'
  )
  returning id into v_allocation;

  insert into public.allocation_lines (allocation_id, bucket_id, proposed_amount_lkr, reason_code)
  values
    (v_allocation, v_bucket_ops,     245000, 'operations_baseline'),
    (v_allocation, v_bucket_oblig,   200000, 'obligations_due_<30d'),
    (v_allocation, v_bucket_reserve,  60000, 'reserve_under_target'),
    (v_allocation, v_bucket_owner,    85000, 'owner_salary_plan'),
    (v_allocation, v_bucket_growth,   20000, 'growth_discretionary');

  -- Seed insights produced by the deterministic engine (generated_by='rules').
  insert into public.insights
    (org_id, category, severity, title, body, machine_reason_code, generated_by, payload)
  values
    (p_org, 'cash_risk',      'warning',  'Supplier payment risk in 9 days',
     'At current outflow pace, supplier payment of LKR 210,000 may stress the current account on the due date.',
     'supplier_due_pressure', 'rules', '{"days_until":9,"shortfall_lkr":35000}'::jsonb),
    (p_org, 'leakage',        'warning',  'Owner withdrawal outside salary plan',
     'A non-plan withdrawal of LKR 40,000 was detected. Consider moving it to the owner salary schedule.',
     'owner_leakage_detected', 'rules', '{"amount_lkr":40000}'::jsonb),
    (p_org, 'reserve_health', 'info',     'Reserve health: medium',
     'Profit reserve is at 62% of target. On track if next two POS settlements clear as expected.',
     'reserve_band_medium', 'rules', '{"band":"medium","pct_to_target":62}'::jsonb);

  -- Today's discipline score snapshot.
  insert into public.discipline_scores (org_id, snapshot_date, score, components)
  values (
    p_org,
    current_date,
    72,
    jsonb_build_object(
      'on_time_payments', 80,
      'reserve_consistency', 65,
      'owner_salary_stability', 75,
      'leakage_penalty', -8
    )
  )
  on conflict (org_id, snapshot_date) do update
    set score = excluded.score, components = excluded.components;

  insert into public.audit_log (org_id, action, resource_type, resource_id, metadata)
  values (p_org, 'demo.seeded', 'organization', p_org::text, '{"profile":"sri_lankan_sme_v1"}'::jsonb);
end;
$$;

revoke all on function solebook.seed_demo_data(uuid) from public;
grant execute on function solebook.seed_demo_data(uuid) to service_role;
