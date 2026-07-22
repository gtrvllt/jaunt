-- Chaque mission est une étape liée à un lieu : l'endroit à trouver via
-- l'indice. L'adresse est le "secret" de l'étape — côté jeu elle n'est pas
-- affichée d'office (elle sera dévoilée par le vote "langue au chat" avec
-- la solution). Colonnes numériques simples (pas PostGIS), comme le RDV.
alter table mission
  add column if not exists location_address text,
  add column if not exists location_lat double precision,
  add column if not exists location_lng double precision;
