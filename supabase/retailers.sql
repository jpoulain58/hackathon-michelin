-- Liste des revendeurs en ligne Michelin (Region / Country / Website).
-- Donnees publiques : lecture autorisee a tous (anon + authenticated).
-- A executer dans Supabase SQL Editor.

create table if not exists public.retailers (
  id         bigint generated always as identity primary key,
  region     text,
  country    text,
  website    text unique,
  created_at timestamptz not null default now()
);

alter table public.retailers enable row level security;

drop policy if exists "Retailers are publicly readable" on public.retailers;
create policy "Retailers are publicly readable"
on public.retailers
for select
to anon, authenticated
using (true);
