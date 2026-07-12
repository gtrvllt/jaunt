create or replace function get_club_stats()
returns json
language sql
security definer
stable
as $$
  select json_build_object(
    'searching_this_week', (
      select count(distinct profile_id)
      from participation
      where joined_at >= date_trunc('week', now())
    ),
    'jaunts_this_week', (
      select count(distinct jaunt_id)
      from participation
      where joined_at >= date_trunc('week', now())
    )
  );
$$;

grant execute on function get_club_stats() to authenticated;
