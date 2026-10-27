import{mountAdminInsights,personTestDetails}from'./admin-insights.mjs';
import{mountHospitation}from'./hospitation.mjs';
import{mountContentEditor}from'./content-editor.mjs';
import{getClient,access,checked}from'./access.mjs';
import{validateState}from'../explorer/persistence.mjs';
import{migrateRoom}from'../explorer/room-engine.mjs';
import{roomSVG}from'../explorer/room-art.mjs';
const root=document.querySelector('#portal'),account=document.querySelector('#account');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const time=v=>v?new Intl.DateTimeFormat('hu-HU',{dateStyle:'short',timeStyle:'short',timeZone:'Europe/Budapest'}).format(new Date(v)):'Még nincs aktivitás';
let client,current,cohortId,cohorts=[],mode='login',recovery=false;
const report=e=>{let el=root.querySelector('[role=alert]');if(!el){el=document.createElement('p');el.setAttribute('role','alert');el.className='message';root.append(el);}el.textContent=e?.message||String(e);};
const invite=new URL(location.href).searchParams.get('invite')||'';
if(invite)mode='signup';
async function boot(){
 try{
  client=await getClient();
  if(!client){root.innerHTML='<section class="panel auth"><h1>Explorer Kikötő</h1><p>A saját fiókkal működő portál beállítása folyamatban van.</p><p class="muted">A regisztrációt a közös mentés és a hozzáférések ellenőrzése után nyitjuk meg.</p></section>';return;}
  recovery=location.hash.includes('type=recovery');
  current=await access(client);
  if(!current){auth();return;}
  account.innerHTML=`<span>${esc(current.profile.display_name)}</span> <button id="logout">Kilépés</button>`;
  document.querySelector('#logout').onclick=async()=>{checked(await client.auth.signOut());location.assign('./');};
  if(recovery){passwordForm();return;}
  checked(await client.rpc('explorer_touch'));
  if(current.isAdmin)await admin();else await student();
 }catch(e){root.innerHTML='<h1>A portál nem tölthető be</h1><p>A korábbi munkákat nem módosítottuk.</p><button id="reload">Újrapróbálom</button>';document.querySelector('#reload').onclick=()=>location.reload();report(e);}
}
function auth(){
 root.innerHTML=`<section class="panel auth"><h1>Üdv a Kikötőben!</h1><div class="auth-switch"><button data-mode="login" aria-pressed="${mode==='login'}">Belépés</button><button data-mode="signup" aria-pressed="${mode==='signup'}">Regisztráció</button></div><form id="auth-form">${mode==='signup'?'<label class="field">Neved<input name="name" autocomplete="name" maxlength="100" required></label>':''}<label class="field">E-mail-cím<input name="email" type="email" autocomplete="email" required></label><label class="field">Jelszó<input name="password" type="password" minlength="10" autocomplete="${mode==='signup'?'new-password':'current-password'}" required></label>${mode==='signup'&&!invite?'<label class="field">Évfolyam meghívókódja<input name="invite" required placeholder="A tréneredtől kapott meghívó kódja"></label>':''}<button class="primary" type="submit">${mode==='signup'?'Regisztrálok':'Belépek'}</button></form><p class="small muted">${mode==='signup'?'Regisztráció után Máté vagy Adri hagyja jóvá a belépésedet.':'A képzésen használt saját fiókoddal lépj be.'}</p><button class="link" id="forgot">Elfelejtett jelszó</button><p role="alert" class="message"></p></section>`;
 root.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;auth();});
 root.querySelector('#auth-form').onsubmit=async e=>{
  e.preventDefault();const form=e.target,button=form.querySelector('[type=submit]'),f=new FormData(form);button.disabled=true;
  try{
   if(mode==='signup'){
    const code=invite||String(f.get('invite')).trim();
    const matches=checked(await client.rpc('explorer_invitation',{p_code:code}));
    if(!matches.length)throw Error('A meghívó nem található. Kérj új linket a tréneredtől.');
    const {data,error}=await client.auth.signUp({email:String(f.get('email')),password:String(f.get('password')),options:{emailRedirectTo:new URL('./',location.href).href,data:{display_name:String(f.get('name')).trim(),invite_code:code}}});
    if(error)throw error;
    if(data.session){await boot();return;}
    root.innerHTML='<section class="panel auth"><h1>Ellenőrizd a leveleidet</h1><p>A regisztráció folytatásához nyisd meg az e-mailben kapott megerősítő linket. Ha nem érkezik levél, jelezd a trénerednek.</p><button id="back-login">Vissza a belépéshez</button></section>';root.querySelector('#back-login').onclick=()=>{mode='login';auth();};
   }else{
    checked(await client.auth.signInWithPassword({email:String(f.get('email')),password:String(f.get('password'))}));await boot();
   }
  }catch(error){report(error);}finally{button.disabled=false;}
 };
 root.querySelector('#forgot').onclick=()=>resetRequest();
}
function resetRequest(){
 root.innerHTML='<section class="panel auth"><h1>Új jelszó kérése</h1><form id="reset"><label class="field">E-mail-cím<input name="email" type="email" required autocomplete="email"></label><button type="submit" class="primary">Jelszó-visszaállító levél kérése</button></form><button class="link" id="back">Vissza</button><p role="alert" class="message"></p></section>';
 root.querySelector('#back').onclick=auth;
 root.querySelector('#reset').onsubmit=async e=>{e.preventDefault();try{checked(await client.auth.resetPasswordForEmail(new FormData(e.target).get('email'),{redirectTo:new URL('./',location.href).href}));e.target.innerHTML='<p>Ha a címhez tartozik fiók, elküldtük a visszaállításhoz szükséges levelet.</p>';}catch(error){report(error);}};
}
function passwordForm(){root.innerHTML='<section class="panel auth"><h1>Új jelszó</h1><form id="new-password"><label class="field">Új jelszavad<input name="password" type="password" minlength="10" autocomplete="new-password" required></label><button class="primary">Jelszó mentése</button></form><p role="alert" class="message"></p></section>';root.querySelector('#new-password').onsubmit=async e=>{e.preventDefault();try{checked(await client.auth.updateUser({password:new FormData(e.target).get('password')}));location.replace('./');}catch(error){report(error);}};}
async function student(){
 const approved=current.memberships.filter(m=>m.status==='approved');
 if(!approved.length){root.innerHTML='<section class="panel auth"><h1>A jelentkezésed megérkezett</h1><p>Amint Máté vagy Adri jóváhagyja a belépésedet, itt megnyílik a képzés.</p><button id="refresh-approval">Jóváhagyás ellenőrzése</button></section>';root.querySelector('#refresh-approval').onclick=boot;return;}
 const rows=checked(await client.from('explorer_cohorts').select('id,title').in('id',approved.map(m=>m.cohort_id)));
 root.innerHTML=`<h1>Szia, ${esc(current.profile.display_name)}!</h1>${rows.map(c=>`<section class="panel"><h2>${esc(c.title)}</h2><p>A tesztjeid, pontjaid és a tréningtermed a saját fiókodhoz kapcsolódnak.</p><a class="button primary" href="explorer/?cohort=${encodeURIComponent(c.id)}">Belépek a Kikötőbe</a><div id="student-visits-${esc(c.id)}"></div></section>`).join('')}`;
 for(const c of rows)await mountHospitation(root.querySelector('#student-visits-'+c.id),{client,cohortId:c.id,userId:current.user.id});
}
async function admin(){
 cohorts=checked(await client.rpc('explorer_admin_cohorts'));
 if(!cohorts.some(c=>c.id===cohortId))cohortId=cohorts[0]?.id;
 root.innerHTML=`<div class="row between"><div><h1>Az évfolyam egy helyen</h1><p class="muted">Máté és Adri közös adminfelülete</p></div><button id="new-cohort">Új évfolyam</button></div><label class="field">Évfolyam<select id="cohort">${cohorts.map(c=>`<option value="${esc(c.id)}" ${cohortId===c.id?'selected':''}>${esc(c.title)}</option>`).join('')}</select></label><div id="admin-detail"></div><p role="alert" class="message"></p>`;
 root.querySelector('#cohort').onchange=async e=>{cohortId=e.target.value;await showCohort();};
 root.querySelector('#new-cohort').onclick=cohortForm;
 await showCohort();
}
async function showCohort(){
 const container=root.querySelector('#admin-detail');if(!cohortId){container.innerHTML='<p>Hozd létre az első évfolyamot.</p>';return;}
 const cohort=cohorts.find(c=>c.id===cohortId);
 const [mr,sr,ar]=await Promise.all([client.from('explorer_memberships').select('*,explorer_profiles(display_name,last_seen_at)').eq('cohort_id',cohortId).order('created_at'),client.from('explorer_learning_states').select('*').eq('cohort_id',cohortId),client.from('explorer_activity').select('*').eq('cohort_id',cohortId).in('kind',['learning','room','points_grant']).order('created_at',{ascending:false}).limit(500)]);
 const members=checked(mr),states=checked(sr),pending=members.filter(m=>m.status==='pending'),approved=members.filter(m=>m.status==='approved');
 container.innerHTML=`<div id="admin-insights"></div><details class="ai-management"><summary>Résztvevői próba, meghívás és jóváhagyás${pending.length?` · ${pending.length} jóváhagyásra vár`:``}</summary>${current.memberships.some(m=>m.cohort_id===cohortId&&m.status==='approved')?`<section class="panel"><div class="row between"><div><h2>Kipróbálom résztvevőként</h2><p class="small muted">A saját tesztjeid, válaszaid és tréningtermed a saját fiókodba mentődnek.</p></div><a class="button primary" href="explorer/?cohort=${encodeURIComponent(cohortId)}">Saját résztvevői nézet →</a></div></section>`:''}<section class="panel"><h2>Jelentkezési link</h2><div class="row"><input id="invitation" readonly aria-label="Évfolyam jelentkezési linkje" value="${esc(new URL('?invite='+cohort.invite_code,location.href).href)}"><button id="copy-invite">Másolás</button></div></section>${pending.length?`<section class="panel"><h2>Jóváhagyásra vár · ${pending.length}</h2>${pending.map(m=>`<div class="event row between"><span>${esc(m.explorer_profiles.display_name)}</span><button data-approve="${esc(m.user_id)}" class="primary">Jóváhagyom</button></div>`).join('')}</section>`:''}</details><details class="ai-management"><summary>Résztvevők kezelése</summary><section class="panel"><h2>Hozzáférések</h2><p class="small muted">Felfüggesztéskor a résztvevő munkája megmarad, a hozzáférése ideiglenesen szünetel.</p>${members.filter(m=>m.status==='approved'||m.status==='suspended').map(m=>`<div class="event row between"><span>${esc(m.explorer_profiles.display_name)} · ${m.status==='approved'?'aktív':'felfüggesztve'}</span>${m.user_id===current.user.id?'<span class="small muted">Saját fiókod</span>':`<button data-membership-user="${esc(m.user_id)}" data-membership-status="${m.status==='approved'?'suspended':'approved'}">${m.status==='approved'?'Hozzáférés felfüggesztése':'Hozzáférés visszaállítása'}</button>`}</div>`).join('')||'<p>Még nincs jóváhagyott résztvevő.</p>'}</section></details><details class="ai-management"><summary>Hospitálási naptár kezelése</summary><div id="visit-calendar"></div></details><details class="ai-management"><summary>Képzési napok és tananyagok kezelése</summary><div id="content-editor"></div></details>`;
 mountAdminInsights(container.querySelector('#admin-insights'),{members,states,catalog:cohort.catalog,events:ar.error?[]:ar.data,eventsError:!!ar.error,onPerson:person,onRefresh:showCohort});
 await mountHospitation(container.querySelector('#visit-calendar'),{client,cohortId,isAdmin:true,userId:current.user.id});
 mountContentEditor(container.querySelector('#content-editor'),{client,cohort,userId:current.profile.id,onSaved:async()=>{await admin();}});
 container.querySelector('#copy-invite').onclick=async e=>{try{await navigator.clipboard.writeText(container.querySelector('#invitation').value);e.target.textContent='Másolva';}catch{container.querySelector('#invitation').select();}};
 container.querySelectorAll('[data-membership-user]').forEach(b=>b.onclick=async()=>{const restore=b.dataset.membershipStatus==='approved';if(!confirm(restore?'Visszaállítod a hozzáférést?':'Felfüggeszted a hozzáférést? A mentett munka megmarad.'))return;b.disabled=true;try{checked(await client.rpc('explorer_set_membership_status',{p_user:b.dataset.membershipUser,p_cohort:cohortId,p_status:b.dataset.membershipStatus}));await showCohort();}catch(e){report(e);b.disabled=false;}});
 container.querySelectorAll('[data-approve]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{checked(await client.rpc('explorer_approve',{p_user:b.dataset.approve,p_cohort:cohortId}));await showCohort();}catch(e){report(e);b.disabled=false;}});
 container.querySelectorAll('[data-person]').forEach(b=>b.onclick=()=>person(members.find(m=>m.user_id===b.dataset.person),states.find(s=>s.user_id===b.dataset.person)));
}
function testSummary(s){const tests=Object.values(s.testing?.tests||{});const rounds=tests.reduce((n,t)=>n+(t.attempts?.length||0),0);const draft=tests.find(t=>t.draft)?.draft;return`${rounds} lezárt kitöltés${draft?`<br><span class="small muted">Folyamatban · ${Object.keys(draft.values||{}).length}/${draft.items.length} válasz</span>`:''}`;}
function roomEvent(event){
 const room=event.detail?.room;if(!room||!Array.isArray(room.items))return 'Tréningterem módosítása';
 try{const state=migrateRoom({items:structuredClone(room.items),roomSettings:room.settings||{},roomName:room.name,spent:0});return `<details><summary>Tréningterem módosítása · korábbi állapot</summary><div class="room-preview" inert>${roomSVG(state)}</div></details>`;}catch{return 'Tréningterem módosítása';}
}
async function person(member,saved){
 const container=root.querySelector('#admin-detail');container.innerHTML=`<button id="back-cohort">← Résztvevők</button><section class="panel"><h2>${esc(member.explorer_profiles.display_name)}</h2><div id="person-state"></div></section><section class="panel"><h2>Aktivitás</h2><div id="person-activity">Betöltés…</div></section>`;
 container.querySelector('#back-cohort').onclick=showCohort;
 const detail=container.querySelector('#person-state');
 if(!saved){detail.textContent='Még nincs mentett munka.';}else{
  try{
   const s=validateState(structuredClone(saved.payload));migrateRoom(s);
   detail.innerHTML=`<div class="stats"><div><span>Megszerzett</span><strong>${s.earned}</strong></div><div><span>Elköltött</span><strong>${s.spent}</strong></div><div><span>Elkölthető</span><strong>${s.earned-s.spent}</strong></div></div>${personTestDetails(s,cohorts.find(c=>c.id===cohortId).catalog)}<h3>${esc(s.roomName)}</h3><div class="room-preview" inert>${roomSVG(s)}</div><details><summary>Esetjegyzetek</summary>${Object.entries(s.caseNotes||{}).map(([name,notes])=>`<h3>${esc(cohorts.find(c=>c.id===cohortId)?.catalog.days.flatMap(d=>(d.cases||[]).map(c=>({key:d.id+'/'+c.id,title:c.title}))).find(c=>c.key===name)?.title||name)}</h3>${Object.values(notes).map(n=>`<p style="white-space:pre-wrap">${esc(n)}</p>`).join('')}`).join('')}</details>`;
  }catch{detail.textContent='Ez a mentés részletes megnyitás előtt ellenőrzést igényel. Az adatokat nem módosítottuk.';}
 }
 try{const events=checked(await client.from('explorer_activity').select('*').eq('cohort_id',cohortId).eq('user_id',member.user_id).order('created_at',{ascending:false}).limit(50));container.querySelector('#person-activity').innerHTML=events.map(e=>`<div class="event"><div class="small muted">${time(e.created_at)}</div>${e.kind==='room'?roomEvent(e):e.kind==='points_grant'?'Külön pontjóváírás · +'+(Number(e.detail?.amount)||0)+' pont':'Tanulási feladat mentése'}</div>`).join('')||'<p>Még nincs mentett aktivitás.</p>';}catch(error){report(error);}
}
function cohortForm(){
 const container=root.querySelector('#admin-detail');container.innerHTML=`<section class="panel"><h2>Új évfolyam</h2><form id="create-cohort"><label class="field">Évfolyam neve<input name="title" required maxlength="150" placeholder="Explorer 10."></label><label class="field">Melyik évfolyam anyagait vegyük át?<select name="source"><option value="">Üres évfolyam</option>${cohorts.map((c,i)=>`<option value="${esc(c.id)}" ${i===cohorts.length-1?'selected':''}>${esc(c.title)}</option>`).join('')}</select></label><p class="small muted">A teljes tananyag és kérdésbank másolódik. A résztvevők munkája nem. Az új napok zártan indulnak.</p><div class="row"><button class="primary">Évfolyam létrehozása</button><button type="button" id="cancel-cohort">Mégse</button></div></form></section>`;
 container.querySelector('#cancel-cohort').onclick=showCohort;
 container.querySelector('#create-cohort').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),b=e.target.querySelector('[type=submit]')||e.target.querySelector('button');b.disabled=true;try{cohortId=checked(await client.rpc('explorer_create_cohort',{p_title:String(f.get('title')),p_source:f.get('source')||null}));await admin();}catch(error){report(error);b.disabled=false;}};
}
await boot();
