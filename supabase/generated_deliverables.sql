create table if not exists public.generated_deliverables (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  advisor_id text not null,
  deliverable_type text not null check (deliverable_type in ('report','spreadsheet','presentation')),
  title text not null,
  file_name text not null,
  mime_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_generated_deliverables_user_created
  on public.generated_deliverables(user_id, created_at desc);

alter table public.generated_deliverables enable row level security;

drop policy if exists "Generated deliverables select own" on public.generated_deliverables;

create policy "Generated deliverables select own"
  on public.generated_deliverables
  for select
  to authenticated
  using ((select auth.uid()) = user_id);
