alter table public.explorer_cohorts add column if not exists starting_points integer not null default 500 check (starting_points between 0 and 100000000);
do $$ begin
 if (select count(*) from public.explorer_cohorts where title='Alumni') <> 1 then raise exception 'Az Alumni évfolyam nem azonosítható egyértelműen'; end if;
 update public.explorer_cohorts set starting_points=3500 where title='Alumni';
end $$;
create or replace function explorer_private.starting_points_for_new_member()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_name text; v_points integer;
begin
 select display_name into strict v_name from public.explorer_profiles where id=new.user_id;
 select starting_points into strict v_points from public.explorer_cohorts where id=new.cohort_id;
 insert into explorer_private.starting_point_grants(user_id,cohort_id,points) values(new.user_id,new.cohort_id,v_points);
 insert into public.explorer_learning_states(user_id,cohort_id,revision,payload)
 values(new.user_id,new.cohort_id,1,jsonb_build_object('version',1,'name',v_name,'answers','{}'::jsonb,'earned',v_points,'spent',0,'items','[]'::jsonb,'roomName','Az én tréningtermem'));
 return new;
end $$;
alter table explorer_private.starting_point_grants drop constraint starting_point_grants_points_check; alter table explorer_private.starting_point_grants add constraint starting_point_grants_points_check check (points between 0 and 100000000);
