-- SoleBook Supabase Schema

create table businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('retail','restaurant','services','wholesale','online','freelancer')),
  salary_goal numeric(12,2) default 0,
  created_at timestamptz default now()
);

create table buckets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  name text not null,
  label text not null,
  balance numeric(14,2) default 0,
  target_pct numeric(5,2) default 0,
  color text,
  created_at timestamptz default now()
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  amount numeric(14,2) not null,
  type text not null check (type in ('income','expense','transfer')),
  category text,
  description text,
  date timestamptz default now(),
  bucket text,
  created_at timestamptz default now()
);

create table obligations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  name text not null,
  amount numeric(14,2) not null,
  due_date timestamptz not null,
  priority text not null check (priority in ('HIGH','MEDIUM','LOW')),
  status text not null default 'pending' check (status in ('pending','paid','overdue')),
  category text,
  recurring boolean default false,
  created_at timestamptz default now()
);

create table allocations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  transaction_id uuid references transactions(id),
  total_amount numeric(14,2),
  splits jsonb,
  accepted_at timestamptz,
  created_at timestamptz default now()
);

create table insights (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  message text not null,
  detail text,
  severity text not null check (severity in ('critical','warning','info','positive')),
  category text,
  action text,
  created_at timestamptz default now()
);

create table scores (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  overall numeric(5,2),
  payment_timeliness numeric(5,2),
  reserve_consistency numeric(5,2),
  salary_stability numeric(5,2),
  personal_leakage numeric(5,2),
  loan_readiness numeric(5,2),
  computed_at timestamptz default now()
);

create table owner_withdrawals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  amount numeric(14,2) not null,
  date timestamptz default now(),
  note text,
  created_at timestamptz default now()
);

-- Row Level Security
alter table businesses enable row level security;
alter table buckets enable row level security;
alter table transactions enable row level security;
alter table obligations enable row level security;
alter table allocations enable row level security;
alter table insights enable row level security;
alter table scores enable row level security;
alter table owner_withdrawals enable row level security;

create policy "Users manage own business" on businesses
  for all using (auth.uid() = owner_id);

create policy "Business data via owner" on buckets
  for all using (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "Business data via owner" on transactions
  for all using (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "Business data via owner" on obligations
  for all using (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "Business data via owner" on allocations
  for all using (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "Business data via owner" on insights
  for all using (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "Business data via owner" on scores
  for all using (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "Business data via owner" on owner_withdrawals
  for all using (business_id in (select id from businesses where owner_id = auth.uid()));
