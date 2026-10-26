create or replace function explorer_private.explorer_save_visit(p_cohort uuid,p_payload jsonb,p_id uuid default null,p_revision integer default null) returns uuid
language plpgsql security definer set search_path='' as $$
declare v explorer_private.visits; new_id uuid; d jsonb; n integer; old_days jsonb; new_days jsonb; has_bookings boolean;
begin
 if not public.explorer_is_admin() then raise exception 'Adminisztrátori jogosultság szükséges.' using errcode='42501'; end if;
 if p_payload->>'kind' not in ('full','half','two') or p_payload->>'scope' not in ('cohort','all') or nullif(btrim(p_payload->>'program'),'') is null or nullif(btrim(p_payload->>'place'),'') is null then raise exception 'Add meg a helyszínt és a programot.'; end if;
 if jsonb_typeof(p_payload->'days') is distinct from 'array' or jsonb_array_length(p_payload->'days')<>(case when p_payload->>'kind'='two' then 2 else 1 end) then raise exception 'Érvénytelen napválasztás.'; end if;
 for d in select value from jsonb_array_elements(p_payload->'days') loop
  if (d->>'day')::date < (now() at time zone 'Europe/Budapest')::date or (d->>'ends')::time <= (d->>'starts')::time or (d->>'capacity')::integer not between 1 and 1000 or d->>'day' is null or d->>'starts' is null or d->>'ends' is null or d->>'capacity' is null then raise exception 'Ellenőrizd a dátumot, az időt és a férőhelyet.'; end if;
 end loop;
 if p_payload->>'kind'='two' and (p_payload->'days'->1->>'day')::date <= (p_payload->'days'->0->>'day')::date then raise exception 'A második nap az első után legyen.'; end if;
 if p_id is null then
  insert into explorer_private.visits(cohort_id,scope,program,place,kind) values(p_cohort,p_payload->>'scope',btrim(p_payload->>'program'),btrim(p_payload->>'place'),p_payload->>'kind') returning id into new_id;
 else
  select * into v from explorer_private.visits where id=p_id for update;
  if not found or v.cancelled then raise exception 'Ez az időpont már nem elérhető.'; end if;
  if v.revision is distinct from p_revision then raise exception 'Közben módosult az időpont. Nyisd meg újra.' using errcode='40001'; end if;
  if v.cohort_id<>p_cohort then raise exception 'Az időpontot az eredeti évfolyamnál szerkesztheted.'; end if;
  select exists(select 1 from explorer_private.visit_bookings b join explorer_private.visit_days vd on vd.id=b.day_id where vd.visit_id=p_id and b.active) into has_bookings;
  if has_bookings then
   select jsonb_agg(to_jsonb(vd.day) order by vd.ordinal) into old_days from explorer_private.visit_days vd where vd.visit_id=p_id and (v.kind='two' or vd.ordinal=1);
   select jsonb_agg(to_jsonb((x->>'day')::date) order by ord) into new_days from jsonb_array_elements(p_payload->'days') with ordinality a(x,ord);
   if v.scope<>p_payload->>'scope' or v.kind<>p_payload->>'kind' or old_days<>new_days then raise exception 'Már van jelentkező. A napokat és a meghirdetés körét nem módosíthatod; szükség esetén mondd le az alkalmat.'; end if;
   if exists(select 1 from explorer_private.visit_days vd join jsonb_array_elements(p_payload->'days') with ordinality a(x,ord) on vd.ordinal=ord where vd.visit_id=p_id and (x->>'capacity')::integer<vd.capacity) then raise exception 'Jelentkezők mellett a férőhely csak növelhető.'; end if;
  end if;
  update explorer_private.visits set scope=p_payload->>'scope',program=btrim(p_payload->>'program'),place=btrim(p_payload->>'place'),kind=p_payload->>'kind',revision=revision+1 where id=p_id;
  new_id:=p_id;
 end if;
 n:=0;
 for d in select value from jsonb_array_elements(p_payload->'days') loop
  n:=n+1;
  insert into explorer_private.visit_days(visit_id,ordinal,day,starts,ends,capacity) values(new_id,n,(d->>'day')::date,(d->>'starts')::time,(d->>'ends')::time,(d->>'capacity')::integer)
  on conflict(visit_id,ordinal) do update set day=excluded.day,starts=excluded.starts,ends=excluded.ends,capacity=excluded.capacity;
 end loop;
 -- Preserve unused day rows and their inactive history; the event kind controls visibility.
 return new_id;
end; $$;