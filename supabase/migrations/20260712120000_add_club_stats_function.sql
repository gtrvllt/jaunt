-- Returns aggregated, anonymous club statistics
-- security definer to bypass RLS and count across all participants
create or replace function get_club_stats()
returns json
language sql
security definer
stable
as $$
  select json_build_object(
    'active_members', (
      select count(distinct profile_id)
      from participation
      where status = 'active'
    ),
    'matches_today', (
      select count(distinct jaunt_id)
      from participation
      where status in ('active', 'completed')
      and joined_at >= current_date
    ),
    'total_jaunts_completed', (
      select count(distinct jaunt_id)
      from participation
      where status = 'completed'
    )
  );
$$;

-- Allow any authenticated user to call this function
grant execute on function get_club_stats() to authenticated;
