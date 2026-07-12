alter table jaunt_theme
  add column if not exists image_url text,
  add column if not exists location_label text;
