-- =============================================================================
-- Accès admin & écriture de contenu.
-- Un flag is_admin sur profile ouvre l'écriture (via RLS) sur les tables de
-- contenu, pour l'interface /admin. Les utilisateurs normaux restent en
-- lecture seule sur ces tables.
-- =============================================================================

alter table profile add column if not exists is_admin boolean not null default false;

-- Helper : l'appelant est-il admin ?
create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists(select 1 from profile where id = auth.uid() and is_admin);
$$;

grant execute on function is_admin() to authenticated;

-- Solution / indice de secours dévoilé au vote (rédigé par l'admin).
alter table mission add column if not exists solution text;

-- Policies d'écriture réservées à l'admin (les tables n'avaient que du select).
create policy "admin writes jaunt_theme" on jaunt_theme
  for all to authenticated using (is_admin()) with check (is_admin());

create policy "admin writes mission" on mission
  for all to authenticated using (is_admin()) with check (is_admin());

create policy "admin writes jaunt" on jaunt
  for all to authenticated using (is_admin()) with check (is_admin());

create policy "admin writes participation" on participation
  for all to authenticated using (is_admin()) with check (is_admin());

-- Exempter l'admin du blocage freemium (pour jouer ses jaunts de test).
create or replace function enforce_jaunt_access()
returns trigger
language plpgsql
security definer
as $$
declare
  has_sub boolean;
  completed integer;
begin
  if new.status in ('confirmed', 'active')
     and coalesce(old.status::text, '') = 'waiting'
     and not exists(select 1 from profile where id = new.profile_id and is_admin)
  then
    select exists(
      select 1 from subscription s
      where s.profile_id = new.profile_id and s.status in ('active', 'trialing')
    ) into has_sub;

    if not has_sub then
      select count(*) into completed
      from participation p
      where p.profile_id = new.profile_id and p.status = 'completed';

      if completed >= 1 then
        raise exception 'FREE_LIMIT_REACHED';
      end if;
    end if;
  end if;

  return new;
end;
$$;
