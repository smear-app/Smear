create or replace function public.fetch_logged_gyms()
returns table (
  id text,
  name text
)
language sql
stable
security invoker
as $$
  select distinct
    c.gym_id::text as id,
    c.gym_name as name
  from public.climbs as c
  where c.user_id = auth.uid()
    and c.gym_id is not null
    and c.gym_name is not null
    and btrim(c.gym_name) <> ''
  order by name asc;
$$;
