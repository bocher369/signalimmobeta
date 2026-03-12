create table if not exists public.acquisitions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  fund_name text,
  fund_address text,
  fund_type text default 'tabac',
  input_data jsonb default '{}',
  financial_data jsonb default '{}',
  ratios jsonb default '{}',
  valuation jsonb default '{}',
  financing_plan jsonb default '{}',
  cashflows jsonb default '[]',
  gemini_memo text,
  slides_url text,
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.acquisitions enable row level security;

drop policy if exists "Users manage own acquisitions" on public.acquisitions;
create policy "Users manage own acquisitions"
  on public.acquisitions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
