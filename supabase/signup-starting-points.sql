begin;
create table explorer_private.starting_point_grants (
 user_id uuid not null, cohort_id uuid not null, points integer not null default 500 check(points=500), granted_at timestamptz not null default now(),
 primary key(user_id,cohort_id), foreign key(user_id,cohort_id) references public.explorer_memberships(user_id,cohort_id) on delete cascade
);
alter table explorer_private.starting_point_grants enable row level security;
revoke all on explorer_private.starting_point_grants from public,anon,authenticated;
create function explorer_private.starting_points_for_new_member() returns trigger language plpgsql security definer set search_path='' as $$
declare v_name text;
begin
 select display_name into strict v_name from public.explorer_profiles where id=new.user_id;
 insert into explorer_private.starting_point_grants(user_id,cohort_id) values(new.user_id,new.cohort_id);
 insert into public.explorer_learning_states(user_id,cohort_id,revision,payload) values(new.user_id,new.cohort_id,1,jsonb_build_object('version',1,'name',v_name,'answers','{}'::jsonb,'earned',500,'spent',0,'items','[]'::jsonb,'roomName','Az én tréningtermem'));
 return new;
end $$;
revoke all on function explorer_private.starting_points_for_new_member() from public,anon,authenticated;
create trigger explorer_starting_points after insert on public.explorer_memberships for each row execute function explorer_private.starting_points_for_new_member();
-- One-time credit for Petra, preserving all existing state and advancing its revision.
do $$
declare v_user uuid; v_cohort uuid; v_inserted integer; v_updated integer;
begin
 select m.user_id,m.cohort_id into strict v_user,v_cohort from auth.users u join public.explorer_memberships m on m.user_id=u.id join public.explorer_cohorts c on c.id=m.cohort_id where lower(u.email)=lower('kepetra90@gmail.com') and c.title='Explorer 9.';
 insert into explorer_private.starting_point_grants(user_id,cohort_id) values(v_user,v_cohort) on conflict do nothing;
 get diagnostics v_inserted = row_count;
 if v_inserted=1 then
  update public.explorer_learning_states set payload=jsonb_set(payload,'{earned}',to_jsonb((payload->>'earned')::integer+500)),revision=revision+1,updated_at=now() where user_id=v_user and cohort_id=v_cohort and jsonb_typeof(payload->'earned')='number';
  get diagnostics v_updated = row_count;
  if v_updated<>1 then raise exception 'A meglévő pontok épsége nem ellenőrizhető'; end if;
  insert into public.explorer_activity(user_id,cohort_id,kind,detail) values(v_user,v_cohort,'points_grant',jsonb_build_object('amount',500,'reason','registration'));
 end if;
end $$;
commit;
