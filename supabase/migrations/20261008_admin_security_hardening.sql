-- Harden admin RPC/view permissions.
revoke execute on function public.get_my_role() from anon;
grant execute on function public.get_my_role() to authenticated;

drop view if exists public.admin_product_stats;
create view public.admin_product_stats
with (security_invoker=true)
as
select p.id,p.title,
coalesce(v.views,0)::bigint views,
coalesce(c.clicks,0)::bigint clicks,
case when coalesce(v.views,0)=0 then 0 else round((coalesce(c.clicks,0)::numeric*100)/v.views,2) end ctr
from public.products p
left join (select product_id,count(*) views from public.page_views where product_id is not null group by product_id) v on v.product_id=p.id
left join (select product_id,count(*) clicks from public.click_events where product_id is not null and event_type='affiliate' group by product_id) c on c.product_id=p.id;
grant select on public.admin_product_stats to authenticated;
