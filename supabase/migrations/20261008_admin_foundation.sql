-- Affinova production admin foundation
-- Safe for existing database: additive only, no destructive DROP/TRUNCATE.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users au
    where au.user_id = (select auth.uid())
  )
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  );
$$;

revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated;

insert into public.admin_users(user_id)
select p.id
from public.profiles p
where p.role = 'admin'
on conflict (user_id) do nothing;

drop policy if exists "admin_users self or admin read" on public.admin_users;
create policy "admin_users self or admin read"
on public.admin_users for select
to authenticated
using (user_id = (select auth.uid()) or private.is_admin());

drop policy if exists "admin_users admin write" on public.admin_users;
create policy "admin_users admin write"
on public.admin_users for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

-- Site settings: one JSON value per setting key.
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

drop policy if exists "settings public read" on public.site_settings;
create policy "settings public read"
on public.site_settings for select
to anon, authenticated
using (true);

drop policy if exists "settings admin write" on public.site_settings;
create policy "settings admin write"
on public.site_settings for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

insert into public.site_settings(key,value) values
 ('general','{"site_name":"Affinova","tagline":"","contact_email":""}'::jsonb),
 ('seo','{"meta_title":"Affinova","meta_description":"","og_image":""}'::jsonb),
 ('social','{}'::jsonb),
 ('appearance','{"primary_color":"#111111","theme":"system"}'::jsonb),
 ('integrations','{}'::jsonb),
 ('footer','{"text":""}'::jsonb),
 ('affiliate','{"disclosure":"Some links on Affinova are affiliate links. If you purchase through our links, we may earn a commission at no additional cost to you."}'::jsonb)
on conflict (key) do nothing;

-- Editable legal/content pages.
create table if not exists public.content_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  content text not null default '',
  excerpt text,
  seo_title text,
  seo_description text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.content_pages enable row level security;

drop policy if exists "content pages public read" on public.content_pages;
create policy "content pages public read"
on public.content_pages for select
to anon, authenticated
using (is_published or private.is_admin());

drop policy if exists "content pages admin write" on public.content_pages;
create policy "content pages admin write"
on public.content_pages for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

