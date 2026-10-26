-- First pilot: identity, approval, independent cohorts and versioned learning state.
-- Apply to a NEW Supabase project. No existing database is modified automatically.
begin;
create schema if not exists explorer_private;
revoke all on schema explorer_private from public, anon, authenticated;

create table public.explorer_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (length(display_name) between 1 and 100),
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);
create table explorer_private.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
create table public.explorer_cohorts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 1 and 150),
  invite_code uuid not null unique default gen_random_uuid(),
  rooms_shared boolean not null default false,
  catalog jsonb not null default '{"days":[],"casePrompts":[]}'::jsonb,
  created_at timestamptz not null default now(),
  check (jsonb_typeof(catalog) = 'object')
);
create table public.explorer_memberships (
  user_id uuid not null references public.explorer_profiles(id) on delete cascade,
  cohort_id uuid not null references public.explorer_cohorts(id),
  status text not null default 'pending' check (status in ('pending','approved','suspended')),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  primary key (user_id,cohort_id)
);
create table public.explorer_learning_states (
  user_id uuid not null references public.explorer_profiles(id) on delete cascade,
  cohort_id uuid not null references public.explorer_cohorts(id),
  revision integer not null default 0 check (revision >= 0),
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id,cohort_id),
  foreign key (user_id,cohort_id) references public.explorer_memberships(user_id,cohort_id) on delete cascade,
  check (jsonb_typeof(payload)='object')
);
create table public.explorer_activity (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.explorer_profiles(id) on delete cascade,
  cohort_id uuid references public.explorer_cohorts(id),
  kind text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index explorer_membership_cohort on public.explorer_memberships(cohort_id,status);
create index explorer_state_cohort on public.explorer_learning_states(cohort_id);
create index explorer_activity_lookup on public.explorer_activity(cohort_id,user_id,created_at desc);

create function explorer_private.explorer_is_admin() returns boolean
language sql stable security definer set search_path=''
as $$ select exists(select 1 from explorer_private.admins where user_id=auth.uid()); $$;
create function explorer_private.explorer_is_member(p_cohort uuid) returns boolean
language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.explorer_memberships where user_id=auth.uid() and cohort_id=p_cohort and status='approved'); $$;

create function public.explorer_is_admin() returns boolean
language sql security invoker set search_path='' as $$ select explorer_private.explorer_is_admin(); $$;
create function public.explorer_is_member(p_cohort uuid) returns boolean
language sql security invoker set search_path='' as $$ select explorer_private.explorer_is_member(p_cohort); $$;

alter table public.explorer_profiles enable row level security;
alter table public.explorer_cohorts enable row level security;
alter table public.explorer_memberships enable row level security;
alter table public.explorer_learning_states enable row level security;
alter table public.explorer_activity enable row level security;
alter table explorer_private.admins enable row level security;
revoke all on public.explorer_profiles,public.explorer_cohorts,public.explorer_memberships,public.explorer_learning_states,public.explorer_activity from anon,authenticated;
grant select on public.explorer_profiles,public.explorer_memberships,public.explorer_learning_states,public.explorer_activity to authenticated;
grant select(id,title,rooms_shared,created_at) on public.explorer_cohorts to authenticated;
create policy profile_read on public.explorer_profiles for select to authenticated using (id=auth.uid() or public.explorer_is_admin());
create policy cohort_read on public.explorer_cohorts for select to authenticated using (public.explorer_is_admin() or public.explorer_is_member(id));
create policy membership_read on public.explorer_memberships for select to authenticated using (user_id=auth.uid() or public.explorer_is_admin());
create policy state_read on public.explorer_learning_states for select to authenticated using (public.explorer_is_admin() or (user_id=auth.uid() and public.explorer_is_member(cohort_id)));
create policy activity_read on public.explorer_activity for select to authenticated using (public.explorer_is_admin() or (user_id=auth.uid() and public.explorer_is_member(cohort_id)));

create function explorer_private.explorer_invitation(p_code uuid) returns table(id uuid,title text)
language sql stable security definer set search_path=''
as $$ select id,title from public.explorer_cohorts where invite_code=p_code; $$;

create function explorer_private.on_signup() returns trigger
language plpgsql security definer set search_path='' as $$
declare v_cohort uuid; v_name text;
begin
  v_name=left(trim(coalesce(new.raw_user_meta_data->>'display_name','')),100);
  if v_name='' then raise exception 'Név szükséges.'; end if;
  select id into v_cohort from public.explorer_cohorts where invite_code::text=new.raw_user_meta_data->>'invite_code';
  if v_cohort is null then raise exception 'Érvényes évfolyam-meghívó szükséges.'; end if;
  insert into public.explorer_profiles(id,display_name) values(new.id,v_name);
  insert into public.explorer_memberships(user_id,cohort_id) values(new.id,v_cohort);
  return new;
end; $$;
create trigger explorer_auth_signup after insert on auth.users for each row execute function explorer_private.on_signup();

