begin;
create function explorer_private.add_participant_to_cohort(p_user uuid,p_source uuid,p_target uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.explorer_is_admin() then raise exception 'Adminisztrátori jogosultság szükséges.' using errcode='42501'; end if;
 if p_user is null or p_source is null or p_target is null or p_source=p_target then raise exception 'Válassz másik évfolyamot.'; end if;
 if not exists(select 1 from public.explorer_memberships where user_id=p_user and cohort_id=p_source and status='approved') then raise exception 'Csak aktív résztvevőt adhatsz hozzá.'; end if;
 if not exists(select 1 from public.explorer_cohorts where id=p_target) then raise exception 'A célként választott évfolyam nem található.'; end if;
 if exists(select 1 from public.explorer_memberships where user_id=p_user and cohort_id=p_target) then raise exception 'A résztvevőnek már van jelentkezése vagy hozzáférése ezen az évfolyamon.'; end if;
 insert into public.explorer_memberships(user_id,cohort_id,status,approved_at) values(p_user,p_target,'approved',now());
end $$;
create function public.explorer_add_participant_to_cohort(p_user uuid,p_source uuid,p_target uuid)
returns void language sql security invoker set search_path='' as $$ select explorer_private.add_participant_to_cohort(p_user,p_source,p_target); $$;
revoke all on function explorer_private.add_participant_to_cohort(uuid,uuid,uuid),public.explorer_add_participant_to_cohort(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function explorer_private.add_participant_to_cohort(uuid,uuid,uuid),public.explorer_add_participant_to_cohort(uuid,uuid,uuid) to authenticated;
commit;
