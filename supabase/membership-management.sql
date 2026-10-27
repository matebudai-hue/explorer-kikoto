begin;
create function explorer_private.set_membership_status(p_user uuid,p_cohort uuid,p_status text) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not explorer_private.explorer_is_admin() then raise exception 'Adminisztrátori jogosultság szükséges.' using errcode='42501'; end if;
 if p_status not in ('approved','suspended') then raise exception 'Érvénytelen állapot.'; end if;
 if p_user=auth.uid() then raise exception 'A saját hozzáférésedet itt nem módosíthatod.'; end if;
 update public.explorer_memberships set status=p_status,approved_at=case when p_status='approved' then coalesce(approved_at,now()) else approved_at end where user_id=p_user and cohort_id=p_cohort and status in ('approved','suspended');
 if not found then raise exception 'Nem található jóváhagyott vagy felfüggesztett résztvevő.'; end if;
end; $$;
create function public.explorer_set_membership_status(p_user uuid,p_cohort uuid,p_status text) returns void language sql security invoker set search_path='' as $$ select explorer_private.set_membership_status(p_user,p_cohort,p_status); $$;
revoke all on function explorer_private.set_membership_status(uuid,uuid,text),public.explorer_set_membership_status(uuid,uuid,text) from public,anon,authenticated;
grant execute on function explorer_private.set_membership_status(uuid,uuid,text),public.explorer_set_membership_status(uuid,uuid,text) to authenticated;
commit;
