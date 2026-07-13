create table feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  profile_id uuid not null references profile(id) on delete cascade,
  jaunt_id uuid not null references jaunt(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  unique (profile_id, jaunt_id)
);

alter table feedback enable row level security;

create policy "feedback_insert_own"
  on feedback for insert
  to authenticated
  with check (auth.uid() = profile_id);

create policy "feedback_select_own"
  on feedback for select
  to authenticated
  using (auth.uid() = profile_id);
