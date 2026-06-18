-- Statut "ambassadeur" : un rider peut etre designe ambassadeur Michelin,
-- ses balades sont alors marquees comme balades d'ambassadeur (mises en avant
-- sur /balades). A executer apres riders.sql et rides.sql.

alter table public.riders
  add column if not exists is_ambassador boolean not null default false;

-- Denormalise sur rides (plutot qu'une jointure) car l'API public lit rides
-- via le role anon/authenticated et il n'existe pas de relation FK exploitable
-- par PostgREST entre rides.rider_id et riders.id pour un embed direct.
alter table public.rides
  add column if not exists is_ambassador boolean not null default false;

create index if not exists rides_ambassador_idx on public.rides (is_ambassador, created_at desc);
