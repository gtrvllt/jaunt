-- Point de rendez-vous exact révélé en Live Mode.
-- Coordonnées stockées en colonnes numériques (pas PostGIS) pour un accès
-- client instantané, sans parsing géométrique.
alter table jaunt_theme
  add column if not exists meeting_address text,
  add column if not exists meeting_lat double precision,
  add column if not exists meeting_lng double precision,
  add column if not exists meeting_landmark_url text;
