-- Avis riders sur les pneus : affiches sous la fiche produit (/produits/:id)
-- et sur la liste des avis (/communaute). Un rider laisse au plus un avis par
-- pneu (upsert depuis le formulaire pour le modifier).
-- A executer apres riders.sql et products.sql dans Supabase SQL Editor.

create table if not exists public.reviews (
  id          bigint generated always as identity primary key,
  product_id  bigint not null references public.products(id) on delete cascade,
  rider_id    uuid not null references public.riders(id) on delete cascade,
  rating      smallint not null check (rating between 1 and 5),
  text        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (product_id, rider_id)
);

create index if not exists reviews_product_idx on public.reviews (product_id, created_at desc);
create index if not exists reviews_rider_idx on public.reviews (rider_id);

-- Confidentiel comme products (cf. products.sql) : products n'est pas lisible
-- par la cle anon, donc reviews (qui reference product_id) reste lui aussi
-- reserve au service role. Lecture et ecriture passent exclusivement par le
-- backend web (routes /api/reviews, supabaseAdmin + token Supabase verifie
-- pour la creation).
alter table public.reviews enable row level security;
