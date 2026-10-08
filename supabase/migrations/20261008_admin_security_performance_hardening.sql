-- Harden admin RPC execution and remove redundant profile RLS work.
-- Both functions rely on existing RLS/private admin checks; invoker execution keeps
-- authorization in the caller's authenticated context.
alter function public.get_my_role() security invoker;
alter function public.admin_country_stats(timestamptz, timestamptz) security invoker;

drop policy if exists "users can read own profile" on public.profiles;

create index if not exists media_library_created_by_idx
  on public.media_library(created_by);
