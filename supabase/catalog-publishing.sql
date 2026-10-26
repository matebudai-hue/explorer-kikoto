-- Applied using Supabase's migration API; compare-and-swap prevents lost edits.
begin;
create function explorer_private.explorer_publish_catalog(p_cohort uuid,p_expected jsonb,p_catalog jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare v_current jsonb;
begin
 if not public.explorer_is_admin() then raise exception 'Adminisztrátori jogosultság szükséges.' using errcode='42501'; end if;
 select catalog into v_current from public.explorer_cohorts where id=p_cohort for update;
 if not found then raise exception 'Nincs ilyen évfolyam.'; end if;
 if v_current is distinct from p_expected then raise exception 'Közben módosult az évfolyam. Frissítsd az oldalt.' using errcode='40001'; end if;
 if exists(select 1 from jsonb_array_elements(v_current->'days') old where old->>'open'='true' and not exists(select 1 from jsonb_array_elements(p_catalog->'days') new where new->>'id'=old->>'id' and new->>'open'='true')) then raise exception 'A már megnyitott napoknak elérhetőnek kell maradniuk.'; end if;
 perform explorer_private.explorer_set_catalog(p_cohort,p_catalog);
end; $$;
create function public.explorer_publish_catalog(p_cohort uuid,p_expected jsonb,p_catalog jsonb) returns void
language sql security invoker set search_path='' as $$ select explorer_private.explorer_publish_catalog(p_cohort,p_expected,p_catalog); $$;
revoke all on function public.explorer_publish_catalog(uuid,jsonb,jsonb),explorer_private.explorer_publish_catalog(uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.explorer_publish_catalog(uuid,jsonb,jsonb),explorer_private.explorer_publish_catalog(uuid,jsonb,jsonb) to authenticated;
commit;
