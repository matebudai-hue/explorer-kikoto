begin;
create table explorer_private.day_reflections (
 cohort_id uuid not null, day_id text not null, user_id uuid not null, answer text not null check(length(btrim(answer)) between 1 and 10000), updated_at timestamptz not null default now(),
 primary key(cohort_id,day_id,user_id), foreign key(user_id,cohort_id) references public.explorer_memberships(user_id,cohort_id) on delete cascade
);
alter table explorer_private.day_reflections enable row level security;
revoke all on explorer_private.day_reflections from public,anon,authenticated;
create function explorer_private.reflection_day_access(p_cohort uuid,p_day text,p_write boolean default false) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and (case when p_write then public.explorer_is_member(p_cohort) else public.explorer_is_admin() or public.explorer_is_member(p_cohort) end) and exists(select 1 from public.explorer_cohorts c cross join lateral jsonb_array_elements(coalesce(c.catalog->'days','[]'::jsonb)) d where c.id=p_cohort and d->>'id'=p_day and length(btrim(coalesce(d->>'reflectionPrompt','')))>0 and (d->>'open'='true' or (not p_write and public.explorer_is_admin())));
$$;
create function explorer_private.day_reflection_save(p_cohort uuid,p_day text,p_answer text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not explorer_private.reflection_day_access(p_cohort,p_day,true) then raise exception 'A kérdés nem érhető el.' using errcode='42501'; end if;
 if length(btrim(coalesce(p_answer,''))) not between 1 and 10000 then raise exception 'Írj egy választ, legfeljebb 10 000 karakterben.'; end if;
 insert into explorer_private.day_reflections(cohort_id,day_id,user_id,answer) values(p_cohort,p_day,auth.uid(),btrim(p_answer)) on conflict(cohort_id,day_id,user_id) do update set answer=excluded.answer,updated_at=now();
end $$;
create function explorer_private.day_reflection_list(p_cohort uuid,p_day text) returns table(display_name text,answer text,updated_at timestamptz,is_own boolean) language plpgsql stable security definer set search_path='' as $$
begin
 if not explorer_private.reflection_day_access(p_cohort,p_day,false) then raise exception 'A válaszok nem érhetők el.' using errcode='42501'; end if;
 return query select p.display_name,r.answer,r.updated_at,r.user_id=auth.uid() from explorer_private.day_reflections r join public.explorer_profiles p on p.id=r.user_id where r.cohort_id=p_cohort and r.day_id=p_day order by r.updated_at desc;
end $$;
create function public.explorer_reflection_save(p_cohort uuid,p_day text,p_answer text) returns void language sql security invoker set search_path='' as $$ select explorer_private.day_reflection_save(p_cohort,p_day,p_answer); $$;
create function public.explorer_reflection_list(p_cohort uuid,p_day text) returns table(display_name text,answer text,updated_at timestamptz,is_own boolean) language sql stable security invoker set search_path='' as $$ select * from explorer_private.day_reflection_list(p_cohort,p_day); $$;
revoke all on function explorer_private.reflection_day_access(uuid,text,boolean),explorer_private.day_reflection_save(uuid,text,text),explorer_private.day_reflection_list(uuid,text),public.explorer_reflection_save(uuid,text,text),public.explorer_reflection_list(uuid,text) from public,anon,authenticated;
grant execute on function explorer_private.day_reflection_save(uuid,text,text),explorer_private.day_reflection_list(uuid,text),public.explorer_reflection_save(uuid,text,text),public.explorer_reflection_list(uuid,text) to authenticated;
do $$
declare target uuid; v_catalog jsonb; updated_days jsonb; found_count integer;
begin
 select id,catalog into strict target,v_catalog from public.explorer_cohorts where title='Explorer 9.' for update;
 select count(*),jsonb_agg(case when x.day->>'id'='day3' then jsonb_set(jsonb_set(x.day,'{title}',to_jsonb('3. nap · Elméleti anyag átadása'::text),true),'{reflectionPrompt}',to_jsonb('Számodra mi volt a nap legfontosabb tanulsága?'::text),true) else x.day end order by x.ord) into found_count,updated_days from jsonb_array_elements(v_catalog->'days') with ordinality x(day,ord) where true;
 if (select count(*) from jsonb_array_elements(v_catalog->'days') d where d->>'id'='day3')<>1 then raise exception 'A harmadik nap nem egyértelműen azonosítható.'; end if;
 update public.explorer_cohorts set catalog=jsonb_set(v_catalog,'{days}',updated_days) where id=target;
end $$;
commit;
