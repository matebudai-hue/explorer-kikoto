import{downloadMaterial}from'./material-files.mjs';
import{getClient,access,checked}from'./access.mjs';
import{accountStorageKey,createCloudSync}from'./cloud-sync.mjs';

function download(payload,name){const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export async function openLearningContext(){
 const client=await getClient();
 if(!client)throw Error('A fiókhoz kapcsolt mentés beállítása folyamatban van.');
 const userAccess=await access(client);
 if(!userAccess){location.replace('../');throw Error('A folytatáshoz lépj be a portálon.');}
 const cohortId=new URL(location.href).searchParams.get('cohort')||userAccess.memberships.find(m=>m.status==='approved')?.cohort_id;
 if(!userAccess.memberships.some(m=>m.cohort_id===cohortId&&m.status==='approved')){location.replace('../');throw Error('A képzéshez jóváhagyott tagság szükséges.');}
 const [cohortResult,stateResult]=await Promise.all([
  client.from('explorer_cohorts').select('id,title').eq('id',cohortId).single(),
  client.from('explorer_learning_states').select('payload,revision').eq('user_id',userAccess.user.id).eq('cohort_id',cohortId).maybeSingle()
 ]);
 const cohort=checked(cohortResult),remote=checked(stateResult);cohort.catalog=checked(await client.rpc('explorer_catalog',{p_cohort:cohortId}));
 if(!cohort.catalog?.days?.length)throw Error('Az évfolyam tananyagai még nincsenek feltöltve.');
 const key=accountStorageKey(userAccess.user.id,cohortId),draftKey=key+':unsent';
 let restoredDraft=false,initial=remote?.payload||null;
 const rawDraft=localStorage.getItem(draftKey);
 if(rawDraft){
  let draft;try{draft=JSON.parse(rawDraft);}catch{throw Error('A helyi tartalékmentés sérült. Ne töröld a böngésző adatait; kérj segítséget a tréneredtől.');}
  if(JSON.stringify(draft.payload)===JSON.stringify(initial)){localStorage.removeItem(draftKey);}
  else if(draft.baseRevision===(remote?.revision||0)){initial=draft.payload;restoredDraft=true;}
  else{
   await new Promise(resolve=>{
    const box=document.createElement('section');box.className='card';box.innerHTML='<h2>Két eltérő mentésed van</h2><p>Ezen az eszközön maradt el nem küldött munka, közben másik eszközről újabb központi mentés készült. Előbb lementheted az itteni változatot fájlba.</p>';
    const exportButton=document.createElement('button');exportButton.textContent='Az itteni változat letöltése';exportButton.onclick=()=>download({kind:'explorer-result',state:draft.payload},'explorer-helyi-tartalek.json');
    const useServer=document.createElement('button');useServer.textContent='A központi mentéssel folytatom';useServer.onclick=()=>{localStorage.setItem(key+':recovery',rawDraft);localStorage.removeItem(draftKey);box.remove();resolve();};box.append(exportButton,useServer);document.querySelector('main').prepend(box);
   });
  }
 }
 if(initial)localStorage.setItem(key,JSON.stringify(initial));else localStorage.removeItem(key);
 const status=document.createElement('div');status.className='cloud-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const label=document.createElement('span'),retry=document.createElement('button'),exportButton=document.createElement('button');retry.textContent='Mentés újra';exportButton.textContent='Tartalék letöltése';retry.hidden=true;exportButton.hidden=true;status.append(label,retry,exportButton);document.querySelector('header').append(status);
 let lastPayload=initial,timer;
 const sync=createCloudSync({initialRevision:remote?.revision||0,write:async(payload,revision)=>checked(await client.rpc('explorer_save_state',{p_cohort:cohortId,p_expected_revision:revision,p_payload:payload})),onStatus:({status:state,revision})=>{
  label.textContent=({pending:'Mentésre vár…',saving:'Mentés…',saved:'Minden változás elmentve a fiókodba.',error:'A központi mentés nem sikerült. Az itteni tartalék megmaradt.',conflict:'Másik eszközön újabb mentés van. Az itteni változat nem írta felül.'})[state];
  retry.hidden=state!=='error';exportButton.hidden=!['error','conflict'].includes(state);
  if(state==='saved')localStorage.removeItem(draftKey);
  else if(lastPayload)localStorage.setItem(draftKey,JSON.stringify({baseRevision:revision,payload:lastPayload}));
 }});
 const flush=()=>sync.flush().catch(()=>{});
 retry.onclick=flush;
 exportButton.onclick=()=>download({kind:'explorer-result',state:lastPayload},'explorer-fiok-tartalek.json');
 const reload=document.createElement('button');reload.textContent='Központi mentés betöltése';reload.onclick=()=>location.reload();status.append(reload);reload.hidden=true;
 const observer=new MutationObserver(()=>{reload.hidden=!sync.blocked;});observer.observe(label,{childList:true});
 label.textContent=restoredDraft?'Az itteni el nem küldött munkát visszaállítottuk.':'A fiókodhoz kapcsolódó mentés betöltve.';
 function queue(payload){
  lastPayload=JSON.parse(JSON.stringify(payload));
  localStorage.setItem(draftKey,JSON.stringify({baseRevision:sync.revision,payload:lastPayload}));
  if(sync.blocked)return;
  sync.enqueue(lastPayload);clearTimeout(timer);timer=setTimeout(flush,900);
 }
 window.addEventListener('online',flush);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)flush();});
 window.addEventListener('beforeunload',e=>{if(sync.dirty){e.preventDefault();e.returnValue='';}});
 checked(await client.rpc('explorer_touch'));
 const profileLink=document.createElement('a');profileLink.href='../';profileLink.textContent='Vissza a portálra';status.append(profileLink);
 return{downloadMaterial:material=>downloadMaterial(client,material),key,catalog:cohort.catalog,displayName:userAccess.profile.display_name,queue,flush};
}
