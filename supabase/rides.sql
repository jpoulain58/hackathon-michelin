create table if not exists public.rides (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid references auth.users(id) on delete set null,
  source text not null default 'manual' check (source in ('strava', 'manual')),
  strava_activity_id text,
  name text not null,
  description text not null default '',
  instructions text not null default '',
  km numeric not null default 0,
  dplus integer not null default 0,
  duration_seconds integer not null default 0,
  kcal integer,
  terrain text not null,
  landscape text,
  difficulty text not null default 'Intermédiaire',
  tags text[] not null default '{}',
  tyre text,
  tyre_detail jsonb,
  pro_tip jsonb,
  pts jsonb not null default '[]'::jsonb,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (rider_id, strava_activity_id)
);

create index if not exists rides_public_idx on public.rides (is_public, created_at desc);

alter table public.rides enable row level security;

create policy "Balades publiques lisibles par tous"
  on public.rides
  for select
  to anon, authenticated
  using (is_public = true);

create policy "Un rider cree ses balades"
  on public.rides
  for insert
  to authenticated
  with check (auth.uid() = rider_id);

create policy "Un rider modifie ses balades"
  on public.rides
  for update
  to authenticated
  using (auth.uid() = rider_id);
