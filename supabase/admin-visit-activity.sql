begin;
create function explorer_private.admin_visit_activity(p_cohort uuid)
returns table(user_id uuid,kind text,detail jsonb,created_at timestamptz)
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.explorer_is_admin() then raise exception 'Adminisztrátori jogosultság szükséges.' using errcode='42501'; end if;
 return query select z.user_id,z.kind,z.detail,z.created_at from (
  select b.user_id,'visit_booking'::text as kind,jsonb_build_object('program',v.program,'day',d.day) as detail,b.created_at
  from explorer_private.visit_bookings b
  join explorer_private.visit_days d on d.id=b.day_id
  join explorer_private.visits v on v.id=d.visit_id
  join public.explorer_memberships m on m.user_id=b.user_id and m.cohort_id=p_cohort and m.status in ('approved','suspended')
  where b.active and not v.cancelled and (v.cohort_id=p_cohort or v.scope='all')
  union all
  select r.user_id,'visit_report'::text,jsonb_build_object('title',r.title),r.created_at
  from explorer_private.visit_reports r where r.cohort_id=p_cohort
 ) z order by z.created_at desc limit 100;
end $$;
create function public.explorer_admin_visit_activity(p_cohort uuid)
returns table(user_id uuid,kind text,detail jsonb,created_at timestamptz)
language sql stable security invoker set search_path='' as $$ select * from explorer_private.admin_visit_activity(p_cohort); $$;
revoke all on function explorer_private.admin_visit_activity(uuid),public.explorer_admin_visit_activity(uuid) from public,anon,authenticated;
grant execute on function explorer_private.admin_visit_activity(uuid),public.explorer_admin_visit_activity(uuid) to authenticated;
commit;
