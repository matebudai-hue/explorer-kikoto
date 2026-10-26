// Real embedded PostgreSQL with a minimal stand-in for Supabase's auth schema.
// Live Supabase API, JWT, mail and project configuration still require separate checks.
import test from'node:test';
import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';
import{PGlite}from'@electric-sql/pglite';

test('database access, approval, independent copies and conflict protection',async t=>{
 const db=new PGlite();
 try{
  await db.exec(`create role anon;create role authenticated;create schema auth;
   create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}');
   create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid; $$;
   grant usage on schema public,auth to anon,authenticated;
   grant execute on function auth.uid() to anon,authenticated;`);
  await db.exec(await readFile(new URL('../supabase/schema-draft.sql',import.meta.url),'utf8'));
  const cohort=(await db.query('select * from public.explorer_cohorts')).rows[0];
  const admin='00000000-0000-4000-8000-000000000001',anna='00000000-0000-4000-8000-000000000002',gabor='00000000-0000-4000-8000-000000000003';
  for(const [id,name]of[[admin,'Máté'],[anna,'Anna'],[gabor,'Gábor']])await db.query('insert into auth.users(id,raw_user_meta_data) values($1,$2)',[id,{display_name:name,invite_code:cohort.invite_code,role:'admin'}]);
  await db.query('insert into explorer_private.admins values($1)',[admin]);
  const as=async(user,sql,args=[],role='authenticated')=>{
   await db.exec('begin');
   try{await db.exec('set local role '+role);await db.query("select set_config('request.jwt.claim.sub',$1,true)",[user||'']);const r=await db.query(sql,args);await db.exec('commit');return r.rows;}
   catch(e){await db.exec('rollback');throw e;}
  };
  const payload={name:'Anna',items:[],earned:100,spent:20,roomName:'Anna terme',roomSettings:{theme:'sea'},testing:{tests:{}}};
  await t.test('anonymous visitors can resolve an invite but cannot enumerate accounts or read private data',async()=>{
   assert.equal((await as(null,'select * from public.explorer_invitation($1)',[cohort.invite_code],'anon'))[0].title,'Explorer 9.');
   await assert.rejects(as(null,'select * from public.explorer_profiles',[],'anon'));
   await assert.rejects(as(null,'select * from public.explorer_cohorts',[],'anon'));
  });
  await t.test('signup metadata cannot make the applicant an administrator',async()=>{
   assert.equal((await as(anna,'select public.explorer_is_admin() as ok'))[0].ok,false);
   await assert.rejects(as(anna,'select public.explorer_approve($1,$2)',[anna,cohort.id]));
   await assert.rejects(as(anna,'select public.explorer_save_state($1,0,$2)',[cohort.id,payload]));
   await assert.rejects(as(anna,"update public.explorer_memberships set status='approved' where user_id=$1",[anna]));
   await assert.rejects(as(anna,"select public.explorer_create_cohort('Forbidden',null)"));
   await assert.rejects(as(anna,'select public.explorer_admin_cohorts()'));
  });
  await t.test('administrator approval enables only the approved account and cohort',async()=>{
   await as(admin,'select public.explorer_approve($1,$2)',[anna,cohort.id]);
   const rows=await as(anna,'select * from public.explorer_memberships');assert.equal(rows.length,1);assert.equal(rows[0].status,'approved');
   assert.equal((await as(anna,'select public.explorer_save_state($1,0,$2) as revision',[cohort.id,payload]))[0].revision,1);
   await assert.rejects(as(gabor,'select public.explorer_save_state($1,0,$2)',[cohort.id,{...payload,name:'Gábor'}]));
  });
  await t.test('even an approved peer cannot read another participant’s state, profile or history',async()=>{
   await as(admin,'select public.explorer_approve($1,$2)',[gabor,cohort.id]);
   assert.equal((await as(gabor,'select * from public.explorer_learning_states')).length,0);
   assert.equal((await as(gabor,'select * from public.explorer_profiles')).length,1);
   assert.equal((await as(gabor,'select * from public.explorer_activity')).length,0);
   assert.equal((await as(admin,'select * from public.explorer_learning_states')).length,1);
   await assert.rejects(as(anna,'update public.explorer_learning_states set revision=999'));
  });
  await t.test('stale updates fail atomically; unchanged saves add no revision',async()=>{
   await assert.rejects(as(anna,'select public.explorer_save_state($1,0,$2)',[cohort.id,{...payload,earned:200}]),e=>e.code==='40001');
   assert.equal((await as(anna,'select public.explorer_save_state($1,1,$2) as revision',[cohort.id,payload]))[0].revision,1);
   const row=(await as(admin,'select * from public.explorer_learning_states'))[0];assert.equal(row.payload.earned,100);assert.equal(row.revision,1);
  });
  const catalog={casePrompts:['Kérdés'],days:[{id:'day1',title:'Nyitott nap',open:true,questions:[{id:'q1',correct:[0]}],materials:[]},{id:'day2',title:'Zárt nap',open:false,reading:{secret:'future'},questions:[{id:'q2',correct:[1]}],materials:[{url:'https://example.com/future'}],cases:[{text:'future case'}]}]};
  await t.test('unpublished day contents cannot be downloaded through an alternate direct table query',async()=>{
   await as(admin,'select public.explorer_set_catalog($1,$2)',[cohort.id,catalog]);
   await assert.rejects(as(anna,'select catalog from public.explorer_cohorts'));
   const visible=(await as(anna,'select public.explorer_catalog($1) as catalog',[cohort.id]))[0].catalog;
   assert.equal(visible.days[0].questions.length,1);assert.deepEqual(visible.days[1].questions,[]);assert.deepEqual(visible.days[1].materials,[]);assert.equal(visible.days[1].reading,undefined);assert.equal(visible.days[1].cases,undefined);
   await assert.rejects(as(gabor,'select public.explorer_set_catalog($1,$2)',[cohort.id,{days:[]}])) ;
  });
  await t.test('copying a cohort preserves every content field, closes days, and copies no participant work',async()=>{
   const copyId=(await as(admin,"select public.explorer_create_cohort('Explorer 10.',$1) as id",[cohort.id]))[0].id;
   const copy=(await db.query('select * from public.explorer_cohorts where id=$1',[copyId])).rows[0];
   assert.notEqual(copy.invite_code,cohort.invite_code);assert.equal(copy.rooms_shared,false);
   assert.deepEqual(copy.catalog,{...catalog,days:catalog.days.map(d=>({...d,open:false}))});
   assert.equal((await db.query('select * from public.explorer_memberships where cohort_id=$1',[copyId])).rows.length,0);
   assert.equal((await db.query('select * from public.explorer_learning_states where cohort_id=$1',[copyId])).rows.length,0);
   await as(admin,'select public.explorer_set_catalog($1,$2)',[copyId,{days:[],casePrompts:[]}]);
   assert.deepEqual((await db.query('select catalog from public.explorer_cohorts where id=$1',[cohort.id])).rows[0].catalog,catalog);
   await assert.rejects(as(anna,'select public.explorer_catalog($1)',[copyId]));
  });
  await t.test('suspension takes effect on reads and writes without waiting for a token refresh',async()=>{
   await db.query("update public.explorer_memberships set status='suspended' where user_id=$1",[anna]);
   assert.equal((await as(anna,'select * from public.explorer_learning_states')).length,0);
   await assert.rejects(as(anna,'select public.explorer_save_state($1,1,$2)',[cohort.id,payload]));
   await assert.rejects(as(anna,'select public.explorer_catalog($1)',[cohort.id]));
  });
 }finally{await db.close();}
});
