-- StudyPod Supabase Schema (Paste into Supabase SQL Editor -> Run)
create table if not exists public.pods (
  code text primary key,
  state_json jsonb not null,
  updated_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

-- Enable Row Level Security (RLS) so any paired device with the 6-char Pod Code can read & sync
alter table public.pods enable row level security;

drop policy if exists "Allow public pod read by code" on public.pods;
create policy "Allow public pod read by code"
  on public.pods for select
  using (true);

drop policy if exists "Allow public pod insert" on public.pods;
create policy "Allow public pod insert"
  on public.pods for insert
  with check (true);

drop policy if exists "Allow public pod update" on public.pods;
create policy "Allow public pod update"
  on public.pods for update
  using (true)
  with check (true);
