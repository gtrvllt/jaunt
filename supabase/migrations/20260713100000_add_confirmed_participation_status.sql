-- Add 'confirmed' between 'waiting' and 'active'
alter type participation_status add value if not exists 'confirmed' after 'waiting';

-- Function to get participant count for a jaunt (bypasses RLS)
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
