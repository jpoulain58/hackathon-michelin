-- Catalogue produit Michelin (pneus / chambres a air), schema aligne sur le
-- moteur de recommandation (cf. packages/recommender Product).
-- DONNEES CONFIDENTIELLES : RLS activee SANS policy de lecture publique ->
-- seul le backend (service role) y accede. Le catalogue n'est jamais expose
-- aux clients web/mobile avec la cle anon.
-- A executer dans Supabase SQL Editor.

create table if not exists public.products (
  id                bigint generated always as identity primary key,
  global_id         text,
  brand             text,
  product_type      text,
  cycle_type        text,
  segment           text,
  range             text,
  designation       text,
  fitting           text,
  use               text[] not null default '{}',
  terrain_types     text[] not null default '{}',
  tpi               text,
  weight_g          numeric,
  width_etrto       text,
  diameter_etrto    text,
  ean_code          text unique,
  cai_code          text,
  min_bar           numeric,
  max_bar           numeric,
  min_psi           numeric,
  max_psi           numeric,
  technologies      jsonb not null default '{}'::jsonb,
  discontinued_date date,
  created_at        timestamptz not null default now()
);

create index if not exists products_cycle_type_idx on public.products (cycle_type);
create index if not exists products_segment_idx on public.products (segment);
create index if not exists products_use_gin on public.products using gin (use);
create index if not exists products_terrain_gin on public.products using gin (terrain_types);

-- Confidentiel : RLS activee, aucune policy -> lecture reservee au service role.
alter table public.products enable row level security;
