-- Create entities table if it does not exist
create extension if not exists "uuid-ossp";

create table if not exists public.entities (
  id uuid primary key default uuid_generate_v4(),
  source_file_id uuid references public.files(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete cascade,
  entity_text text not null,
  entity_type text not null,
  created_at timestamptz default now()
);

-- Enable RLS and allow owners to read/insert
alter table public.entities enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'entities' and policyname = 'entities owners can read') then
    create policy "entities owners can read" on public.entities for select using (owner_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'entities' and policyname = 'entities owners can insert') then
    create policy "entities owners can insert" on public.entities for insert with check (owner_id = auth.uid());
  end if;
end $$; 