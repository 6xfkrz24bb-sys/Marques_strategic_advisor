-- Marques Strategic Advisor - Supabase schema
-- Execute no SQL Editor do Supabase antes de publicar a aplicação em produção.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text unique,
  company text,
  phone text,
  role text not null default 'client',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  whatsapp text,
  company text,
  agent_id text,
  score integer,
  answers jsonb not null default '[]'::jsonb,
  source text not null default 'diagnostic',
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  legal_name text not null,
  trade_name text,
  tax_id text not null,
  category text,
  contact_name text,
  email text not null,
  whatsapp text,
  city text,
  state text,
  status text not null default 'new',
  score integer,
  notes text,
  documents jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'mercadopago',
  provider_reference text unique,
  external_reference text unique,
  status text not null default 'pending',
  amount_cents integer,
  currency text not null default 'BRL',
  paid_until timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.advisor_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  advisor_id text not null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  status text not null default 'active',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, advisor_id)
);

create table if not exists public.diagnostics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  advisor_id text not null,
  score integer,
  answers jsonb not null default '[]'::jsonb,
  ai_summary text,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  advisor_id text not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_leads_created_at on public.leads(created_at desc);
create index if not exists idx_suppliers_tax_id on public.suppliers(tax_id);
create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_advisor_access_user_id on public.advisor_access(user_id);
create index if not exists idx_chat_messages_user_advisor on public.chat_messages(user_id, advisor_id, created_at desc);

create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists touch_profiles_updated_at on public.profiles;
create trigger touch_profiles_updated_at before update on public.profiles for each row execute procedure public.touch_updated_at();

drop trigger if exists touch_leads_updated_at on public.leads;
create trigger touch_leads_updated_at before update on public.leads for each row execute procedure public.touch_updated_at();

drop trigger if exists touch_suppliers_updated_at on public.suppliers;
create trigger touch_suppliers_updated_at before update on public.suppliers for each row execute procedure public.touch_updated_at();

drop trigger if exists touch_subscriptions_updated_at on public.subscriptions;
create trigger touch_subscriptions_updated_at before update on public.subscriptions for each row execute procedure public.touch_updated_at();

drop trigger if exists touch_advisor_access_updated_at on public.advisor_access;
create trigger touch_advisor_access_updated_at before update on public.advisor_access for each row execute procedure public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), new.email)
  on conflict (id) do update set email = excluded.email, updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.suppliers enable row level security;
alter table public.subscriptions enable row level security;
alter table public.advisor_access enable row level security;
alter table public.diagnostics enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "Profiles select own" on public.profiles;
create policy "Profiles select own" on public.profiles for select using (auth.uid() = id);

drop policy if exists "Profiles update own" on public.profiles;
create policy "Profiles update own" on public.profiles for update using (auth.uid() = id);

drop policy if exists "Leads public insert" on public.leads;
create policy "Leads public insert" on public.leads for insert with check (true);

drop policy if exists "Suppliers insert authenticated" on public.suppliers;
create policy "Suppliers insert authenticated" on public.suppliers for insert with check (auth.uid() = user_id or user_id is null);

drop policy if exists "Suppliers select own" on public.suppliers;
create policy "Suppliers select own" on public.suppliers for select using (auth.uid() = user_id);

drop policy if exists "Subscriptions select own" on public.subscriptions;
create policy "Subscriptions select own" on public.subscriptions for select using (auth.uid() = user_id);

drop policy if exists "Advisor access select own" on public.advisor_access;
create policy "Advisor access select own" on public.advisor_access for select using (auth.uid() = user_id);

drop policy if exists "Diagnostics select own" on public.diagnostics;
create policy "Diagnostics select own" on public.diagnostics for select using (auth.uid() = user_id);

drop policy if exists "Diagnostics insert own" on public.diagnostics;
create policy "Diagnostics insert own" on public.diagnostics for insert with check (auth.uid() = user_id or user_id is null);

drop policy if exists "Chat select own" on public.chat_messages;
create policy "Chat select own" on public.chat_messages for select using (auth.uid() = user_id);

drop policy if exists "Chat insert own" on public.chat_messages;
create policy "Chat insert own" on public.chat_messages for insert with check (auth.uid() = user_id);
