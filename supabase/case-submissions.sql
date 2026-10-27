begin;
create table explorer_private.case_submissions (
 cohort_id uuid not null,
 user_id uuid not null,
 day_id text not null,
 case_id text not null,
 answers jsonb not null,
 submitted_at timestamptz not null default now(),
 primary key (cohort_id,user_id,day_id,case_id),
 foreign key (user_id,cohort_id) references public.explorer_memberships(user_id,cohort_id) on delete cascade,
 check (jsonb_typeof(answers)='object')
);
alter table explorer_private.case_submissions enable row level security;
revoke all on explorer_private.case_submissions from public,anon,authenticated;
create function explorer_private.case_submit(p_cohort uuid,p_day text,p_case text,p_answers jsonb) returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not explorer_private.explorer_is_member(p_cohort) then raise exception 'Jóváhagyott tagság szükséges.' using errcode='42501'; end if;
 if not exists(select 1 from public.explorer_cohorts c cross join lateral jsonb_array_elements(c.catalog->'days') d cross join lateral jsonb_array_elements(coalesce(d->'cases','[]'::jsonb)) x where c.id=p_cohort and d->>'id'=p_day and d->>'open'='true' and x->>'id'=p_case) then raise exception 'A feladat nem érhető el.' using errcode='42501'; end if;
 if jsonb_typeof(p_answers)<>'object' or pg_column_size(p_answers)>100000 or not exists(select 1 from jsonb_each_text(p_answers) e where length(trim(e.value))>0) then raise exception 'Adj meg legalább egy választ.'; end if;
 insert into explorer_private.case_submissions(cohort_id,user_id,day_id,case_id,answers) values(p_cohort,auth.uid(),p_day,p_case,p_answers) on conflict(cohort_id,user_id,day_id,case_id) do nothing;
end; $$;
create function explorer_private.case_peers(p_cohort uuid,p_day text,p_case text) returns table(display_name text,answers jsonb,submitted_at timestamptz)
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not explorer_private.explorer_is_member(p_cohort) or not exists(select 1 from explorer_private.case_submissions s where s.cohort_id=p_cohort and s.user_id=auth.uid() and s.day_id=p_day and s.case_id=p_case) then raise exception 'Előbb add be a saját válaszodat.' using errcode='42501'; end if;
 return query select p.display_name,s.answers,s.submitted_at from explorer_private.case_submissions s join public.explorer_profiles p on p.id=s.user_id join public.explorer_memberships m on m.user_id=s.user_id and m.cohort_id=s.cohort_id and m.status='approved' where s.cohort_id=p_cohort and s.day_id=p_day and s.case_id=p_case and s.user_id<>auth.uid() order by s.submitted_at;
end; $$;
create function public.explorer_case_submit(p_cohort uuid,p_day text,p_case text,p_answers jsonb) returns void language sql security invoker set search_path='' as $$ select explorer_private.case_submit(p_cohort,p_day,p_case,p_answers); $$;
create function public.explorer_case_peers(p_cohort uuid,p_day text,p_case text) returns table(display_name text,answers jsonb,submitted_at timestamptz) language sql stable security invoker set search_path='' as $$ select * from explorer_private.case_peers(p_cohort,p_day,p_case); $$;
revoke all on function explorer_private.case_submit(uuid,text,text,jsonb),explorer_private.case_peers(uuid,text,text),public.explorer_case_submit(uuid,text,text,jsonb),public.explorer_case_peers(uuid,text,text) from public,anon,authenticated;
grant execute on function explorer_private.case_submit(uuid,text,text,jsonb),explorer_private.case_peers(uuid,text,text),public.explorer_case_submit(uuid,text,text,jsonb),public.explorer_case_peers(uuid,text,text) to authenticated;
commit;
