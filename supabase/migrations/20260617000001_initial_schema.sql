-- Enable PostGIS for geolocation
create extension if not exists postgis;

-- ============================================================
-- ENUMS
-- ============================================================

create type profile_status as enum ('idle', 'busy');
create type participation_status as enum ('waiting', 'active', 'completed', 'dropped');
create type jaunt_status as enum ('pending', 'active', 'completed', 'dropped');

-- ============================================================
-- INTEREST
-- ============================================================

create table interest (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table interest enable row level security;

create policy "interests are readable by authenticated users"
  on interest for select to authenticated using (true);

-- ============================================================
-- PROFILE
-- ============================================================

create table profile (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null,
  avatar_url text,
  status profile_status not null default 'idle',
  xp_points int not null default 0,
  joined_at timestamptz not null default now()
);

alter table profile enable row level security;

create policy "profiles are readable by authenticated users"
  on profile for select to authenticated using (true);

create policy "users can update their own profile"
  on profile for update to authenticated using (auth.uid() = id);

-- ============================================================
-- PROFILE INTEREST
-- ============================================================

create table profile_interest (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profile (id) on delete cascade,
  interest_id uuid not null references interest (id) on delete cascade,
  unique (profile_id, interest_id)
);

alter table profile_interest enable row level security;

create policy "profile interests are readable by authenticated users"
  on profile_interest for select to authenticated using (true);

create policy "users can manage their own interests"
  on profile_interest for all to authenticated using (auth.uid() = profile_id);

-- ============================================================
-- ACHIEVEMENT
-- ============================================================

create table achievement (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

alter table achievement enable row level security;

create policy "achievements are readable by authenticated users"
  on achievement for select to authenticated using (true);

-- ============================================================
-- PROFILE ACHIEVEMENT
-- ============================================================

create table profile_achievement (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profile (id) on delete cascade,
  achievement_id uuid not null references achievement (id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique (profile_id, achievement_id)
);

alter table profile_achievement enable row level security;

create policy "profile achievements are readable by authenticated users"
  on profile_achievement for select to authenticated using (true);

-- ============================================================
-- JAUNT THEME
-- ============================================================

create table jaunt_theme (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  difficulty int not null check (difficulty between 1 and 5),
  created_at timestamptz not null default now()
);

alter table jaunt_theme enable row level security;

create policy "jaunt themes are readable by authenticated users"
  on jaunt_theme for select to authenticated using (true);

-- ============================================================
-- QUEST
-- ============================================================

create table quest (
  id uuid primary key default gen_random_uuid(),
  theme_id uuid not null references jaunt_theme (id) on delete cascade,
  hint_text text not null,
  hint_visual_url text,
  location geography(point, 4326) not null,
  sequence_order int not null check (sequence_order between 1 and 3),
  created_at timestamptz not null default now(),
  unique (theme_id, sequence_order)
);

alter table quest enable row level security;

create policy "quests are readable by authenticated users"
  on quest for select to authenticated using (true);

-- ============================================================
-- JAUNT
-- ============================================================

create table jaunt (
  id uuid primary key default gen_random_uuid(),
  theme_id uuid not null references jaunt_theme (id),
  status jaunt_status not null default 'pending',
  current_quest_index int not null default 1 check (current_quest_index between 1 and 3),
  created_at timestamptz not null default now(),
  scheduled_at timestamptz,
  completed_at timestamptz
);

alter table jaunt enable row level security;

create policy "jaunts are readable by participants"
  on jaunt for select to authenticated using (
    exists (
      select 1 from participation
      where participation.jaunt_id = id
        and participation.profile_id = auth.uid()
    )
  );

-- ============================================================
-- PARTICIPATION
-- ============================================================

create table participation (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profile (id) on delete cascade,
  jaunt_id uuid not null references jaunt (id) on delete cascade,
  status participation_status not null default 'waiting',
  current_quest_index int not null default 1 check (current_quest_index between 1 and 3),
  joined_at timestamptz not null default now(),
  arrived_at timestamptz,
  unique (profile_id, jaunt_id)
);

alter table participation enable row level security;

create policy "users can read their own participations"
  on participation for select to authenticated using (auth.uid() = profile_id);

create policy "users can read co-participants in their jaunts"
  on participation for select to authenticated using (
    exists (
      select 1 from participation p2
      where p2.jaunt_id = jaunt_id
        and p2.profile_id = auth.uid()
    )
  );

-- ============================================================
-- REVIEW
-- ============================================================

create table review (
  id uuid primary key default gen_random_uuid(),
  jaunt_id uuid not null references jaunt (id) on delete cascade,
  reviewer_id uuid not null references profile (id) on delete cascade,
  reviewee_id uuid not null references profile (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  is_reported boolean not null default false,
  created_at timestamptz not null default now(),
  unique (jaunt_id, reviewer_id, reviewee_id)
);

alter table review enable row level security;

create policy "users can read reviews about themselves"
  on review for select to authenticated using (auth.uid() = reviewee_id);

create policy "users can write reviews for their jaunt co-participants"
  on review for insert to authenticated with check (
    auth.uid() = reviewer_id
    and reviewer_id <> reviewee_id
    and exists (
      select 1 from participation p1
      join participation p2 on p1.jaunt_id = p2.jaunt_id
      where p1.profile_id = auth.uid()
        and p2.profile_id = reviewee_id
        and p1.jaunt_id = jaunt_id
    )
  );
