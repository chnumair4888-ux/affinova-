create or replace function public.admin_country_stats(p_start timestamptz, p_end timestamptz)
returns table(country text, visitors bigint, page_views bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce(nullif(trim(country), ''), 'Unknown') as country,
    count(distinct session_id)::bigint as visitors,
    count(*)::bigint as page_views
  from public.page_views
  where created_at >= p_start
    and created_at < p_end
    and (select private.is_admin())
  group by coalesce(nullif(trim(country), ''), 'Unknown')
  order by count(*) desc;
$$;

revoke all on function public.admin_country_stats(timestamptz,timestamptz) from public;
grant execute on function public.admin_country_stats(timestamptz,timestamptz) to authenticated;
