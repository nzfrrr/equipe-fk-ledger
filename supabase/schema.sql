create extension if not exists pgcrypto;

create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text default '',
  team text default 'Equipe FK',
  split numeric default 100,
  status text default 'active' check (status in ('active', 'onboarding', 'inactive')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  property text not null,
  client text not null,
  agent_id uuid not null references public.agents(id) on delete cascade,
  type text not null check (type in ('sale', 'lease', 'referral')),
  date date not null,
  status text not null default 'pipeline' check (status in ('pipeline', 'closed', 'paid')),
  value numeric default 0,
  commission numeric default 0,
  team_cut numeric default 0,
  agent_cut numeric default 0,
  qst numeric default 0,
  gst numeric default 0,
  total_with_taxes numeric default 0,
  brokerage_fees numeric default 0,
  payment_date date,
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.agents enable row level security;
alter table public.deals enable row level security;

create policy "Authenticated users can read agents"
  on public.agents for select
  to authenticated
  using (true);

create policy "Authenticated users can insert agents"
  on public.agents for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update agents"
  on public.agents for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete agents"
  on public.agents for delete
  to authenticated
  using (true);

create policy "Authenticated users can read deals"
  on public.deals for select
  to authenticated
  using (true);

create policy "Authenticated users can insert deals"
  on public.deals for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update deals"
  on public.deals for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete deals"
  on public.deals for delete
  to authenticated
  using (true);
