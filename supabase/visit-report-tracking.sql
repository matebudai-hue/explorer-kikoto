begin;
alter table explorer_private.visit_reports add column visit_id uuid references explorer_private.visits(id);
create index visit_reports_visit_user on explorer_private.visit_reports(visit_id,user_id,cohort_id);
create function explorer_private.visit_report_add_linked(p_cohort uuid,p_title text,p_body text,p_file_path text,p_file_name text,p_visit uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare result_id uuid;
begin
 if auth.uid() is null or not public.explorer_is_member(p_cohort) then raise exception 'Nincs jogosultság.' using errcode='42501'; end if;
 if p_visit is not null and not exists(select 1 from explorer_private.visits v join explorer_private.visit_days d on d.visit_id=v.id join explorer_private.visit_bookings b on b.day_id=d.id where v.id=p_visit and b.user_id=auth.uid() and b.active and (v.cohort_id=p_cohort or v.scope='all')) then
  raise exception 'Ehhez az alkalomhoz nincs jelentkezésed.' using errcode='42501';
 end if;
 result_id:=explorer_private.visit_report_add(p_cohort,p_title,p_body,p_file_path,p_file_name);
 update explorer_private.visit_reports set visit_id=p_visit where id=result_id;
 return result_id;
end $$;
create function public.explorer_visit_report_add_linked(p_cohort uuid,p_title text,p_body text,p_file_path text,p_file_name text,p_visit uuid)
returns uuid language sql security invoker set search_path='' as $$ select explorer_private.visit_report_add_linked(p_cohort,p_title,p_body,p_file_path,p_file_name,p_visit); $$;
create function explorer_private.missing_visit_reports(p_cohort uuid)
returns table(visit_id uuid,program text,place text,visit_date date,display_name text) language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.explorer_is_admin() then raise exception 'Nincs jogosultság.' using errcode='42501'; end if;
 return query with ranked as (
  select b.user_id,d.visit_id,d.day,d.capacity,row_number() over(partition by d.id order by b.id) as position
  from explorer_private.visit_bookings b join explorer_private.visit_days d on d.id=b.day_id join explorer_private.visits v on v.id=d.visit_id
  where b.active and explorer_private.visit_eligible(v.cohort_id,v.scope,b.user_id) and (v.kind='two' or d.ordinal=1)
 ), confirmed as (
  select distinct on (r.visit_id,r.user_id) r.visit_id,r.user_id,r.day
  from ranked r where r.position<=r.capacity and r.day<(now() at time zone 'Europe/Budapest')::date
  order by r.visit_id,r.user_id,r.day
 )
 select v.id,v.program,v.place,c.day,p.display_name from confirmed c
 join explorer_private.visits v on v.id=c.visit_id and not v.cancelled
 join public.explorer_memberships m on m.user_id=c.user_id and m.cohort_id=p_cohort and m.status='approved'
 join public.explorer_profiles p on p.id=c.user_id
 where (v.cohort_id=p_cohort or v.scope='all')
 and not exists(select 1 from explorer_private.visit_reports r where r.visit_id=v.id and r.user_id=c.user_id and r.cohort_id=p_cohort)
 order by c.day desc,p.display_name;
end $$;
create function public.explorer_missing_visit_reports(p_cohort uuid)
returns table(visit_id uuid,program text,place text,visit_date date,display_name text) language sql stable security invoker set search_path='' as $$ select * from explorer_private.missing_visit_reports(p_cohort); $$;
revoke all on function explorer_private.visit_report_add_linked(uuid,text,text,text,text,uuid),public.explorer_visit_report_add_linked(uuid,text,text,text,text,uuid),explorer_private.missing_visit_reports(uuid),public.explorer_missing_visit_reports(uuid) from public,anon,authenticated;
grant execute on function explorer_private.visit_report_add_linked(uuid,text,text,text,text,uuid),public.explorer_visit_report_add_linked(uuid,text,text,text,text,uuid),explorer_private.missing_visit_reports(uuid),public.explorer_missing_visit_reports(uuid) to authenticated;
commit;
