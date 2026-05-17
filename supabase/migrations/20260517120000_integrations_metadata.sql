-- Fix: PostgREST "Could not find the 'metadata' column of 'integrations' in the schema cache"
-- Run in Supabase Dashboard → SQL → New query (or `supabase db push`), then retry the request.

alter table public.integrations
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.integrations
  add column if not exists last_synced_at timestamptz;

alter table public.integrations
  add column if not exists last_error text;

notify pgrst, 'reload schema';
