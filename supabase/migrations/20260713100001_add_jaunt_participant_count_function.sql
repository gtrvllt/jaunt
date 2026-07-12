create or replace function get_jaunt_participant_count(jaunt_id uuid)
returns integer
language sql
security definer
stable
as $$
  select count(*)::integer
  from participation
  where participation.jaunt_id = get_jaunt_participant_count.jaunt_id
  and status in ('confirmed', 'active', 'completed');
$$;

grant execute on function get_jaunt_participant_count(uuid) to authenticated;
