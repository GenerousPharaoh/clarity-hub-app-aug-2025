-- Add missing RLS policies for insert operations
-- Migration to fix issue #4 from the root-cause analysis

-- projects table
alter table projects enable row level security;
create policy "auth insert" on projects
  for insert with check (auth.role() = 'authenticated');

-- files table
alter table files enable row level security;
create policy "auth insert" on files
  for insert with check (auth.uid() = uploaded_by_user_id);

-- Confirm policies were created
comment on table projects is 'RLS enabled with insert policy added';
comment on table files is 'RLS enabled with insert policy added'; 