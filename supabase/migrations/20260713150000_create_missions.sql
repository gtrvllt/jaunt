-- =============================================================================
-- Mission dashboard (#15) — remplace le proto de quêtes GPS comme Live Mode.
-- 3 mini-objectifs par thème (photo challenge, icebreaker, défi), cochables
-- en temps réel par les participants, avec preuve photo optionnelle.
-- =============================================================================

-- Catalogue des missions, rattaché au thème (comme les quêtes).
create table mission (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  theme_id uuid not null references jaunt_theme(id) on delete cascade,
  title text not null,
  description text,
  kind text not null default 'challenge' check (kind in ('photo', 'icebreaker', 'challenge')),
  sequence_order integer not null
);

alter table mission enable row level security;

create policy "mission_read"
  on mission for select
  to authenticated
  using (true);

-- Complétion d'une mission par un participant sur une jaunt donnée.
create table mission_completion (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  mission_id uuid not null references mission(id) on delete cascade,
  jaunt_id uuid not null references jaunt(id) on delete cascade,
  profile_id uuid not null references profile(id) on delete cascade,
  photo_url text,
  unique (mission_id, jaunt_id, profile_id)
);

alter table mission_completion enable row level security;

-- Lecture : tous les membres d'une même jaunt voient les complétions du groupe
-- (progression collective).
create policy "mission_completion_select_group"
  on mission_completion for select
  to authenticated
  using (
    exists (
      select 1 from participation p
      where p.jaunt_id = mission_completion.jaunt_id
        and p.profile_id = auth.uid()
    )
  );

-- Écriture : chacun ne gère que ses propres complétions.
create policy "mission_completion_insert_own"
  on mission_completion for insert
  to authenticated
  with check (profile_id = auth.uid());

create policy "mission_completion_update_own"
  on mission_completion for update
  to authenticated
  using (profile_id = auth.uid());

create policy "mission_completion_delete_own"
  on mission_completion for delete
  to authenticated
  using (profile_id = auth.uid());

-- =============================================================================
-- Bucket de stockage des preuves photo (public en lecture, écriture propriétaire).
-- Chemin attendu : <profile_id>/<jaunt_id>/<mission_id>.<ext>
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('mission-photos', 'mission-photos', true)
on conflict (id) do nothing;

create policy "mission photos publicly readable"
  on storage.objects for select
  to public
  using (bucket_id = 'mission-photos');

create policy "users upload own mission photo"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'mission-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users update own mission photo"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'mission-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
