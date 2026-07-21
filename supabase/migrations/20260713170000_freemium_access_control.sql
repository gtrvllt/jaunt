-- =============================================================================
-- Contrôle d'accès freemium (E5).
-- Règle : un membre peut s'engager sur une jaunt s'il a un abonnement actif
-- OU s'il a complété moins d'1 jaunt (offre gratuite = 1 jaunt à vie).
-- L'enforcement est fait par un TRIGGER (niveau DB) → impossible à contourner
-- côté client, quel que soit le chemin de l'update.
-- =============================================================================

-- Fonction lisible par le client pour l'affichage (paywall, état d'accès).
create or replace function get_member_access()
returns json
language sql
security definer
stable
as $$
  select json_build_object(
    'has_active_subscription', exists(
      select 1 from subscription s
      where s.profile_id = auth.uid() and s.status in ('active', 'trialing')
    ),
    'completed_jaunts', (
      select count(*) from participation p
      where p.profile_id = auth.uid() and p.status = 'completed'
    ),
    'can_start_new_jaunt', (
      exists(
        select 1 from subscription s
        where s.profile_id = auth.uid() and s.status in ('active', 'trialing')
      )
      or (
        select count(*) from participation p
        where p.profile_id = auth.uid() and p.status = 'completed'
      ) < 1
    )
  );
$$;

grant execute on function get_member_access() to authenticated;

-- Trigger d'enforcement : bloque l'engagement (waiting -> confirmed/active)
-- quand la limite gratuite est atteinte sans abonnement.
create or replace function enforce_jaunt_access()
returns trigger
language plpgsql
security definer
as $$
declare
  has_sub boolean;
  completed integer;
begin
  if new.status in ('confirmed', 'active') and coalesce(old.status::text, '') = 'waiting' then
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

create trigger trg_enforce_jaunt_access
  before update on participation
  for each row
  execute function enforce_jaunt_access();