create function explorer_private.explorer_approve(p_user uuid,p_cohort uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not public.explorer_is_admin() then raise exception 'Adminisztrátori jogosultság szükséges.' using errcode='42501'; end if;
 update public.explorer_memberships set status='approved',approved_at=now() where user_id=p_user and cohort_id=p_cohort and status='pending';
 if not found then raise exception 'Nincs ilyen függő jelentkezés.'; end if;
end; $$;

create function explorer_private.explorer_touch() returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Belépés szükséges.' using errcode='42501'; end if;
 update public.explorer_profiles set last_seen_at=now() where id=auth.uid() and (last_seen_at is null or last_seen_at<now()-interval '5 minutes');
end; $$;

create function explorer_private.explorer_save_state(p_cohort uuid,p_expected_revision integer,p_payload jsonb) returns integer
language plpgsql security definer set search_path='' as $$
declare v_current public.explorer_learning_states; v_room jsonb; v_previous_room jsonb; v_revision integer;
begin
 if not public.explorer_is_member(p_cohort) then raise exception 'Jóváhagyott tagság szükséges.' using errcode='42501'; end if;
 if p_expected_revision is null or p_expected_revision<0 or jsonb_typeof(p_payload) is distinct from 'object' or octet_length(p_payload::text)>2000000 then raise exception 'Hibás mentés.'; end if;
 if jsonb_typeof(p_payload->'name') is distinct from 'string' or jsonb_typeof(p_payload->'items') is distinct from 'array' or jsonb_typeof(p_payload->'earned') is distinct from 'number' or jsonb_typeof(p_payload->'spent') is distinct from 'number' then raise exception 'Hiányos mentés.'; end if;
 if (p_payload->>'earned')::numeric<0 or (p_payload->>'spent')::numeric<0 or (p_payload->>'spent')::numeric>(p_payload->>'earned')::numeric then raise exception 'Hibás pontegyenleg.'; end if;
 insert into public.explorer_learning_states(user_id,cohort_id) values(auth.uid(),p_cohort) on conflict do nothing;
 select * into v_current from public.explorer_learning_states where user_id=auth.uid() and cohort_id=p_cohort for update;
 if v_current.revision<>p_expected_revision then raise exception 'Másik eszközön újabb mentés van.' using errcode='40001'; end if;
 if v_current.payload=p_payload then return v_current.revision; end if;
 v_revision=v_current.revision+1;
 update public.explorer_learning_states set payload=p_payload,revision=v_revision,updated_at=now() where user_id=auth.uid() and cohort_id=p_cohort;
 if v_current.payload->'testing' is distinct from p_payload->'testing' then
  insert into public.explorer_activity(user_id,cohort_id,kind,detail) values(auth.uid(),p_cohort,'learning',jsonb_build_object('earned',p_payload->'earned','revision',v_revision));
 end if;
 v_room=jsonb_build_object('items',p_payload->'items','settings',p_payload->'roomSettings','name',p_payload->'roomName');
 v_previous_room=jsonb_build_object('items',v_current.payload->'items','settings',v_current.payload->'roomSettings','name',v_current.payload->'roomName');
 if v_room is distinct from v_previous_room then
  insert into public.explorer_activity(user_id,cohort_id,kind,detail) values(auth.uid(),p_cohort,'room',jsonb_build_object('room',v_room,'spent',p_payload->'spent','revision',v_revision));
 end if;
 return v_revision;
end; $$;

create function explorer_private.explorer_create_cohort(p_title text,p_source uuid default null) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_catalog jsonb='{"days":[],"casePrompts":[]}'::jsonb; v_id uuid;
begin
 if not public.explorer_is_admin() then raise exception 'Adminisztrátori jogosultság szükséges.' using errcode='42501'; end if;
 if length(trim(p_title)) not between 1 and 150 then raise exception 'Évfolyamnév szükséges.'; end if;
 if p_source is not null then
  select catalog into v_catalog from public.explorer_cohorts where id=p_source;
  if not found then raise exception 'A másolandó évfolyam nem található.'; end if;
  v_catalog=jsonb_set(v_catalog,'{days}',coalesce((select jsonb_agg(jsonb_set(day,'{open}','false'::jsonb) order by ord) from jsonb_array_elements(v_catalog->'days') with ordinality as x(day,ord)),'[]'::jsonb));
 end if;
 insert into public.explorer_cohorts(title,catalog) values(trim(p_title),v_catalog) returning id into v_id;
 return v_id;
end; $$;

create function public.explorer_invitation(p_code uuid) returns table(id uuid,title text)
language sql security invoker set search_path='' as $$ select * from explorer_private.explorer_invitation(p_code); $$;
create function public.explorer_approve(p_user uuid,p_cohort uuid) returns void
language sql security invoker set search_path='' as $$ select explorer_private.explorer_approve(p_user,p_cohort); $$;
create function public.explorer_touch() returns void
language sql security invoker set search_path='' as $$ select explorer_private.explorer_touch(); $$;
create function public.explorer_save_state(p_cohort uuid,p_expected_revision integer,p_payload jsonb) returns integer
language sql security invoker set search_path='' as $$ select explorer_private.explorer_save_state(p_cohort,p_expected_revision,p_payload); $$;
create function public.explorer_create_cohort(p_title text,p_source uuid default null) returns uuid
language sql security invoker set search_path='' as $$ select explorer_private.explorer_create_cohort(p_title,p_source); $$;

-- No generic update grants: public operations are limited to the RPCs above.
revoke all on function public.explorer_is_admin(),public.explorer_is_member(uuid),public.explorer_invitation(uuid),public.explorer_approve(uuid,uuid),public.explorer_touch(),public.explorer_save_state(uuid,integer,jsonb),public.explorer_create_cohort(text,uuid) from public,anon,authenticated;
grant execute on function public.explorer_invitation(uuid) to anon,authenticated;
grant execute on function public.explorer_is_admin(),public.explorer_is_member(uuid),public.explorer_approve(uuid,uuid),public.explorer_touch(),public.explorer_save_state(uuid,integer,jsonb),public.explorer_create_cohort(text,uuid) to authenticated;
revoke all on all functions in schema explorer_private from public,anon,authenticated;
grant usage on schema explorer_private to anon,authenticated;
grant execute on function explorer_private.explorer_invitation(uuid) to anon,authenticated;
grant execute on function explorer_private.explorer_is_admin(),explorer_private.explorer_is_member(uuid),explorer_private.explorer_approve(uuid,uuid),explorer_private.explorer_touch(),explorer_private.explorer_save_state(uuid,integer,jsonb),explorer_private.explorer_create_cohort(text,uuid) to authenticated;

-- Identity and content APIs below are separate from row ownership.
create function explorer_private.explorer_admin_cohorts() returns setof public.explorer_cohorts
language plpgsql security definer set search_path='' as $$
begin
 if not public.explorer_is_admin() then raise exception 'Adminisztrátori jogosultság szükséges.' using errcode='42501'; end if;
 return query select * from public.explorer_cohorts order by created_at;
end; $$;
create function public.explorer_admin_cohorts() returns setof public.explorer_cohorts
language sql security invoker set search_path='' as $$ select * from explorer_private.explorer_admin_cohorts(); $$;

create function explorer_private.explorer_catalog(p_cohort uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_catalog jsonb;
begin
 if not public.explorer_is_admin() and not public.explorer_is_member(p_cohort) then raise exception 'Nincs hozzáférés.' using errcode='42501'; end if;
 select catalog into v_catalog from public.explorer_cohorts where id=p_cohort;
 if v_catalog is null then raise exception 'Nincs ilyen évfolyam.'; end if;
 if public.explorer_is_admin() then return v_catalog; end if;
 return jsonb_set(v_catalog,'{days}',coalesce((select jsonb_agg(case when day->>'open'='true' then day else jsonb_build_object('id',day->'id','title',day->'title','subtitle',day->'subtitle','open',false,'questions','[]'::jsonb,'materials','[]'::jsonb) end order by ord) from jsonb_array_elements(v_catalog->'days') with ordinality as x(day,ord)),'[]'::jsonb));
end; $$;
create function public.explorer_catalog(p_cohort uuid) returns jsonb
language sql security invoker set search_path='' as $$ select explorer_private.explorer_catalog(p_cohort); $$;

create function explorer_private.explorer_set_catalog(p_cohort uuid,p_catalog jsonb) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not public.explorer_is_admin() then raise exception 'Adminisztrátori jogosultság szükséges.' using errcode='42501'; end if;
 if jsonb_typeof(p_catalog) is distinct from 'object' or jsonb_typeof(p_catalog->'days') is distinct from 'array' or octet_length(p_catalog::text)>10000000 then raise exception 'Érvénytelen tananyag.'; end if;
 if exists(select 1 from jsonb_array_elements(p_catalog->'days') d where jsonb_typeof(d->'id') is distinct from 'string' or jsonb_typeof(d->'questions') is distinct from 'array' or jsonb_typeof(d->'materials') is distinct from 'array') then raise exception 'Érvénytelen nap.'; end if;
 if (select count(*)<>count(distinct d->>'id') from jsonb_array_elements(p_catalog->'days') d) then raise exception 'Ismétlődő napazonosító.'; end if;
 update public.explorer_cohorts set catalog=p_catalog where id=p_cohort;
 if not found then raise exception 'Nincs ilyen évfolyam.'; end if;
end; $$;
create function public.explorer_set_catalog(p_cohort uuid,p_catalog jsonb) returns void
language sql security invoker set search_path='' as $$ select explorer_private.explorer_set_catalog(p_cohort,p_catalog); $$;
revoke all on function public.explorer_admin_cohorts(),public.explorer_catalog(uuid),public.explorer_set_catalog(uuid,jsonb),explorer_private.explorer_admin_cohorts(),explorer_private.explorer_catalog(uuid),explorer_private.explorer_set_catalog(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.explorer_admin_cohorts(),public.explorer_catalog(uuid),public.explorer_set_catalog(uuid,jsonb),explorer_private.explorer_admin_cohorts(),explorer_private.explorer_catalog(uuid),explorer_private.explorer_set_catalog(uuid,jsonb) to authenticated;

insert into public.explorer_cohorts(title) values('Explorer 9.');
commit;
