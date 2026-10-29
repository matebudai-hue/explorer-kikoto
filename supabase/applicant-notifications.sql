begin;
alter table explorer_private.signup_mail_queue add column kind text not null default 'admin' check(kind in ('admin','receipt','approval'));
alter table explorer_private.signup_mail_queue drop constraint signup_mail_queue_user_id_cohort_id_key;
alter table explorer_private.signup_mail_queue add constraint signup_mail_queue_user_cohort_kind_key unique(user_id,cohort_id,kind);
alter table explorer_private.signup_mail_queue add column skipped_at timestamptz;
create or replace function explorer_private.queue_signup_notice() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='INSERT' and new.status='pending' then
  insert into explorer_private.signup_mail_queue(user_id,cohort_id,kind) values(new.user_id,new.cohort_id,'admin'),(new.user_id,new.cohort_id,'receipt') on conflict do nothing;
 elsif tg_op='UPDATE' and old.status='pending' and new.status='approved' then
  insert into explorer_private.signup_mail_queue(user_id,cohort_id,kind) values(new.user_id,new.cohort_id,'approval') on conflict do nothing;
 end if;
 return new;
end $$;
create trigger explorer_approval_notice after update of status on public.explorer_memberships for each row execute function explorer_private.queue_signup_notice();
create or replace function explorer_private.process_signup_mail_queue() returns void language plpgsql security definer set search_path='' as $$
declare api_key text; sender_address text; admin_email text; recipient text; rec record; request bigint; msg text; subject_line text;
begin
 if not pg_try_advisory_xact_lock(731904621) then return; end if;
 select decrypted_secret into api_key from vault.decrypted_secrets where name='explorer_brevo_api_key';
 select decrypted_secret into sender_address from vault.decrypted_secrets where name='explorer_brevo_sender';
 if coalesce(api_key,'')='' or coalesce(sender_address,'')='' then return; end if;
 select u.email into admin_email from explorer_private.signup_mail_settings s join auth.users u on u.id=s.recipient_user;
 update explorer_private.signup_mail_queue q set sent_at=now(),request_id=null from net._http_response r where q.request_id=r.id and q.sent_at is null and r.status_code between 200 and 299;
 update explorer_private.signup_mail_queue q set request_id=null,next_attempt=now()+interval '15 minutes' from net._http_response r where q.request_id=r.id and q.sent_at is null and (r.status_code is null or r.status_code<200 or r.status_code>=300);
 update explorer_private.signup_mail_queue set request_id=null,next_attempt=now()+interval '15 minutes' where sent_at is null and skipped_at is null and request_id is not null and requested_at<now()-interval '10 minutes';
 -- Do not send an outdated waiting message once approval has happened.
 update explorer_private.signup_mail_queue q set skipped_at=now() from public.explorer_memberships m where q.kind='receipt' and q.sent_at is null and q.request_id is null and q.skipped_at is null and m.user_id=q.user_id and m.cohort_id=q.cohort_id and m.status<>'pending';
 for rec in select q.id,q.kind,p.display_name,c.title,u.email,u.email_confirmed_at from explorer_private.signup_mail_queue q join public.explorer_profiles p on p.id=q.user_id join public.explorer_cohorts c on c.id=q.cohort_id join auth.users u on u.id=q.user_id where q.sent_at is null and q.skipped_at is null and q.request_id is null and q.next_attempt<=now() and (q.kind='admin' or (u.email_confirmed_at is not null and u.email is not null)) order by q.created_at,q.id limit 10 for update of q skip locked loop
  if rec.kind='admin' then
   recipient:=admin_email; subject_line:='Új jelentkezés az Explorer Kikötőbe';
   msg:='Szia Máté!'||E'\n\n'||rec.display_name||' regisztrált a(z) '||rec.title||' évfolyamra.'||E'\n\n'||'A jelentkezést az adminfelületen tudod megnézni és jóváhagyni:'||E'\n'||'https://matebudai-hue.github.io/explorer-kikoto/';
  elsif rec.kind='receipt' then
   recipient:=rec.email; subject_line:='Megérkezett a jelentkezésed az Explorer Kikötőbe';
   msg:='Szia '||rec.display_name||'!'||E'\n\n'||'Megérkezett a jelentkezésed a(z) '||rec.title||' évfolyamra. Máté vagy Adri hamarosan jóváhagyja a hozzáférésedet, és erről külön e-mailben értesítünk.'||E'\n\n'||'Üdv,'||E'\n'||'Az Explorer csapata';
  else
   recipient:=rec.email; subject_line:='Beléphetsz az Explorer Kikötőbe';
   msg:='Szia '||rec.display_name||'!'||E'\n\n'||'Jóváhagytuk a jelentkezésedet a(z) '||rec.title||' évfolyamra. A regisztrációkor megadott e-mail-címeddel és jelszavaddal már beléphetsz:'||E'\n'||'https://matebudai-hue.github.io/explorer-kikoto/'||E'\n\n'||'Üdv,'||E'\n'||'Az Explorer csapata';
  end if;
  if coalesce(recipient,'')='' then continue; end if;
  request:=net.http_post(url:='https://api.brevo.com/v3/smtp/email',headers:=jsonb_build_object('Content-Type','application/json','api-key',api_key),body:=jsonb_build_object('sender',jsonb_build_object('name','Explorer Kikötő','email',sender_address),'to',jsonb_build_array(jsonb_build_object('email',recipient)),'subject',subject_line,'textContent',msg),timeout_milliseconds:=10000);
  update explorer_private.signup_mail_queue set request_id=request,requested_at=now(),attempts=attempts+1 where id=rec.id;
 end loop;
end $$;
revoke all on function explorer_private.queue_signup_notice(),explorer_private.process_signup_mail_queue() from public,anon,authenticated;
commit;
