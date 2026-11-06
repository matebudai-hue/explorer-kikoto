begin;
create function explorer_private.admin_members(p_cohort uuid)
returns table(user_id uuid,is_admin boolean) language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.explorer_is_admin() then raise exception 'Adminisztrátori jogosultság szükséges.' using errcode='42501'; end if;
 return query select m.user_id,exists(select 1 from explorer_private.admins a where a.user_id=m.user_id)
 from public.explorer_memberships m where m.cohort_id=p_cohort and m.status in ('approved','suspended');
end $$;
create function explorer_private.promote_admin(p_user uuid,p_cohort uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.explorer_is_admin() then raise exception 'Adminisztrátori jogosultság szükséges.' using errcode='42501'; end if;
 if not exists(select 1 from public.explorer_memberships m where m.user_id=p_user and m.cohort_id=p_cohort and m.status='approved') then raise exception 'Csak aktív résztvevő kaphat adminjogot.'; end if;
 insert into explorer_private.admins(user_id) values(p_user) on conflict(user_id) do nothing;
end $$;
create function public.explorer_admin_members(p_cohort uuid) returns table(user_id uuid,is_admin boolean)
language sql stable security invoker set search_path='' as $$ select * from explorer_private.admin_members(p_cohort); $$;
create function public.explorer_promote_admin(p_user uuid,p_cohort uuid) returns void
language sql security invoker set search_path='' as $$ select explorer_private.promote_admin(p_user,p_cohort); $$;
revoke all on function explorer_private.admin_members(uuid),explorer_private.promote_admin(uuid,uuid),public.explorer_admin_members(uuid),public.explorer_promote_admin(uuid,uuid) from public,anon,authenticated;
grant execute on function explorer_private.admin_members(uuid),explorer_private.promote_admin(uuid,uuid),public.explorer_admin_members(uuid),public.explorer_promote_admin(uuid,uuid) to authenticated;
commit;
