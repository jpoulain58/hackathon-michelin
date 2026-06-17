-- Fonctionnalites du Club Trust Wheels.
-- A executer dans Supabase SQL Editor (puis : notify pgrst, 'reload schema';).

-- 1. Mon Garage : les pneus suivis par le rider (saisie manuelle des km).
--    L'usure est calculee cote app : km / lifespan_km.
create table if not exists public.garage_tyres (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Pneu',
  model text,
  km integer not null default 0,
  lifespan_km integer not null default 4000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.garage_tyres enable row level security;

drop policy if exists "Riders manage their own garage" on public.garage_tyres;

-- Un rider lit / cree / modifie / supprime uniquement ses propres pneus.
create policy "Riders manage their own garage"
on public.garage_tyres
for all
to authenticated
using (auth.uid() = rider_id)
with check (auth.uid() = rider_id);

-- 2. Tokens Strava : stockes cote serveur uniquement.
--    RLS active SANS policy pour le role authenticated -> le client anon/auth
--    ne peut rien lire. Seul le service_role (API NestJS) y accede (bypass RLS).
create table if not exists public.strava_tokens (
  rider_id uuid primary key references auth.users(id) on delete cascade,
  athlete_id text,
  access_token text not null,
  refresh_token text not null,
  expires_at bigint,
  updated_at timestamptz not null default now()
);

alter table public.strava_tokens enable row level security;

notify pgrst, 'reload schema';
