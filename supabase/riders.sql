-- Table metier synchronisee apres authentification Supabase.
-- A executer dans Supabase SQL Editor.

create table if not exists public.riders (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  display_name text not null,
  provider text,
  providers text[] default '{}',
  strava_id text unique,
  garmin_id text unique,
  tier text not null default 'ROOKIE',
  total_km integer not null default 0,
  reviews_count integer not null default 0,
  club_member boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Adhesion au Club Trust Wheels (toggle depuis la page /club).
-- Idempotent : ajoute la colonne aux tables deja creees.
alter table public.riders
  add column if not exists club_member boolean not null default false;

alter table public.riders enable row level security;

drop policy if exists "Riders can read their own profile" on public.riders;
drop policy if exists "Riders can insert their own profile" on public.riders;
drop policy if exists "Riders can update their own profile" on public.riders;

create policy "Riders can read their own profile"
on public.riders
for select
to authenticated
using (auth.uid() = id);

create policy "Riders can insert their own profile"
on public.riders
for insert
to authenticated
with check (auth.uid() = id);

create policy "Riders can update their own profile"
on public.riders
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
