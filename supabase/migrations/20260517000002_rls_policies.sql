-- =====================================================================
-- SoleBook Row Level Security
--
-- Per `.cursor/plans/solebook_layered_architecture_e8dd6b6b.plan.md`:
--   "Tenant isolation is enforcement, not UI: every query includes
--    `org_id` (or equivalent) and tests exist to prevent cross-tenant
--    reads."
--
-- Conventions used below:
--   * `authenticated` role = logged-in end users via Supabase Auth.
--     Subject to RLS.
--   * `service_role`     = server-side ingestion workers, cron jobs,
--                          and admin tooling. Bypasses RLS by default;
--                          we additionally grant explicit privileges.
--   * `anon`             = pre-login PWA visitors. Granted nothing here.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Lock down the default surface, then re-grant table-by-table.
-- ---------------------------------------------------------------------
revoke all on schema public from public;
grant usage on schema public to anon, authenticated, service_role;

-- The solebook helper schema is invoked only via SECURITY DEFINER
-- functions; no direct table access is needed by client roles.
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

-- Force RLS so even table owners (e.g. supabase_admin in some flows)
-- still go through the policies for the deny-by-default tables.
alter table public.audit_log     force row level security;
alter table public.ai_audit_log  force row level security;

-- ---------------------------------------------------------------------
-- Table-level grants for the authenticated role.
-- Service role gets full access; anon gets nothing.
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

-- Audit + raw ingestion + idempotency are read-only for end users.
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
-- NOTE: We intentionally allow any authenticated user to create an org
-- they will own. The companion `solebook.create_organization` RPC
-- (see seed/helpers migration) atomically inserts the membership row
-- so the creator becomes 'owner'. Without that membership the row
-- becomes invisible to them on the next read, which is the desired
-- transactional behavior.

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
  -- Either the inviter is already an owner of the target org, or this
  -- is the bootstrap insert that pairs with `org_insert_self` (the
  -- inserting user is making themselves the first owner).
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

-- ---------------------------------------------------------------------
-- Generic "tenant-scoped" policy macro:
--   * SELECT: any member of the org
--   * INSERT/UPDATE: members with role owner/finance/integration_admin
--     (read_only is excluded)
--   * DELETE: owner/finance only
--
-- We re-create the policies per table rather than using a dynamic
-- macro so they remain readable in Supabase Studio.
-- ---------------------------------------------------------------------

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
-- NOTE: insights are *generated* by the server; UI-side updates are
-- restricted to acknowledgement bookkeeping. Stronger constraints
-- (column-level) belong in API code rather than RLS.

-- ---------------------------------------------------------------------
-- audit_log + ai_audit_log
-- Append-only for end users. They may SELECT their org's events, but
-- cannot INSERT/UPDATE/DELETE through the client — only `service_role`
-- (server / engine) can write.
-- ---------------------------------------------------------------------
drop policy if exists "audit_select" on public.audit_log;
create policy "audit_select" on public.audit_log
for select to authenticated
using (org_id is not null and solebook.has_org_role(org_id, array['owner','finance','integration_admin']::org_role[]));

drop policy if exists "ai_audit_select" on public.ai_audit_log;
create policy "ai_audit_select" on public.ai_audit_log
for select to authenticated
using (org_id is not null and solebook.has_org_role(org_id, array['owner','finance','integration_admin']::org_role[]));
