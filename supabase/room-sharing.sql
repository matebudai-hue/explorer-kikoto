begin;
create function explorer_private.explorer_set_room_sharing(p_cohort uuid,p_enabled boolean) returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.explorer_is_admin() then raise exception 'Nincs jogosultság.' using errcode='42501'; end if;
 if p_enabled is null then raise exception 'Hiányzó beállítás.'; end if;
 update public.explorer_cohorts set rooms_shared=p_enabled where id=p_cohort;
 if not found then raise exception 'Az évfolyam nem található.'; end if;
end $$;
create function explorer_private.explorer_shared_rooms(p_cohort uuid)
returns table(user_id uuid,display_name text,room jsonb) language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.explorer_is_member(p_cohort) or not exists(select 1 from public.explorer_cohorts c where c.id=p_cohort and c.rooms_shared) then
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
end $$;
create function public.explorer_set_room_sharing(p_cohort uuid,p_enabled boolean) returns void
language sql security invoker set search_path='' as $$ select explorer_private.explorer_set_room_sharing(p_cohort,p_enabled); $$;
create function public.explorer_shared_rooms(p_cohort uuid) returns table(user_id uuid,display_name text,room jsonb)
language sql stable security invoker set search_path='' as $$ select * from explorer_private.explorer_shared_rooms(p_cohort); $$;
revoke all on function explorer_private.explorer_set_room_sharing(uuid,boolean),explorer_private.explorer_shared_rooms(uuid),public.explorer_set_room_sharing(uuid,boolean),public.explorer_shared_rooms(uuid) from public,anon,authenticated;
grant execute on function explorer_private.explorer_set_room_sharing(uuid,boolean),explorer_private.explorer_shared_rooms(uuid),public.explorer_set_room_sharing(uuid,boolean),public.explorer_shared_rooms(uuid) to authenticated;
commit;
