-- Affinova admin/media hardening
-- Safe to run repeatedly.

insert into storage.buckets (id,name,public)
values ('affinova-media','affinova-media',true)
on conflict (id) do update set public=true;

drop policy if exists "affinova media public read" on storage.objects;
create policy "affinova media public read" on storage.objects
for select to anon,authenticated
using (bucket_id='affinova-media');

drop policy if exists "affinova media admin insert" on storage.objects;
create policy "affinova media admin insert" on storage.objects
for insert to authenticated
with check (bucket_id='affinova-media' and (select private.is_admin()));

drop policy if exists "affinova media admin update" on storage.objects;
create policy "affinova media admin update" on storage.objects
for update to authenticated
using (bucket_id='affinova-media' and (select private.is_admin()))
with check (bucket_id='affinova-media' and (select private.is_admin()));

drop policy if exists "affinova media admin delete" on storage.objects;
create policy "affinova media admin delete" on storage.objects
for delete to authenticated
using (bucket_id='affinova-media' and (select private.is_admin()));

grant select on public.site_settings to anon,authenticated;
grant insert,update,delete,select on public.site_settings to authenticated;
