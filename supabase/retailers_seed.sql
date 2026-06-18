-- Seed revendeurs : 15 chaines (retailers) + magasins geolocalises (retailer_stores).
-- Donnees publiques (lecture anon + authenticated). A executer dans Supabase SQL Editor.
-- Idempotent : peut etre rejoue sans creer de doublons.

-- 1) Les 15 chaines (region / pays / site).
insert into public.retailers (region, country, website) values
  ('EUN', 'UK', 'https://www.tredz.co.uk'),
  ('EUN', 'UK', 'https://www.biketart.com'),
  ('EUN', 'UK', 'https://www.evanscycles.com'),
  ('EUN', 'DE', 'https://www.bike24.com'),
  ('EUN', 'DE', 'https://www.bike-components.de'),
  ('EUN', 'DE', 'https://www.amazon.de'),
  ('EUS', 'ES', 'https://www.deporvillage.com'),
  ('EUS', 'NL', 'https://www.futurumshop.nl'),
  ('EUS', 'IT', 'https://www.lordgunbicycles.com'),
  ('ECA', 'PL', 'https://www.centrumrowerowe.pl'),
  ('EUS', 'ES', 'https://www.bikeinn.com'),
  ('EUS', 'BE', 'https://www.vaneycksports.be'),
  ('EUS', 'FR', 'https://www.probikeshop.fr'),
  ('EUS', 'FR', 'https://www.alltricks.fr'),
  ('EUS', 'FR', 'https://www.materiel-velo.com')
on conflict (website) do nothing;

-- 2) Table des magasins physiques (geolocalises).
create table if not exists public.retailer_stores (
  id          bigint generated always as identity primary key,
  retailer_id bigint references public.retailers(id) on delete cascade,
  name        text not null,
  city        text,
  region      text,
  country     text,
  website     text,
  lat         double precision not null,
  lng         double precision not null,
  created_at  timestamptz not null default now(),
  unique (retailer_id, name)
);

alter table public.retailer_stores enable row level security;

drop policy if exists "Retailer stores are publicly readable" on public.retailer_stores;
create policy "Retailer stores are publicly readable"
on public.retailer_stores
for select
to anon, authenticated
using (true);

