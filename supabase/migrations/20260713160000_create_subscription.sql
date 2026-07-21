-- =============================================================================
-- Abonnements Stripe (E5 — Memberships & Access Control).
-- La source de vérité est Stripe : cette table ne fait que refléter l'état,
-- synchronisé par le webhook (service_role). Le client ne peut que LIRE son
-- propre abonnement — aucune écriture côté authenticated, pour empêcher toute
-- falsification du statut.
-- =============================================================================

create table subscription (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  profile_id uuid not null unique references profile(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status text,                              -- active|trialing|past_due|canceled|incomplete|null
  plan_slug text,                           -- 'standard' | 'premium' (dénormalisé depuis membership_plan)
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false
);

alter table subscription enable row level security;

-- Lecture : chaque membre voit uniquement son propre abonnement.
create policy "subscription_select_own"
  on subscription for select
  to authenticated
  using (profile_id = auth.uid());

-- Aucune policy insert/update/delete pour authenticated :
-- seul le service_role (webhook Stripe) écrit dans cette table.

-- Lien vers les prix Stripe : chaque formule porte son price id Stripe.
alter table membership_plan
  add column if not exists stripe_price_id text;
