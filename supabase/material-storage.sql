begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('explorer-materials','explorer-materials',false,20971520,array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/plain','image/jpeg','image/png','image/webp','application/zip']);
-- The file may belong to a source cohort: a copied cohort retains its own catalog reference.
create function explorer_private.can_read_material(p_path text) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and (public.explorer_is_admin() or exists(
 select 1 from public.explorer_cohorts c join public.explorer_memberships m on m.cohort_id=c.id
 cross join lateral jsonb_array_elements(c.catalog->'days') d
 cross join lateral jsonb_array_elements(d->'materials') material
 where m.user_id=(select auth.uid()) and m.status='approved' and d->>'open'='true' and material->>'storagePath'=p_path));
$$;
revoke all on function explorer_private.can_read_material(text) from public,anon,authenticated;
grant execute on function explorer_private.can_read_material(text) to authenticated;
create policy explorer_material_read on storage.objects for select to authenticated using(bucket_id='explorer-materials' and (select explorer_private.can_read_material(name)));
create policy explorer_material_upload on storage.objects for insert to authenticated with check(bucket_id='explorer-materials' and (select public.explorer_is_admin()) and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.[a-z0-9]+$');
-- No overwrite/delete permission: catalog copies keep working after a source material is removed.
commit;
