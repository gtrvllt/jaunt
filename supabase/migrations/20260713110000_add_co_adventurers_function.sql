create or replace function get_jaunt_co_adventurers(p_jaunt_id uuid)
returns json
language sql
security definer
stable
as $$
  select coalesce(json_agg(
    json_build_object(
      'profile_id', p.id,
      'nickname', p.nickname,
      'status', part.status,
      'shared_interest', (
        select i.name
        from profile_interest pi1
        join profile_interest pi2 on pi1.interest_id = pi2.interest_id
        join interest i on i.id = pi1.interest_id
        where pi1.profile_id = auth.uid()
          and pi2.profile_id = p.id
        limit 1
      )
    )
    order by part.joined_at asc
  ), '[]'::json)
  from participation part
  join profile p on p.id = part.profile_id
  where part.jaunt_id = p_jaunt_id
    and part.profile_id != auth.uid()
    and part.status in ('confirmed', 'active');
$$;

grant execute on function get_jaunt_co_adventurers(uuid) to authenticated;
