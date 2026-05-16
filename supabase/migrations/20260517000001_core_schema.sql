-- =====================================================================
-- SoleBook core schema (Phase 1 / Phase 2 boundary)
--
-- Designed against `.cursor/plans/solebook_layered_architecture_e8dd6b6b.plan.md`:
--   * Multi-tenant org model with explicit RBAC roles.
--   * Normalized canonical transactions + immutable raw source payloads.
--   * Deterministic finance core owns money semantics (allocations,
--     obligations, buckets). LLM outputs are siloed in `insights` and
--     `ai_audit_log` only.
--   * Audit-first: every state change is captured.
--   * Tenant isolation enforced in the DB (RLS, see next migration),
--     not the UI.
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

-- Only one primary account per org.
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
-- 10. Realtime publication (Supabase Realtime channels)
--     Opt-in tables the frontend can subscribe to.
--     Supabase pre-creates an empty `supabase_realtime` publication on
--     every project, so we ADD tables to it (idempotently) rather than
--     attempting to CREATE the publication.
-- ---------------------------------------------------------------------
do $$
declare
  v_tables text[] := array[
    'transactions',
    'buckets',
    'allocations',
    'obligations',
    'insights',
    'discipline_scores'
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
  -- On hosted Supabase the role applying this may not own the
  -- publication. Realtime can be wired up later from the Dashboard.
  null;
end $$;
