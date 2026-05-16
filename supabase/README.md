# SoleBook database

This folder is the source of truth for the SoleBook Postgres schema on
Supabase. Migrations are plain SQL so they can be applied via the
Supabase Dashboard SQL editor, the Supabase CLI, or `psql` — whichever
matches your workflow.

The design follows
[`.cursor/plans/solebook_layered_architecture_e8dd6b6b.plan.md`](../.cursor/plans/solebook_layered_architecture_e8dd6b6b.plan.md)
and [`.cursor/plans/solebook_implementation_7bce9835.plan.md`](../.cursor/plans/solebook_implementation_7bce9835.plan.md).

## What's in here

```
supabase/
  migrations/
    20260517000001_core_schema.sql      Tables, enums, indexes, triggers
    20260517000002_rls_policies.sql     Row Level Security policies
    20260517000003_helpers_and_seed.sql Onboarding RPC + demo seeder
```

## Schema highlights

- **Multi-tenant**: every business table carries `org_id`. Tenant
  isolation is enforced in the database via RLS, not at the UI.
- **RBAC roles**: `owner`, `finance`, `read_only`, `integration_admin`.
- **Ingestion plane**: `transactions_raw` (immutable source payloads) +
  `transactions` (normalized canonical view) + `webhook_events` +
  `idempotency_keys`. Lets you swap mock connectors for real
  bank/POS/ERP later without changing the engine.
- **Deterministic finance core**: `buckets`, `allocations`,
  `allocation_lines`, `obligations`, `owner_withdrawals`,
  `discipline_scores`. Money semantics live here, not in the LLM.
- **AI surface**: `insights` (LLM- or rules-generated) and
  `ai_audit_log` (model id, prompt template version, context hash,
  RBAC role, safety filter result). Mirrors the security spine from
  the layered-architecture plan.
- **Auditability**: `audit_log` is append-only at the policy level for
  end users; only `service_role` can write.
- **Realtime**: `transactions`, `buckets`, `allocations`,
  `obligations`, `insights`, `discipline_scores` are published on the
  Supabase Realtime channel.

## Apply the migrations

Pick one of the three flows below.

### Option A — Supabase Dashboard (fastest for a hackathon)

1. Open your project at <https://supabase.com/dashboard>.
2. Go to **SQL Editor → New query**.
3. Paste the contents of each file **in order** and run:
   1. `migrations/20260517000001_core_schema.sql`
   2. `migrations/20260517000002_rls_policies.sql`
   3. `migrations/20260517000003_helpers_and_seed.sql`
4. (Optional) Verify under **Database → Tables** that `organizations`,
   `buckets`, `transactions`, etc. exist.

### Option B — Supabase CLI (recommended for ongoing work)

```bash
# One-time setup
npm i -g supabase
supabase login
supabase link --project-ref <your-project-ref>

# Push every migration that hasn't been applied yet
supabase db push
```

The CLI tracks applied migrations in a `supabase_migrations` table, so
re-runs are safe.

### Option C — `psql`

```bash
psql "postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres" \
  -f migrations/20260517000001_core_schema.sql \
  -f migrations/20260517000002_rls_policies.sql \
  -f migrations/20260517000003_helpers_and_seed.sql
```

## After applying

1. Copy `.env.local.example` to `.env.local` at the repo root and fill
   in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
   `SUPABASE_SERVICE_ROLE_KEY` from **Project Settings → API**.
2. (Optional) Seed demo data for the hackathon flow. The seeder is
   `service_role`-only, so run it from the SQL editor or any
   server-side call:

   ```sql
   -- 1. Create a user via Supabase Auth (Auth → Users → Add user).
   -- 2. Sign in as that user from the app, OR call the onboarding RPC
   --    via the SQL editor while impersonating them.
   -- 3. Then, as service_role, populate demo data:
   select solebook.seed_demo_data('<org-uuid-from-step-2>');
   ```

   The seeder is idempotent: it clears prior demo rows for that org
   and reinserts a deterministic Sri Lankan SME dataset (Seylan
   current account, POS settlements, upcoming rent / payroll /
   utilities / loan / supplier / tax, owner withdrawals with one
   leakage flag, a proposed allocation, three insights, and a
   discipline score snapshot).

## Onboarding from the app

Client code should call the onboarding RPC instead of inserting into
`organizations` directly. It atomically creates the org, makes the
caller `owner`, seeds the 5 smart buckets, and writes an audit event:

```ts
const supabase = getSupabaseAnon();
const { data: orgId, error } = await supabase!.rpc("create_organization", {
  p_name: "My Bakery",
  p_business_type: "retail",
});
```

The migration installs both `solebook.create_organization` (the real
SECURITY DEFINER implementation) and a thin `public.create_organization`
wrapper so the call reaches PostgREST without exposing the `solebook`
schema.

## Re-running locally

Each migration is idempotent where reasonable (`create ... if not
exists`, `do $$ ... exception when duplicate_object then null; end
$$`, `drop policy if exists`). You can re-run the first two files
safely. The third file's `seed_demo_data` function is also idempotent
per-org, but `create_organization` will error if the slug collides —
pass an explicit `p_slug` to control that.
