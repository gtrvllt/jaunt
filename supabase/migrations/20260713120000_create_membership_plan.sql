create table membership_plan (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  slug text not null unique,
  name text not null,
  price_cents integer not null,
  billing_cycle text not null default 'month',
  tagline text,
  features jsonb not null default '[]',
  is_highlighted boolean not null default false,
  sort_order integer not null default 0
);

alter table membership_plan enable row level security;

create policy "membership_plan_public_read"
  on membership_plan for select
  to anon, authenticated
  using (true);

-- Seed data
insert into membership_plan (slug, name, price_cents, billing_cycle, tagline, features, is_highlighted, sort_order)
values
  (
    'standard',
    'Standard',
    800,
    'month',
    'Découvre Paris autrement, à ton rythme.',
    '[
      {"label": "1 Jaunt par mois", "included": true},
      {"label": "Matching avec 3 co-aventuriers", "included": true},
      {"label": "Quêtes géolocalisées", "included": true},
      {"label": "Profil & historique", "included": true},
      {"label": "Quêtes exclusives", "included": false},
      {"label": "Priorité dans le matching", "included": false},
      {"label": "Badge Premium", "included": false}
    ]',
    false,
    1
  ),
  (
    'premium',
    'Premium',
    1800,
    'month',
    'L''expérience Jaunt sans compromis.',
    '[
      {"label": "Jaunts illimitées", "included": true},
      {"label": "Matching avec 3 co-aventuriers", "included": true},
      {"label": "Quêtes géolocalisées", "included": true},
      {"label": "Profil & historique", "included": true},
      {"label": "Quêtes exclusives", "included": true},
      {"label": "Priorité dans le matching", "included": true},
      {"label": "Badge Premium", "included": true}
    ]',
    true,
    2
  );
