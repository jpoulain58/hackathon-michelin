-- Mon Garage (Club Trust Wheels) : les pneus suivis par le rider.
-- A executer dans Supabase SQL Editor.
--
-- Les km Strava sont lus en direct via l'API existante (/api/auth/profile,
-- totals.allRideKm) : pas de stockage de tokens cote table necessaire ici.
-- L'usure est calculee cote app : km / lifespan_km.
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

notify pgrst, 'reload schema';
