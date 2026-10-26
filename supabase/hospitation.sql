begin;
create table explorer_private.visits (
 id uuid primary key default gen_random_uuid(), cohort_id uuid not null references public.explorer_cohorts(id),
 scope text not null default 'cohort' check(scope in ('cohort','all')), program text not null check(length(program) between 1 and 500),
 place text not null check(length(place) between 1 and 500), kind text not null check(kind in ('full','half','two')),
 cancelled boolean not null default false, revision integer not null default 1, created_at timestamptz not null default now()
);
create table explorer_private.visit_days (
 id uuid primary key default gen_random_uuid(), visit_id uuid not null references explorer_private.visits(id),
 ordinal integer not null check(ordinal in (1,2)), day date not null, starts time not null, ends time not null check(ends>starts),
 capacity integer not null default 1 check(capacity between 1 and 1000), unique(visit_id,ordinal)
);
create table explorer_private.visit_bookings (
 id bigint generated always as identity primary key, day_id uuid not null references explorer_private.visit_days(id),
 user_id uuid not null references public.explorer_profiles(id), active boolean not null default true, created_at timestamptz not null default now()
);
create unique index visit_one_active_booking on explorer_private.visit_bookings(day_id,user_id) where active;
create index visit_booking_user on explorer_private.visit_bookings(user_id);
create index visit_day_date on explorer_private.visit_days(day);
create index visit_cohort on explorer_private.visits(cohort_id);
alter table explorer_private.visits enable row level security;
alter table explorer_private.visit_days enable row level security;
alter table explorer_private.visit_bookings enable row level security;
revoke all on explorer_private.visits,explorer_private.visit_days,explorer_private.visit_bookings from public,anon,authenticated;

create function explorer_private.visit_eligible(p_cohort uuid,p_scope text,p_user uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select p_user is not null and exists(select 1 from public.explorer_memberships m where m.user_id=p_user and m.status='approved' and (p_scope='all' or m.cohort_id=p_cohort));
$$;
revoke all on function explorer_private.visit_eligible(uuid,text,uuid) from public,anon,authenticated;

create function explorer_private.explorer_visits(p_cohort uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not public.explorer_is_admin() and not public.explorer_is_member(p_cohort) then raise exception 'Jóváhagyott évfolyam-tagság szükséges.' using errcode='42501'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',v.id,'cohort_id',v.cohort_id,'scope',v.scope,'program',v.program,'place',v.place,'kind',v.kind,'revision',v.revision,'days',(
 select jsonb_agg(jsonb_build_object('id',d.id,'day',d.day,'starts',d.starts,'ends',d.ends,'capacity',d.capacity,'ordinal',d.ordinal,'bookings',(
 select coalesce(jsonb_agg(jsonb_build_object('user_id',q.user_id,'name',q.display_name,'position',q.pos,'status',case when q.pos<=d.capacity then 'confirmed' else 'waiting' end,'wait_position',greatest(q.pos-d.capacity,0)) order by q.pos),'[]'::jsonb)
 from (select b.user_id,p.display_name,row_number() over(order by b.id) pos from explorer_private.visit_bookings b join public.explorer_profiles p on p.id=b.user_id where b.day_id=d.id and b.active and explorer_private.visit_eligible(v.cohort_id,v.scope,b.user_id)) q
 )) order by d.ordinal) from explorer_private.visit_days d where d.visit_id=v.id and (v.kind='two' or d.ordinal=1)
 )) order by v.created_at),'[]'::jsonb) into result from explorer_private.visits v where not v.cancelled and (v.cohort_id=p_cohort or v.scope='all');
 return result;
end; $$;

create function explorer_private.explorer_save_visit(p_cohort uuid,p_payload jsonb,p_id uuid default null,p_revision integer default null) returns uuid
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

create function explorer_private.explorer_book_visit(p_visit uuid,p_days uuid[],p_cancel boolean default false) returns void
language plpgsql security definer set search_path='' as $$
declare v explorer_private.visits; d explorer_private.visit_days; selected integer; who uuid:=auth.uid();
begin
 select * into v from explorer_private.visits where id=p_visit for update;
 if not found or v.cancelled then raise exception 'Ez az alkalom már nem elérhető.'; end if;
 if not explorer_private.visit_eligible(v.cohort_id,v.scope,who) then raise exception 'Ehhez az alkalomhoz nincs jóváhagyott hozzáférésed.' using errcode='42501'; end if;
 select count(*) into selected from explorer_private.visit_days where visit_id=p_visit and id=any(p_days) and (v.kind='two' or ordinal=1);
 if selected=0 or selected<>cardinality(p_days) then raise exception 'Válaszd ki, melyik napra jelentkezel.'; end if;
 for d in select * from explorer_private.visit_days where visit_id=p_visit and id=any(p_days) order by ordinal loop
  if d.day < (now() at time zone 'Europe/Budapest')::date then raise exception 'Elmúlt napra nem módosítható a jelentkezés.'; end if;
  if p_cancel then update explorer_private.visit_bookings set active=false where day_id=d.id and user_id=who and active;
  else insert into explorer_private.visit_bookings(day_id,user_id) values(d.id,who) on conflict(day_id,user_id) where active do nothing;
  end if;
 end loop;
end; $$;

create function explorer_private.explorer_cancel_visit(p_visit uuid,p_revision integer) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not public.explorer_is_admin() then raise exception 'Adminisztrátori jogosultság szükséges.' using errcode='42501'; end if;
 update explorer_private.visits set cancelled=true,revision=revision+1 where id=p_visit and revision=p_revision and not cancelled;
 if not found then raise exception 'Közben megváltozott az alkalom. Frissítsd a naptárt.' using errcode='40001'; end if;
end; $$;

create function public.explorer_visits(p_cohort uuid) returns jsonb language sql security invoker set search_path='' as $$ select explorer_private.explorer_visits(p_cohort); $$;
create function public.explorer_save_visit(p_cohort uuid,p_payload jsonb,p_id uuid default null,p_revision integer default null) returns uuid language sql security invoker set search_path='' as $$ select explorer_private.explorer_save_visit(p_cohort,p_payload,p_id,p_revision); $$;
create function public.explorer_book_visit(p_visit uuid,p_days uuid[],p_cancel boolean default false) returns void language sql security invoker set search_path='' as $$ select explorer_private.explorer_book_visit(p_visit,p_days,p_cancel); $$;
create function public.explorer_cancel_visit(p_visit uuid,p_revision integer) returns void language sql security invoker set search_path='' as $$ select explorer_private.explorer_cancel_visit(p_visit,p_revision); $$;
revoke all on function public.explorer_visits(uuid),public.explorer_save_visit(uuid,jsonb,uuid,integer),public.explorer_book_visit(uuid,uuid[],boolean),public.explorer_cancel_visit(uuid,integer),explorer_private.explorer_visits(uuid),explorer_private.explorer_save_visit(uuid,jsonb,uuid,integer),explorer_private.explorer_book_visit(uuid,uuid[],boolean),explorer_private.explorer_cancel_visit(uuid,integer) from public,anon,authenticated;
grant execute on function public.explorer_visits(uuid),public.explorer_save_visit(uuid,jsonb,uuid,integer),public.explorer_book_visit(uuid,uuid[],boolean),public.explorer_cancel_visit(uuid,integer),explorer_private.explorer_visits(uuid),explorer_private.explorer_save_visit(uuid,jsonb,uuid,integer),explorer_private.explorer_book_visit(uuid,uuid[],boolean),explorer_private.explorer_cancel_visit(uuid,integer) to authenticated;
commit;
