-- Table des actualites / articles editoriaux.
-- Lecture publique (anon) : policy select ouverte.
-- A executer dans Supabase SQL Editor.

create table if not exists public.articles (
  id            bigint generated always as identity primary key,
  slug          text unique not null,
  category      text not null,
  title         text not null,
  excerpt       text not null,
  content       text not null default '',
  photo         text,
  is_featured   boolean not null default false,
  published_at  timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create index if not exists articles_published_at_idx on public.articles (published_at desc);
create index if not exists articles_slug_idx on public.articles (slug);

alter table public.articles enable row level security;

create policy "Articles are publicly readable"
  on public.articles
  for select
  to anon, authenticated
  using (true);
