begin;
create table explorer_private.visit_reports (
 id uuid primary key default gen_random_uuid(), cohort_id uuid not null references public.explorer_cohorts(id),
 user_id uuid not null references public.explorer_profiles(id), title text not null check(length(btrim(title)) between 1 and 200),
 body text not null default '' check(length(body)<=100000), file_path text, file_name text, created_at timestamptz not null default now(),
 check(length(btrim(body))>0 or file_path is not null), check((file_path is null)=(file_name is null))
);
alter table explorer_private.visit_reports enable row level security;
revoke all on explorer_private.visit_reports from public,anon,authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('explorer-visit-reports','explorer-visit-reports',false,20971520,array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain','image/jpeg','image/png']);
create function explorer_private.report_upload_allowed(p_path text) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and split_part(p_path,'/',1)=auth.uid()::text and p_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(pdf|doc|docx|txt|jpg|jpeg|png)$' and exists(select 1 from public.explorer_memberships where user_id=auth.uid() and status='approved'); $$;
create function explorer_private.report_file_readable(p_path text) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and (public.explorer_is_admin() or (split_part(p_path,'/',1)=auth.uid()::text and explorer_private.report_upload_allowed(p_path)) or exists(select 1 from explorer_private.visit_reports r where r.file_path=p_path and public.explorer_is_member(r.cohort_id))); $$;
revoke all on function explorer_private.report_upload_allowed(text),explorer_private.report_file_readable(text) from public,anon,authenticated;
grant execute on function explorer_private.report_upload_allowed(text),explorer_private.report_file_readable(text) to authenticated;
create policy visit_report_upload on storage.objects for insert to authenticated with check(bucket_id='explorer-visit-reports' and explorer_private.report_upload_allowed(name));
create policy visit_report_read on storage.objects for select to authenticated using(bucket_id='explorer-visit-reports' and explorer_private.report_file_readable(name));
create function explorer_private.report_file_removable(p_path text) returns boolean language sql stable security definer set search_path='' as $$ select explorer_private.report_upload_allowed(p_path) and not exists(select 1 from explorer_private.visit_reports r where r.file_path=p_path); $$;
revoke all on function explorer_private.report_file_removable(text) from public,anon,authenticated;
grant execute on function explorer_private.report_file_removable(text) to authenticated;
create policy visit_report_cleanup on storage.objects for delete to authenticated using(bucket_id='explorer-visit-reports' and explorer_private.report_file_removable(name));
create function explorer_private.visit_report_add(p_cohort uuid,p_title text,p_body text,p_file_path text,p_file_name text) returns uuid language plpgsql security definer set search_path='' as $$
declare report_id uuid; begin
 if auth.uid() is null or not public.explorer_is_member(p_cohort) then raise exception 'Jóváhagyott évfolyamtagság szükséges.' using errcode='42501'; end if;
 if p_file_path is not null and (not explorer_private.report_upload_allowed(p_file_path) or not exists(select 1 from storage.objects o where o.bucket_id='explorer-visit-reports' and o.name=p_file_path)) then raise exception 'A feltöltött fájl nem található.'; end if;
 if p_file_name is not null and length(p_file_name)>255 then raise exception 'A fájlnév túl hosszú.'; end if;
 insert into explorer_private.visit_reports(cohort_id,user_id,title,body,file_path,file_name) values(p_cohort,auth.uid(),btrim(p_title),coalesce(p_body,''),p_file_path,p_file_name) returning id into report_id; return report_id;
end $$;
create function explorer_private.visit_reports_list(p_cohort uuid) returns table(id uuid,title text,body text,file_path text,file_name text,created_at timestamptz,display_name text) language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not (public.explorer_is_admin() or public.explorer_is_member(p_cohort)) then raise exception 'Nincs hozzáférés.' using errcode='42501'; end if;
 return query select r.id,r.title,r.body,r.file_path,r.file_name,r.created_at,p.display_name from explorer_private.visit_reports r join public.explorer_profiles p on p.id=r.user_id where r.cohort_id=p_cohort order by r.created_at desc;
end $$;
create function public.explorer_visit_report_add(p_cohort uuid,p_title text,p_body text,p_file_path text,p_file_name text) returns uuid language sql security invoker set search_path='' as $$ select explorer_private.visit_report_add(p_cohort,p_title,p_body,p_file_path,p_file_name); $$;
create function public.explorer_visit_reports_list(p_cohort uuid) returns table(id uuid,title text,body text,file_path text,file_name text,created_at timestamptz,display_name text) language sql stable security invoker set search_path='' as $$ select * from explorer_private.visit_reports_list(p_cohort); $$;
revoke all on function public.explorer_visit_report_add(uuid,text,text,text,text),public.explorer_visit_reports_list(uuid),explorer_private.visit_report_add(uuid,text,text,text,text),explorer_private.visit_reports_list(uuid) from public,anon,authenticated;
grant execute on function public.explorer_visit_report_add(uuid,text,text,text,text),public.explorer_visit_reports_list(uuid),explorer_private.visit_report_add(uuid,text,text,text,text),explorer_private.visit_reports_list(uuid) to authenticated;
commit;
