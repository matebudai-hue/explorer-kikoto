import test from'node:test';import assert from'node:assert/strict';import{readFile}from'node:fs/promises';import{PGlite}from'@electric-sql/pglite';
test('hospitation permissions, per-day capacity and ordered promotion',async t=>{
 const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}');create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid; $$;grant usage on schema public,auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`);
 for(const file of ['schema.sql','access-and-indexes.sql','hospitation.sql'])await db.exec(await readFile(new URL('../supabase/'+file,import.meta.url),'utf8'));
 const cohort=(await db.query('select * from public.explorer_cohorts')).rows[0];
 const admin='00000000-0000-4000-8000-000000000001',anna='00000000-0000-4000-8000-000000000002',bela='00000000-0000-4000-8000-000000000003',pending='00000000-0000-4000-8000-000000000004';
 for(const [id,name]of[[admin,'Admin'],[anna,'Anna'],[bela,'Béla'],[pending,'Pending']])await db.query('insert into auth.users values($1,$2)',[id,{display_name:name,invite_code:cohort.invite_code}]);
 await db.query('insert into explorer_private.admins values($1)',[admin]);
 const as=async(user,sql,args=[],role='authenticated')=>{await db.exec('begin');try{await db.exec('set local role '+role);await db.query("select set_config('request.jwt.claim.sub',$1,true)",[user||'']);const r=await db.query(sql,args);await db.exec('commit');return r.rows;}catch(e){await db.exec('rollback');throw e;}};
 for(const user of [admin,anna,bela])await as(admin,'select public.explorer_approve($1,$2)',[user,cohort.id]);
 const payload={kind:'two',scope:'cohort',program:'Tesztprogram',place:'Helyszín',days:[{day:'2099-06-01',starts:'08:00',ends:'16:00',capacity:1},{day:'2099-06-02',starts:'08:00',ends:'16:00',capacity:1}]};
 const list=async(user=admin,cohortId=cohort.id)=>(await as(user,'select public.explorer_visits($1) as v',[cohortId]))[0].v;
 let visit,ids;
 await t.test('only admin creates events; pending and anonymous cannot list',async()=>{
 await assert.rejects(as(anna,'select public.explorer_save_visit($1,$2)',[cohort.id,payload]));
 await assert.rejects(list(pending));await assert.rejects(as(null,'select public.explorer_visits($1)',[cohort.id],'anon'));
 await as(admin,'select public.explorer_save_visit($1,$2)',[cohort.id,payload]);visit=(await list())[0];ids=visit.days.map(d=>d.id);
 assert.equal(visit.days.length,2);await assert.rejects(as(anna,'select * from explorer_private.visit_bookings'));
 });
 await t.test('two-day booking is idempotent; capacity and queue are separate for each day',async()=>{
 await as(anna,'select public.explorer_book_visit($1,$2)',[visit.id,ids]);await as(anna,'select public.explorer_book_visit($1,$2)',[visit.id,ids]);
 await as(bela,'select public.explorer_book_visit($1,$2)',[visit.id,[ids[0]]]);
 const v=(await list(anna))[0];assert.equal(v.days[0].bookings.length,2);assert.equal(v.days[0].bookings[1].status,'waiting');assert.equal(v.days[0].bookings[1].wait_position,1);assert.equal(v.days[1].bookings.length,1);
 });
 await t.test('cancelling one day promotes the first waiting person and leaves the other day intact',async()=>{
 await as(anna,'select public.explorer_book_visit($1,$2,true)',[visit.id,[ids[0]]]);const v=(await list())[0];assert.equal(v.days[0].bookings[0].user_id,bela);assert.equal(v.days[0].bookings[0].status,'confirmed');assert.equal(v.days[1].bookings[0].user_id,anna);
 await as(anna,'select public.explorer_book_visit($1,$2)',[visit.id,[ids[0]]]);assert.equal((await list())[0].days[0].bookings[1].user_id,anna);
 });
 await t.test('invalid and duplicate day requests are rejected; pending cannot join',async()=>{
 await assert.rejects(as(pending,'select public.explorer_book_visit($1,$2)',[visit.id,ids]));await assert.rejects(as(anna,'select public.explorer_book_visit($1,$2)',[visit.id,[ids[0],ids[0]]]));await assert.rejects(as(anna,'select public.explorer_book_visit($1,$2)',[visit.id,[cohort.id]]));
 });
 await t.test('edits preserve bookings, reject stale edits and date changes, and allow capacity increase',async()=>{
 const changed=structuredClone(payload);changed.days[0].day='2099-06-03';await assert.rejects(as(admin,'select public.explorer_save_visit($1,$2,$3,$4)',[cohort.id,changed,visit.id,visit.revision]));
 changed.days[0].day=payload.days[0].day;changed.days[0].capacity=2;await as(admin,'select public.explorer_save_visit($1,$2,$3,$4)',[cohort.id,changed,visit.id,visit.revision]);assert.equal((await list())[0].days[0].bookings[1].status,'confirmed');await assert.rejects(as(admin,'select public.explorer_save_visit($1,$2,$3,$4)',[cohort.id,changed,visit.id,visit.revision]),e=>e.code==='40001');
 });
 await t.test('all-cohort events share one queue; cohort-only events stay private',async()=>{
 const second=(await as(admin,"select public.explorer_create_cohort('Másik',null) as id"))[0].id;
 // Move Béla's approved membership into the other cohort.
 await db.query('update public.explorer_memberships set cohort_id=$1 where user_id=$2',[second,bela]);
 assert.equal((await list(bela,second)).length,0);
 const all={...payload,scope:'all'};await as(admin,'select public.explorer_save_visit($1,$2)',[cohort.id,all]);const global=(await list(bela,second))[0];await as(bela,'select public.explorer_book_visit($1,$2)',[global.id,[global.days[0].id]]);await as(anna,'select public.explorer_book_visit($1,$2)',[global.id,[global.days[0].id]]);const same=(await list(anna)).find(v=>v.id===global.id);assert.equal(same.days[0].bookings[1].status,'waiting');
 });
 await t.test('cancelled event cannot receive new bookings and is hidden',async()=>{const v=(await list())[0];await as(admin,'select public.explorer_cancel_visit($1,$2)',[v.id,v.revision]);await assert.rejects(as(anna,'select public.explorer_book_visit($1,$2)',[v.id,v.days.map(d=>d.id)]));assert.ok(!(await list()).some(x=>x.id===v.id));});
 }finally{await db.close();}
});
