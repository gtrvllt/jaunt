-- Formule gratuite (affichage). Le "gratuit" = absence d'abonnement Stripe :
-- pas de stripe_price_id, price_cents = 0. Sert uniquement à présenter le
-- palier Free sur l'écran des abonnements.
insert into membership_plan (slug, name, price_cents, billing_cycle, tagline, features, is_highlighted, sort_order)
values (
  'free',
  'Free',
  0,
  'month',
  'Goûte à l''aventure, une première fois.',
  '[
    {"label": "1 Jaunt découverte (à vie)", "included": true},
    {"label": "Matching avec 3 co-aventuriers", "included": true},
    {"label": "Quêtes géolocalisées", "included": true},
    {"label": "Jaunts récurrentes", "included": false},
    {"label": "Quêtes exclusives", "included": false},
    {"label": "Badge Premium", "included": false}
  ]',
  false,
  0
)
on conflict (slug) do nothing;
