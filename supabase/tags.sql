create table if not exists public.tags (
  key text primary key,
  label text not null,
  icon text not null,
  sort_order integer not null default 0
);

alter table public.tags enable row level security;

create policy "Tags lisibles par tous"
  on public.tags
  for select
  to anon, authenticated
  using (true);

insert into public.tags (key, label, icon, sort_order) values
  ('panorama', 'Panorama', 'Mountain', 1),
  ('chrono', 'Chrono', 'Timer', 2),
  ('grimpee', 'Grimpée', 'TrendingUp', 3),
  ('foret', 'Forêt', 'Trees', 4),
  ('famille', 'Famille', 'Users', 5),
  ('technique', 'Technique', 'Settings2', 6),
  ('ravitaillement', 'Ravitaillement', 'Coffee', 7),
  ('nocturne', 'Nocturne', 'Moon', 8),
  ('ensoleille', 'Ensoleillé', 'Sun', 9),
  ('pluie', 'Pluie possible', 'CloudRain', 10),
  ('vent', 'Venteux', 'Wind', 11),
  ('photo', 'Spot photo', 'Camera', 12)
on conflict (key) do nothing;
