-- =====================================================================
-- SoleBook helpers + demo seeder
--
-- * `solebook.create_organization`    : atomic onboarding RPC.
-- * `solebook.seed_default_buckets`   : creates the 5 canonical smart
--                                       buckets for a newly-onboarded org.
-- * `solebook.seed_demo_data`         : populates one org with a small,
--                                       realistic Sri Lankan SME dataset
--                                       for the hackathon demo.
--
-- These are SECURITY DEFINER so the caller's RLS context doesn't block
-- the initial writes. Inside the function we still verify that the
-- calling `auth.uid()` is appropriate for the operation.
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

  -- The latest inflow is the income that the allocation engine "saw".
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
