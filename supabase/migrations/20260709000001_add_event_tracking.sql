create table event (
  id          uuid        primary key default gen_random_uuid(),
  profile_id  uuid        references profile(id) on delete cascade,
  name        text        not null,
  properties  jsonb       not null default '{}',
  created_at  timestamptz not null default now()
);

alter table event enable row level security;

-- Chaque utilisateur ne peut voir et insérer que ses propres events
create policy "Users can insert own events"
  on event for insert
  with check (profile_id = auth.uid());

create policy "Users can read own events"
  on event for select
  using (profile_id = auth.uid());

-- Index pour les requêtes d'analytics par profil + nom
create index event_profile_id_name_idx on event (profile_id, name);
create index event_created_at_idx on event (created_at desc);
