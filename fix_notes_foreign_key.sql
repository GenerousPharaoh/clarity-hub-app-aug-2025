-- Fix foreign key constraint for notes table
alter table public.notes
  drop constraint if exists notes_user_id_fkey,
  add constraint notes_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

-- Add policy to auto-fill user_id with authenticated user's ID
create policy "owner can insert notes"
  on notes for insert
  with check (user_id = auth.uid());

-- Policy to allow owner to update their own notes
create policy "owner can update own notes"
  on notes for update
  using (user_id = auth.uid());

-- Policy to allow owner to select their own notes
create policy "owner can select own notes"
  on notes for select
  using (user_id = auth.uid()); 