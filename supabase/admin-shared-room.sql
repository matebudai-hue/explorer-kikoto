create table explorer_private.restore_point_admin_room_20261106 as
select s.*, now() as backed_up_at from public.explorer_learning_states s
join explorer_private.admins a on a.user_id=s.user_id;
alter table explorer_private.restore_point_admin_room_20261106 enable row level security;
revoke all on explorer_private.restore_point_admin_room_20261106 from public, anon, authenticated;

create or replace function explorer_private.admin_room_fields(p jsonb) returns jsonb
language sql immutable set search_path='' as $$
 select coalesce((select jsonb_object_agg(k,v) from jsonb_each(coalesce(p,'{}'::jsonb)) as e(k,v)
 where k=any(array['items','earned','spent','roomName','roomSettings','roomVersion','ledger'])), '{}'::jsonb);
$$;
revoke all on function explorer_private.admin_room_fields(jsonb) from public,anon,authenticated;

with ranked as (
 select s.user_id,s.payload,row_number() over(partition by s.user_id order by
 case when jsonb_typeof(s.payload->'items')='array' then jsonb_array_length(s.payload->'items') else 0 end desc,
 s.updated_at desc,s.cohort_id) as rn
 from public.explorer_learning_states s join explorer_private.admins a on a.user_id=s.user_id
), chosen as (select user_id, explorer_private.admin_room_fields(payload) fields from ranked where rn=1)
update public.explorer_learning_states s set payload=(s.payload - array['items','earned','spent','roomName','roomSettings','roomVersion','ledger']) || c.fields,
revision=s.revision+1, updated_at=now()
from chosen c where s.user_id=c.user_id and explorer_private.admin_room_fields(s.payload) is distinct from c.fields;

create or replace function explorer_private.admin_room_on_insert() returns trigger
language plpgsql security definer set search_path='' as $$
declare v_fields jsonb;
begin
 if exists(select 1 from explorer_private.admins where user_id=new.user_id) then
  select explorer_private.admin_room_fields(s.payload) into v_fields from public.explorer_learning_states s
  where s.user_id=new.user_id order by s.updated_at desc,s.cohort_id limit 1;
  if v_fields is not null then
   new.payload := (new.payload - array['items','earned','spent','roomName','roomSettings','roomVersion','ledger']) || v_fields;
  end if;
 end if;
 return new;
end $$;
revoke all on function explorer_private.admin_room_on_insert() from public,anon,authenticated;
create trigger admin_room_before_insert before insert on public.explorer_learning_states
for each row execute function explorer_private.admin_room_on_insert();

create or replace function explorer_private.admin_room_on_update() returns trigger
language plpgsql security definer set search_path='' as $$
declare v_fields jsonb;
begin
 if pg_trigger_depth()>1 or not exists(select 1 from explorer_private.admins where user_id=new.user_id) then return new; end if;
 v_fields:=explorer_private.admin_room_fields(new.payload);
 if v_fields is not distinct from explorer_private.admin_room_fields(old.payload) then return new; end if;
 update public.explorer_learning_states s set
  payload=(s.payload - array['items','earned','spent','roomName','roomSettings','roomVersion','ledger']) || v_fields,
  revision=s.revision+1,updated_at=now()
 where s.user_id=new.user_id and s.cohort_id<>new.cohort_id
  and explorer_private.admin_room_fields(s.payload) is distinct from v_fields;
 return new;
end $$;
revoke all on function explorer_private.admin_room_on_update() from public,anon,authenticated;
create trigger admin_room_after_update after update of payload on public.explorer_learning_states
for each row execute function explorer_private.admin_room_on_update();
