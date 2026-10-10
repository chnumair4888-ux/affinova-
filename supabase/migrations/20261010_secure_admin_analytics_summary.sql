-- Keep admin analytics protected and align affiliate-click event naming.
-- Safe to apply repeatedly; no existing analytics data is modified.

create or replace function public.admin_analytics_summary(
  p_start timestamptz,
  p_end timestamptz
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'visitors', (
      select count(distinct session_id)
      from public.page_views
      where created_at >= p_start and created_at < p_end
    ),
    'page_views', (
      select count(*)
      from public.page_views
      where created_at >= p_start and created_at < p_end
    ),
    'affiliate_clicks', (
      select count(*)
      from public.click_events
      where event_type = 'affiliate'
        and created_at >= p_start and created_at < p_end
    ),
    'searches', (
      select count(*)
      from public.search_events
      where created_at >= p_start and created_at < p_end
    )
  )
  where (select private.is_admin());
$$;

revoke all on function public.admin_analytics_summary(timestamptz, timestamptz) from public;
revoke all on function public.admin_analytics_summary(timestamptz, timestamptz) from anon;
grant execute on function public.admin_analytics_summary(timestamptz, timestamptz) to authenticated;
