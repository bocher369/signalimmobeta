create table if not exists public.agent_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  agency_name text,
  agent_first_name text,
  agent_last_name text,
  agent_phone text,
  agent_email text,
  logo_url text,
  brand_primary_color text default '#3BAF7E',
  brand_secondary_color text default '#0A1628',
  preferred_tone text default 'professionnel' check (preferred_tone in ('professionnel','dynamique','premium','proximite')),
  specializations text[] default '{}',
  coverage_zones text[] default '{}',
  plan text default 'starter' check (plan in ('starter','pro','premium')),
  bio text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.agent_profiles enable row level security;

create policy "Users can manage their own profile"
  on public.agent_profiles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_agent_profile_updated
  before update on public.agent_profiles
  for each row execute procedure public.handle_updated_at();
