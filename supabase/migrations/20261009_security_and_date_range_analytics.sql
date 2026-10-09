-- Close profile-role self-promotion and make product analytics respect the selected date range.
-- Safe to apply repeatedly.

drop policy if exists "profiles update own" on public.profiles;

create or replace function public.admin_product_stats_range(
  p_start timestamptz,
  p_end timestamptz
)
returns table(
  id uuid,
  title text,
  views bigint,
  clicks bigint,
  ctr numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    p.id,
    p.title,
    coalesce(v.views, 0)::bigint as views,
    coalesce(c.clicks, 0)::bigint as clicks,
    case
      when coalesce(v.views, 0) = 0 then 0::numeric
      else round((coalesce(c.clicks, 0)::numeric * 100) / v.views, 2)
    end as ctr
  from public.products p
  left join (
    select product_id, count(*) as views
    from public.page_views
    where product_id is not null
      and created_at >= p_start
      and created_at < p_end
    group by product_id
  ) v on v.product_id = p.id
  left join (
    select product_id, count(*) as clicks
    from public.click_events
    where product_id is not null
      and event_type = 'affiliate'
      and created_at >= p_start
      and created_at < p_end
    group by product_id
  ) c on c.product_id = p.id
  where (select private.is_admin())
  order by coalesce(c.clicks, 0) desc, p.title asc;
$$;

revoke all on function public.admin_product_stats_range(timestamptz, timestamptz) from public;
revoke all on function public.admin_product_stats_range(timestamptz, timestamptz) from anon;
grant execute on function public.admin_product_stats_range(timestamptz, timestamptz) to authenticated;
