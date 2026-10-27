begin;
create function explorer_private.case_own(p_cohort uuid,p_day text,p_case text) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_answers jsonb;
begin
 if auth.uid() is null or not explorer_private.explorer_is_member(p_cohort) then raise exception 'Jóváhagyott tagság szükséges.' using errcode='42501'; end if;
 select answers into v_answers from explorer_private.case_submissions where cohort_id=p_cohort and user_id=auth.uid() and day_id=p_day and case_id=p_case;
 return v_answers;
end; $$;
create function public.explorer_case_own(p_cohort uuid,p_day text,p_case text) returns jsonb language sql stable security invoker set search_path='' as $$ select explorer_private.case_own(p_cohort,p_day,p_case); $$;
revoke all on function explorer_private.case_own(uuid,text,text),public.explorer_case_own(uuid,text,text) from public,anon,authenticated;
grant execute on function explorer_private.case_own(uuid,text,text),public.explorer_case_own(uuid,text,text) to authenticated;
commit;
