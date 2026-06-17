-- Lie une balade au pneu reellement utilise par le rider (catalogue public.products)
-- + sa note personnelle sur ce pneu. A executer apres rides.sql et products.sql.

alter table public.rides
  add column if not exists used_tyre_product_id bigint references public.products(id) on delete set null,
  add column if not exists used_tyre_rating smallint;

alter table public.rides
  drop constraint if exists rides_used_tyre_rating_check;

alter table public.rides
  add constraint rides_used_tyre_rating_check
  check (used_tyre_rating is null or used_tyre_rating between 1 and 5);
