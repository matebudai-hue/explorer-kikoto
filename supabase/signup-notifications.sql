-- New enrolment notices. Sending stays inactive until both Vault secrets exist.
begin;
create extension if not exists pg_net;
create extension if not exists pg_cron;
create table explorer_private.signup_mail_queue (
 id bigint generated always as identity primary key,
 user_id uuid not null, cohort_id uuid not null,
 created_at timestamptz not null default now(),
 request_id bigint, requested_at timestamptz, next_attempt timestamptz not null default now(),
 attempts integer not null default 0, sent_at timestamptz,
 unique(user_id,cohort_id),
 foreign key(user_id,cohort_id) references public.explorer_memberships(user_id,cohort_id) on delete cascade
);
alter table explorer_private.signup_mail_queue enable row level security;
revoke all on explorer_private.signup_mail_queue from public,anon,authenticated;
create table explorer_private.signup_mail_settings (id boolean primary key default true check(id), recipient_user uuid not null references auth.users(id));
alter table explorer_private.signup_mail_settings enable row level security;
revoke all on explorer_private.signup_mail_settings from public,anon,authenticated;
insert into explorer_private.signup_mail_settings(recipient_user)
select a.user_id from explorer_private.admins a join public.explorer_profiles p on p.id=a.user_id where p.display_name='Máté';
do $$ begin if (select count(*) from explorer_private.signup_mail_settings)<>1 then raise exception 'Az értesítést fogadó admin egyértelmű azonosítása nem sikerült.'; end if; end $$;
create function explorer_private.queue_signup_notice() returns trigger language plpgsql security definer set search_path='' as $$
begin if new.status='pending' then insert into explorer_private.signup_mail_queue(user_id,cohort_id) values(new.user_id,new.cohort_id) on conflict do nothing; end if; return new; end $$;
revoke all on function explorer_private.queue_signup_notice() from public,anon,authenticated;
create trigger explorer_signup_notice after insert on public.explorer_memberships for each row execute function explorer_private.queue_signup_notice();
create function explorer_private.process_signup_mail_queue() returns void language plpgsql security definer set search_path='' as $$
declare api_key text; sender_address text; recipient text; rec record; request bigint; msg text;
begin
 if not pg_try_advisory_xact_lock(731904621) then return; end if;
 select decrypted_secret into api_key from vault.decrypted_secrets where name='explorer_brevo_api_key';
 select decrypted_secret into sender_address from vault.decrypted_secrets where name='explorer_brevo_sender';
 if coalesce(api_key,'')='' or coalesce(sender_address,'')='' then return; end if;
 select u.email into recipient from explorer_private.signup_mail_settings s join auth.users u on u.id=s.recipient_user;
 if coalesce(recipient,'')='' then return; end if;
 update explorer_private.signup_mail_queue q set sent_at=now(),request_id=null from net._http_response r where q.request_id=r.id and q.sent_at is null and r.status_code between 200 and 299;
 update explorer_private.signup_mail_queue q set request_id=null,next_attempt=now()+interval '15 minutes' from net._http_response r where q.request_id=r.id and q.sent_at is null and (r.status_code is null or r.status_code<200 or r.status_code>=300);
 update explorer_private.signup_mail_queue set request_id=null,next_attempt=now()+interval '15 minutes' where sent_at is null and request_id is not null and requested_at<now()-interval '10 minutes';
 for rec in select q.id,p.display_name,c.title from explorer_private.signup_mail_queue q join public.explorer_profiles p on p.id=q.user_id join public.explorer_cohorts c on c.id=q.cohort_id where q.sent_at is null and q.request_id is null and q.next_attempt<=now() order by q.created_at limit 10 for update of q skip locked loop
  msg:='Szia Máté!'||E'\n\n'||rec.display_name||' regisztrált a(z) '||rec.title||' évfolyamra.'||E'\n\n'||'A jelentkezést az adminfelületen tudod megnézni és jóváhagyni:'||E'\n'||'https://matebudai-hue.github.io/explorer-kikoto/';
  request:=net.http_post(url:='https://api.brevo.com/v3/smtp/email',headers:=jsonb_build_object('Content-Type','application/json','api-key',api_key),body:=jsonb_build_object('sender',jsonb_build_object('name','Explorer Kikötő','email',sender_address),'to',jsonb_build_array(jsonb_build_object('email',recipient)),'subject','Új jelentkezés az Explorer Kikötőbe','textContent',msg),timeout_milliseconds:=10000);
  update explorer_private.signup_mail_queue set request_id=request,requested_at=now(),attempts=attempts+1 where id=rec.id;
 end loop;
end $$;
revoke all on function explorer_private.process_signup_mail_queue() from public,anon,authenticated;
select cron.schedule('explorer-signup-notices','*/2 * * * *','select explorer_private.process_signup_mail_queue();');
commit;
