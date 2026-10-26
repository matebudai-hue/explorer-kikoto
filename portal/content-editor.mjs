import{checked}from'./access.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function updateDay(original,values){
 const title=String(values.title||'').trim();if(!title)throw Error('Add meg a nap nevét.');
 const materials=(values.materials||[]).filter(m=>m.title.trim()||m.url.trim()).map(m=>{
  let url;try{url=new URL(m.url.trim());}catch{throw Error('A tananyag linkje teljes webcím legyen, például https://drive.google.com/…');}
  if(!['https:','http:'].includes(url.protocol))throw Error('Csak http vagy https webcímet adhatsz meg.');
  if(!m.title.trim())throw Error('Adj nevet minden tananyaglinknek.');
  return{...m,title:m.title.trim(),url:url.href};
 });
 return{...structuredClone(original),title,subtitle:String(values.subtitle||'').trim(),contentText:String(values.contentText||''),materials};
}
export function mountContentEditor(host,{client,cohort,userId,onSaved}){
 const days=cohort.catalog.days||[];
 const status=(msg,error=false)=>{const el=host.querySelector('[role=status]');if(el){el.textContent=msg;el.classList.toggle('message',error);}};
 const saveCatalog=async next=>{checked(await client.rpc('explorer_publish_catalog',{p_cohort:cohort.id,p_expected:cohort.catalog,p_catalog:next}));await onSaved();};
 function list(){
 host.innerHTML=`<section class="panel"><div class="row between"><div><h2>Képzési napok és tananyagok</h2><p class="small muted">A megnyitott napok később is olvashatók és gyakorolhatók.</p></div><button id="add-day">+ Új képzési nap</button></div>${days.map(d=>`<div class="event row between"><div><strong>${esc(d.title)}</strong><div class="small muted">${d.open?'Megnyitva':'Még nem elérhető'} · ${d.questions?.length||0} tesztkérdés · ${d.materials?.length||0} tananyaglink</div></div><div class="row"><button data-edit="${esc(d.id)}">Szerkesztés</button>${d.open?'':`<button class="primary" data-open="${esc(d.id)}">Megnyitom a résztvevőknek</button>`}</div></div>`).join('')||'<p>Még nincs képzési nap.</p>'}<p role="status" aria-live="polite"></p></section>`;
 host.querySelector('#add-day').onclick=()=>edit({id:'day-'+crypto.randomUUID(),title:'',subtitle:'',open:false,materials:[],questions:[]},true);
 host.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>edit(days.find(d=>d.id===b.dataset.edit)));
 host.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>{
  const day=days.find(d=>d.id===b.dataset.open);
  const row=b.closest('.event');row.innerHTML=`<div><strong>${esc(day.title)}</strong><p>Mostantól az évfolyam minden jóváhagyott résztvevője elérheti ezt a napot és az anyagait.</p><div class="row"><button class="primary" id="confirm-open">Igen, megnyitom</button><button id="cancel-open">Mégse</button></div></div>`;
  row.querySelector('#cancel-open').onclick=list;
  row.querySelector('#confirm-open').onclick=async e=>{e.target.disabled=true;try{const next=structuredClone(cohort.catalog);next.days.find(d=>d.id===day.id).open=true;await saveCatalog(next);}catch(error){status(error.message,true);e.target.disabled=false;}};
 });
 }
 function edit(original,isNew=false){
  const key=`explorer-draft:${userId}:${cohort.id}:${isNew?'new':original.id}`;
  let draft,storage=true,changed=false;
  try{draft=JSON.parse(localStorage.getItem(key)||'null');}catch{storage=false;}
  const conflict=draft&&!isNew&&JSON.stringify(draft.base)!==JSON.stringify(original);
  const values=draft?.values||original;
  host.innerHTML=`<section class="panel"><button id="back-days">← Képzési napok</button><h2>${isNew?'Új képzési nap':esc(original.title)}</h2><p class="notice">${original.open?'Ez a nap már elérhető. A mentett módosításokat a résztvevők is látni fogják.':'A mentés után a nap továbbra is zárva marad. A listában külön tudod megnyitni.'}</p>${conflict?'<p class="message">Ezt a napot azóta más is módosította. A saját piszkozatod lent megmaradt. Másold ki, amit meg szeretnél őrizni, majd a „Friss változat betöltése” gombbal töltsd be a közös változatot.</p><button id="fresh-day">Friss változat betöltése</button>':''}<form id="day-form"><label class="field">A nap neve<input name="title" maxlength="150" required value="${esc(values.title)}" placeholder="5. nap · Eszköz nélküli gyakorlatok"></label><label class="field">Rövid leírás<input name="subtitle" maxlength="500" value="${esc(values.subtitle)}"></label><label class="field">Tananyag, feladat vagy tudnivaló<textarea name="contentText" rows="8" maxlength="100000" placeholder="Ide közvetlenül beírhatod a résztvevőknek szánt szöveget.">${esc(values.contentText)}</textarea></label><h3>Tananyaglinkek</h3><p class="small muted">Drive-linket vagy más webcímet is beilleszthetsz. Drive esetén a fájlhoz a résztvevőknek is legyen megtekintési hozzáférésük.</p><div id="material-links"></div><button type="button" id="add-link">+ Tananyaglink</button><p class="small muted">A meglévő tesztkérdések, esettanulmányok és felkészülési anyagok megmaradnak.</p><div class="row"><button type="submit" class="primary" ${conflict?'disabled':''}>${original.open?'Mentés és közzététel':'Tananyag mentése'}</button><span id="draft-status" class="small muted"></span></div><p role="status" aria-live="polite"></p></form></section>`;
  const form=host.querySelector('#day-form'),links=host.querySelector('#material-links');
  function addLink(m={title:'',url:''}){
   const row=document.createElement('div');row.className='material-row';row.innerHTML=`<label class="field">Anyag neve<input data-title maxlength="200" value="${esc(m.title)}" placeholder="Résztvevői jegyzet"></label><label class="field">Hivatkozás<input data-url type="url" value="${esc(m.url)}" placeholder="https://…"></label><button type="button">Eltávolítás</button>`;
   row.querySelector('button').onclick=()=>{row.remove();persist();};links.append(row);
  }
  (values.materials||[]).forEach(addLink);
  function collect(){return{title:form.elements.title.value,subtitle:form.elements.subtitle.value,contentText:form.elements.contentText.value,materials:[...links.children].map((row,i)=>({...values.materials?.[i],title:row.querySelector('[data-title]').value,url:row.querySelector('[data-url]').value}))};}
  function persist(){changed=true;try{localStorage.setItem(key,JSON.stringify({base:draft?.base||original,values:collect()}));host.querySelector('#draft-status').textContent='Piszkozat elmentve ezen az eszközön';}catch{storage=false;host.querySelector('#draft-status').textContent='A piszkozat nem menthető ezen az eszközön. Ments a kilépés előtt.';}}
  form.oninput=persist;
  host.querySelector('#add-link').onclick=()=>{addLink();persist();links.lastElementChild.querySelector('input').focus();};
  host.querySelector('#back-days').onclick=()=>{if(changed&&!storage&&!confirm('A piszkozat nincs mentve. Visszalépsz?'))return;list();};
  if(conflict)host.querySelector('#fresh-day').onclick=()=>{localStorage.removeItem(key);edit(original,isNew);};
  if(draft)host.querySelector('#draft-status').textContent='Korábbi piszkozat visszaállítva';
  form.onsubmit=async e=>{e.preventDefault();if(conflict)return;const b=form.querySelector('[type=submit]');b.disabled=true;try{
   const updated=updateDay(original,collect()),next=structuredClone(cohort.catalog);
   if(isNew)next.days.push(updated);else next.days[next.days.findIndex(d=>d.id===original.id)]=updated;
   checked(await client.rpc('explorer_publish_catalog',{p_cohort:cohort.id,p_expected:cohort.catalog,p_catalog:next}));
   try{localStorage.removeItem(key);}catch{}changed=false;await onSaved();
  }catch(error){status(error.code==='40001'?'Közben módosult az évfolyam. A piszkozatod megmaradt. Frissítsd az oldalt, majd nyisd meg újra a napot.':error.message,true);b.disabled=false;}};
 }
 list();
}