-- 3) Magasins (1 a 10 par chaine) avec coordonnees. region/country herites de la chaine.
insert into public.retailer_stores (retailer_id, name, city, region, country, website, lat, lng)
select r.id, s.name, s.city, r.region, r.country, r.website, s.lat, s.lng
from (values
  -- Tredz (UK)
  ('https://www.tredz.co.uk', 'Tredz Cardiff', 'Cardiff', 51.4816, -3.1791),
  ('https://www.tredz.co.uk', 'Tredz Bristol', 'Bristol', 51.4545, -2.5879),
  ('https://www.tredz.co.uk', 'Tredz London', 'London', 51.5074, -0.1278),
  -- Biketart (UK)
  ('https://www.biketart.com', 'Biketart Manchester', 'Manchester', 53.4808, -2.2426),
  ('https://www.biketart.com', 'Biketart Leeds', 'Leeds', 53.8008, -1.5491),
  -- Evans Cycles (UK)
  ('https://www.evanscycles.com', 'Evans Cycles London Waterloo', 'London', 51.5036, -0.1132),
  ('https://www.evanscycles.com', 'Evans Cycles Manchester', 'Manchester', 53.4775, -2.2399),
  ('https://www.evanscycles.com', 'Evans Cycles Birmingham', 'Birmingham', 52.4796, -1.9026),
  ('https://www.evanscycles.com', 'Evans Cycles Leeds', 'Leeds', 53.7965, -1.5478),
  ('https://www.evanscycles.com', 'Evans Cycles Bristol', 'Bristol', 51.4538, -2.5973),
  ('https://www.evanscycles.com', 'Evans Cycles Glasgow', 'Glasgow', 55.8609, -4.2514),
  -- Bike24 (DE)
  ('https://www.bike24.com', 'Bike24 Dresden', 'Dresden', 51.0504, 13.7373),
  ('https://www.bike24.com', 'Bike24 Berlin', 'Berlin', 52.5200, 13.4050),
  ('https://www.bike24.com', 'Bike24 Leipzig', 'Leipzig', 51.3397, 12.3731),
  -- Bike-Components (DE)
  ('https://www.bike-components.de', 'Bike-Components Aachen', 'Aachen', 50.7753, 6.0839),
  ('https://www.bike-components.de', 'Bike-Components Köln', 'Köln', 50.9375, 6.9603),
  -- Amazon (DE)
  ('https://www.amazon.de', 'Amazon Logistik Leipzig', 'Leipzig', 51.4237, 12.2363),
  -- Deporvillage (ES)
  ('https://www.deporvillage.com', 'Deporvillage Barcelona', 'Barcelona', 41.3851, 2.1734),
  ('https://www.deporvillage.com', 'Deporvillage Madrid', 'Madrid', 40.4168, -3.7038),
  -- FuturumShop (NL)
  ('https://www.futurumshop.nl', 'FuturumShop Rotterdam', 'Rotterdam', 51.9244, 4.4777),
  ('https://www.futurumshop.nl', 'FuturumShop Amsterdam', 'Amsterdam', 52.3676, 4.9041),
  -- Lordgun (IT)
  ('https://www.lordgunbicycles.com', 'Lordgun Milano', 'Milano', 45.4642, 9.1900),
  ('https://www.lordgunbicycles.com', 'Lordgun Roma', 'Roma', 41.9028, 12.4964),
  -- Centrum Rowerowe (PL)
  ('https://www.centrumrowerowe.pl', 'Centrum Rowerowe Warszawa', 'Warszawa', 52.2297, 21.0122),
  ('https://www.centrumrowerowe.pl', 'Centrum Rowerowe Kraków', 'Kraków', 50.0647, 19.9450),
  ('https://www.centrumrowerowe.pl', 'Centrum Rowerowe Wrocław', 'Wrocław', 51.1079, 17.0385),
  -- Bikeinn (ES)
  ('https://www.bikeinn.com', 'Bikeinn Palma', 'Palma', 39.5696, 2.6502),
  ('https://www.bikeinn.com', 'Bikeinn Barcelona', 'Barcelona', 41.3947, 2.1487),
  -- Van Eyck Sports (BE)
  ('https://www.vaneycksports.be', 'Van Eyck Sports Tessenderlo', 'Tessenderlo', 51.0667, 5.0833),
  ('https://www.vaneycksports.be', 'Van Eyck Sports Antwerpen', 'Antwerpen', 51.2194, 4.4025),
  -- Probikeshop (FR)
  ('https://www.probikeshop.fr', 'Probikeshop Saint-Étienne', 'Saint-Étienne', 45.4397, 4.3872),
  ('https://www.probikeshop.fr', 'Probikeshop Lyon', 'Lyon', 45.7640, 4.8357),
  ('https://www.probikeshop.fr', 'Probikeshop Paris', 'Paris', 48.8566, 2.3522),
  ('https://www.probikeshop.fr', 'Probikeshop Lille', 'Lille', 50.6292, 3.0573),
  ('https://www.probikeshop.fr', 'Probikeshop Bordeaux', 'Bordeaux', 44.8378, -0.5792),
  -- Alltricks (FR)
  ('https://www.alltricks.fr', 'Alltricks Montigny-le-Bretonneux', 'Montigny-le-Bretonneux', 48.7706, 2.0214),
  ('https://www.alltricks.fr', 'Alltricks Lyon', 'Lyon', 45.7589, 4.8414),
  ('https://www.alltricks.fr', 'Alltricks Toulouse', 'Toulouse', 43.6047, 1.4442),
  ('https://www.alltricks.fr', 'Alltricks Nantes', 'Nantes', 47.2184, -1.5536),
  -- Matériel-Vélo (FR)
  ('https://www.materiel-velo.com', 'Matériel-Vélo Paris', 'Paris', 48.8606, 2.3376),
  ('https://www.materiel-velo.com', 'Matériel-Vélo Marseille', 'Marseille', 43.2965, 5.3698),
  ('https://www.materiel-velo.com', 'Matériel-Vélo Nice', 'Nice', 43.7102, 7.2620)
) as s(website, name, city, lat, lng)
join public.retailers r on r.website = s.website
on conflict (retailer_id, name) do nothing;

notify pgrst, 'reload schema';
