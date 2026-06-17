-- Programme Testeur : reservation d'un essai pneu par un membre du Club.
-- A executer dans Supabase SQL Editor.
--
-- Un membre reserve une date d'essai (ex. juillet 2026) pour un pneu donne
-- (tyre_slug). Une seule reservation par rider et par pneu (modifiable).
create table if not exists public.tyre_test_reservations (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null references auth.users(id) on delete cascade,
  tyre_slug text not null,
  test_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (rider_id, tyre_slug)
);

alter table public.tyre_test_reservations enable row level security;

drop policy if exists "Riders manage their own test reservations" on public.tyre_test_reservations;

-- Un rider lit / cree / modifie / supprime uniquement ses propres reservations.
create policy "Riders manage their own test reservations"
on public.tyre_test_reservations
for all
to authenticated
using (auth.uid() = rider_id)
with check (auth.uid() = rider_id);

notify pgrst, 'reload schema';
