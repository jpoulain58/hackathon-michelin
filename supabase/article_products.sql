-- Table de jonction articles <-> products (pneus lies a un article).
-- Optionnel : un article peut n'avoir aucun pneu lie.
-- La lecture se fait cote serveur (service role) car products est en RLS service-role.
-- A executer dans Supabase SQL Editor apres articles.sql et products.sql.

create table if not exists public.article_products (
  article_id  bigint not null references public.articles(id) on delete cascade,
  product_id  bigint not null references public.products(id) on delete cascade,
  position    smallint not null default 0,
  primary key (article_id, product_id)
);

create index if not exists article_products_article_idx on public.article_products (article_id);
