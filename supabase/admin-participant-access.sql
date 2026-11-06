CREATE OR REPLACE FUNCTION explorer_private.queue_signup_notice()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if exists(select 1 from explorer_private.admins where user_id=new.user_id) then return new; end if;
 if tg_op='INSERT' and new.status='pending' then
  insert into explorer_private.signup_mail_queue(user_id,cohort_id,kind) values(new.user_id,new.cohort_id,'admin'),(new.user_id,new.cohort_id,'receipt') on conflict do nothing;
 elsif tg_op='UPDATE' and old.status='pending' and new.status='approved' then
  insert into explorer_private.signup_mail_queue(user_id,cohort_id,kind) values(new.user_id,new.cohort_id,'approval') on conflict do nothing;
 end if;
 return new;
end $function$;
create or replace function explorer_private.admin_ensure_participant_access(p_cohort uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_status text;
begin
 if auth.uid() is null or not public.explorer_is_admin() then
  raise exception 'Adminisztrátori jogosultság szükséges.' using errcode='42501';
 end if;
 if not exists(select 1 from public.explorer_cohorts where id=p_cohort) then
  raise exception 'Az évfolyam nem található.';
 end if;
 select status into v_status from public.explorer_memberships where user_id=auth.uid() and cohort_id=p_cohort;
 if v_status is not null and v_status<>'approved' then
  update public.explorer_memberships set status='approved',approved_at=coalesce(approved_at,now()) where user_id=auth.uid() and cohort_id=p_cohort;
 end if;
 insert into public.explorer_memberships(user_id,cohort_id,status,approved_at)
 values(auth.uid(),p_cohort,'approved',now()) on conflict(user_id,cohort_id) do nothing;
end $$;
revoke all on function explorer_private.admin_ensure_participant_access(uuid) from public,anon;
grant execute on function explorer_private.admin_ensure_participant_access(uuid) to authenticated;
create or replace function public.explorer_admin_ensure_participant_access(p_cohort uuid)
returns void language sql set search_path='' as $$ select explorer_private.admin_ensure_participant_access(p_cohort); $$;
revoke all on function public.explorer_admin_ensure_participant_access(uuid) from public,anon;
grant execute on function public.explorer_admin_ensure_participant_access(uuid) to authenticated;
CREATE OR REPLACE FUNCTION explorer_private.explorer_shared_rooms(p_cohort uuid)
 RETURNS TABLE(user_id uuid, display_name text, room jsonb)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if auth.uid() is null or (not public.explorer_is_admin() and (not public.explorer_is_member(p_cohort) or not exists(select 1 from public.explorer_cohorts c where c.id=p_cohort and c.rooms_shared))) then
  raise exception 'A termek megosztása nem érhető el.' using errcode='42501';
 end if;
 return query
 select m.user_id,p.display_name,
 case when s.payload is null then null else jsonb_build_object(
  'roomName',s.payload->'roomName',
  'roomSettings',jsonb_build_object('theme',s.payload->'roomSettings'->'theme','wall',s.payload->'roomSettings'->'wall','floor',s.payload->'roomSettings'->'floor','view',s.payload->'roomSettings'->'view','motto',s.payload->'roomSettings'->'motto'),
  'roomVersion',s.payload->'roomVersion',
  'items',coalesce((select jsonb_agg(item) from jsonb_array_elements(case when jsonb_typeof(s.payload->'items')='array' then s.payload->'items' else '[]'::jsonb end) item where item->>'stored' is distinct from 'true'),'[]'::jsonb)
 ) end
 from public.explorer_memberships m
 join public.explorer_profiles p on p.id=m.user_id
 left join public.explorer_learning_states s on s.user_id=m.user_id and s.cohort_id=m.cohort_id
 where m.cohort_id=p_cohort and m.status='approved'
 order by p.display_name,m.user_id;
end $function$;
CREATE OR REPLACE FUNCTION explorer_private.case_submit(p_cohort uuid, p_day text, p_case text, p_answers jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if auth.uid() is null or not explorer_private.explorer_is_member(p_cohort) then raise exception 'Jóváhagyott tagság szükséges.' using errcode='42501'; end if;
 if not exists(select 1 from public.explorer_cohorts c cross join lateral jsonb_array_elements(c.catalog->'days') d cross join lateral jsonb_array_elements(coalesce(d->'cases','[]'::jsonb)) x where c.id=p_cohort and d->>'id'=p_day and (d->>'open'='true' or public.explorer_is_admin()) and x->>'id'=p_case) then raise exception 'A feladat nem érhető el.' using errcode='42501'; end if;
 if jsonb_typeof(p_answers)<>'object' or pg_column_size(p_answers)>100000 or not exists(select 1 from jsonb_each_text(p_answers) e where length(trim(e.value))>0) then raise exception 'Adj meg legalább egy választ.'; end if;
 insert into explorer_private.case_submissions(cohort_id,user_id,day_id,case_id,answers) values(p_cohort,auth.uid(),p_day,p_case,p_answers) on conflict(cohort_id,user_id,day_id,case_id) do nothing;
end; $function$;
CREATE OR REPLACE FUNCTION explorer_private.reflection_day_access(p_cohort uuid, p_day text, p_write boolean DEFAULT false)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select auth.uid() is not null and (case when p_write then public.explorer_is_member(p_cohort) else public.explorer_is_admin() or public.explorer_is_member(p_cohort) end) and exists(select 1 from public.explorer_cohorts c cross join lateral jsonb_array_elements(coalesce(c.catalog->'days','[]'::jsonb)) d where c.id=p_cohort and d->>'id'=p_day and length(btrim(coalesce(d->>'reflectionPrompt','')))>0 and (d->>'open'='true' or public.explorer_is_admin()));
$function$;