-- Homepage sections are data-driven and ordered.
create table if not exists public.homepage_sections (
  id uuid primary key default gen_random_uuid(),
  section_type text not null,
  title text not null default '',
  subtitle text not null default '',
  content jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists homepage_sections_sort_idx
on public.homepage_sections(is_active, sort_order);

alter table public.homepage_sections enable row level security;

drop policy if exists "homepage sections public read" on public.homepage_sections;
create policy "homepage sections public read"
on public.homepage_sections for select
to anon, authenticated
using (is_active or private.is_admin());

drop policy if exists "homepage sections admin write" on public.homepage_sections;
create policy "homepage sections admin write"
on public.homepage_sections for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

-- Media metadata. Files live in Supabase Storage bucket affinova-media.
create table if not exists public.media_library (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  storage_path text not null unique,
  public_url text not null,
  mime_type text,
  size_bytes bigint,
  alt_text text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists media_library_created_idx
on public.media_library(created_at desc);

alter table public.media_library enable row level security;

drop policy if exists "media public read" on public.media_library;
create policy "media public read"
on public.media_library for select
to anon, authenticated
using (true);

drop policy if exists "media admin write" on public.media_library;
create policy "media admin write"
on public.media_library for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

insert into storage.buckets(id,name,public)
values ('affinova-media','affinova-media',true)
on conflict (id) do update set public = true;

drop policy if exists "affinova media public read" on storage.objects;
create policy "affinova media public read"
on storage.objects for select
to public
using (bucket_id = 'affinova-media');

drop policy if exists "affinova media admin insert" on storage.objects;
create policy "affinova media admin insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'affinova-media' and private.is_admin());

drop policy if exists "affinova media admin update" on storage.objects;
create policy "affinova media admin update"
on storage.objects for update
to authenticated
using (bucket_id = 'affinova-media' and private.is_admin())
with check (bucket_id = 'affinova-media' and private.is_admin());

drop policy if exists "affinova media admin delete" on storage.objects;
create policy "affinova media admin delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'affinova-media' and private.is_admin());

-- Product SEO/status fields, additive.
alter table public.products add column if not exists status text;
alter table public.products add column if not exists seo_title text;
alter table public.products add column if not exists seo_description text;
alter table public.products add column if not exists seo_keywords text;
alter table public.products add column if not exists og_image text;
update public.products set status = case when is_active then 'published' else 'draft' end where status is null;
alter table public.products alter column status set default 'draft';

alter table public.guides add column if not exists seo_title text;
alter table public.guides add column if not exists seo_description text;
alter table public.guides add column if not exists seo_keywords text;
alter table public.guides add column if not exists og_image text;

-- Real, privacy-friendly analytics.
create table if not exists public.page_views (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  path text not null,
  referrer text,
  device_type text,
  country text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  product_id uuid references public.products(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.click_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  event_type text not null,
  path text,
  product_id uuid references public.products(id) on delete set null,
  label text,
  destination text,
  device_type text,
  country text,
  created_at timestamptz not null default now()
);

create table if not exists public.search_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  query text not null,
  results_count integer,
  path text,
  device_type text,
  created_at timestamptz not null default now()
);

create index if not exists page_views_created_idx on public.page_views(created_at desc);
create index if not exists page_views_path_idx on public.page_views(path);
create index if not exists page_views_product_idx on public.page_views(product_id);
create index if not exists page_views_session_idx on public.page_views(session_id);
create index if not exists click_events_created_idx on public.click_events(created_at desc);
create index if not exists click_events_product_idx on public.click_events(product_id);
create index if not exists click_events_type_idx on public.click_events(event_type);
create index if not exists search_events_created_idx on public.search_events(created_at desc);
create index if not exists search_events_query_idx on public.search_events(query);

alter table public.page_views enable row level security;
alter table public.click_events enable row level security;
alter table public.search_events enable row level security;

drop policy if exists "page views public insert" on public.page_views;
create policy "page views public insert"
on public.page_views for insert
to anon, authenticated
with check (length(session_id) between 8 and 128 and length(path) between 1 and 500);

drop policy if exists "page views admin read" on public.page_views;
create policy "page views admin read"
on public.page_views for select
to authenticated
using (private.is_admin());

drop policy if exists "click events public insert" on public.click_events;
create policy "click events public insert"
on public.click_events for insert
to anon, authenticated
with check (length(session_id) between 8 and 128);

drop policy if exists "click events admin read" on public.click_events;
create policy "click events admin read"
on public.click_events for select
to authenticated
using (private.is_admin());

drop policy if exists "search events public insert" on public.search_events;
create policy "search events public insert"
on public.search_events for insert
to anon, authenticated
with check (length(session_id) between 8 and 128 and length(query) between 1 and 500);

drop policy if exists "search events admin read" on public.search_events;
create policy "search events admin read"
on public.search_events for select
to authenticated
using (private.is_admin());

-- Analytics aggregate functions. They return only aggregated information to admins.
create or replace function public.admin_analytics_summary(p_start timestamptz, p_end timestamptz)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'visitors', (select count(distinct session_id) from public.page_views where created_at >= p_start and created_at < p_end),
    'page_views', (select count(*) from public.page_views where created_at >= p_start and created_at < p_end),
    'affiliate_clicks', (select count(*) from public.click_events where event_type = 'affiliate_click' and created_at >= p_start and created_at < p_end),
    'searches', (select count(*) from public.search_events where created_at >= p_start and created_at < p_end)
  )
  where private.is_admin();
$$;

grant execute on function public.admin_analytics_summary(timestamptz,timestamptz) to authenticated;

create or replace view public.admin_product_stats as
select
  p.id,
  p.title,
  p.slug,
  count(distinct pv.id) filter (where pv.id is not null) as views,
  count(distinct ce.id) filter (where ce.event_type = 'affiliate_click') as clicks,
  case when count(distinct pv.id) = 0 then 0
       else round((count(distinct ce.id) filter (where ce.event_type = 'affiliate_click'))::numeric
                  / count(distinct pv.id)::numeric * 100, 2)
  end as ctr
from public.products p
left join public.page_views pv on pv.product_id = p.id
left join public.click_events ce on ce.product_id = p.id
group by p.id, p.title, p.slug;

alter view public.admin_product_stats set (security_invoker = true);
revoke all on public.admin_product_stats from anon;
grant select on public.admin_product_stats to authenticated;

-- Public pages can continue using the existing legacy settings table.
