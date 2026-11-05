begin;
create table explorer_private.manual_point_grants (
 request_id uuid primary key, actor_id uuid not null references auth.users(id), user_id uuid not null, cohort_id uuid not null,
 amount bigint not null check(amount>0), reason text not null default '', resulting_balance bigint, created_at timestamptz not null default now(),
 foreign key(user_id,cohort_id) references public.explorer_memberships(user_id,cohort_id)
);
alter table explorer_private.manual_point_grants enable row level security;
revoke all on explorer_private.manual_point_grants from public,anon,authenticated;
create function explorer_private.admin_grant_points(p_user uuid,p_cohort uuid,p_amount bigint,p_request uuid,p_reason text default '') returns bigint language plpgsql security definer set search_path='' as $$
declare s public.explorer_learning_states; record_row explorer_private.manual_point_grants; balance bigint; added integer; v_name text;
begin
 if auth.uid() is null or not public.explorer_is_admin() then raise exception 'Adminisztrátori jogosultság szükséges.' using errcode='42501'; end if;
 if p_user is null or p_cohort is null or p_request is null or p_amount is null or p_amount<1 or p_amount>9007199254740991 or length(coalesce(p_reason,''))>200 then raise exception 'Adj meg érvényes, pozitív egész pontszámot.'; end if;
 select p.display_name into v_name from public.explorer_memberships m join public.explorer_profiles p on p.id=m.user_id where m.user_id=p_user and m.cohort_id=p_cohort and m.status in ('approved','suspended');
 if v_name is null then raise exception 'A résztvevő nem található az évfolyamon.'; end if;
 insert into explorer_private.manual_point_grants(request_id,actor_id,user_id,cohort_id,amount,reason) values(p_request,auth.uid(),p_user,p_cohort,p_amount,btrim(coalesce(p_reason,''))) on conflict do nothing;
 get diagnostics added=row_count;
 if added=0 then
  select * into strict record_row from explorer_private.manual_point_grants where request_id=p_request;
  if record_row.actor_id<>auth.uid() or record_row.user_id<>p_user or record_row.cohort_id<>p_cohort or record_row.amount<>p_amount or record_row.reason<>btrim(coalesce(p_reason,'')) then raise exception 'Ez a műveletazonosító már másik jóváíráshoz tartozik.'; end if;
  return record_row.resulting_balance;
 end if;
 insert into public.explorer_learning_states(user_id,cohort_id,revision,payload) values(p_user,p_cohort,1,jsonb_build_object('version',1,'name',v_name,'answers','{}'::jsonb,'earned',0,'spent',0,'items','[]'::jsonb,'roomName','Az én tréningtermem')) on conflict do nothing;
 select * into strict s from public.explorer_learning_states where user_id=p_user and cohort_id=p_cohort for update;
 if jsonb_typeof(s.payload->'earned') is distinct from 'number' or jsonb_typeof(s.payload->'spent') is distinct from 'number' or (s.payload->>'earned')::numeric+p_amount>9007199254740991 then raise exception 'A pontszámot nem lehet biztonságosan jóváírni.'; end if;
 balance:=(s.payload->>'earned')::bigint+p_amount-(s.payload->>'spent')::bigint;
 update public.explorer_learning_states set payload=jsonb_set(payload,'{earned}',to_jsonb((payload->>'earned')::bigint+p_amount)),revision=revision+1,updated_at=now() where user_id=p_user and cohort_id=p_cohort;
 update explorer_private.manual_point_grants set resulting_balance=balance where request_id=p_request;
 insert into public.explorer_activity(user_id,cohort_id,kind,detail) values(p_user,p_cohort,'points_grant',jsonb_build_object('amount',p_amount,'reason',btrim(coalesce(p_reason,'')),'actor_id',auth.uid(),'request_id',p_request));
 return balance;
end $$;
create function public.explorer_admin_grant_points(p_user uuid,p_cohort uuid,p_amount bigint,p_request uuid,p_reason text default '') returns bigint language sql security invoker set search_path='' as $$ select explorer_private.admin_grant_points(p_user,p_cohort,p_amount,p_request,p_reason); $$;
revoke all on function explorer_private.admin_grant_points(uuid,uuid,bigint,uuid,text),public.explorer_admin_grant_points(uuid,uuid,bigint,uuid,text) from public,anon,authenticated;
grant execute on function explorer_private.admin_grant_points(uuid,uuid,bigint,uuid,text),public.explorer_admin_grant_points(uuid,uuid,bigint,uuid,text) to authenticated;
commit;
