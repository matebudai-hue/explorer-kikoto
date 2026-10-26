// Serialize writes, keep the latest pending snapshot, and stop on stale revisions.
// Storage keys belong to one authenticated user AND one cohort.
export function accountStorageKey(userId,cohortId){
 if(!userId||!cohortId)throw Error('Hiányzó fiók vagy évfolyam.');
 return `explorer-account:${userId}:${cohortId}`;
}
export function createCloudSync({write,initialRevision=0,onStatus=()=>{}}){
 let revision=initialRevision,pending=null,running=null,lastSaved=null,blocked=false;
 const set=(status,error)=>onStatus({status,revision,error});
 function enqueue(payload){
  if(blocked)throw Object.assign(Error('Az újabb központi mentést előbb be kell tölteni.'),{code:'conflict'});
  const json=JSON.stringify(payload);
  if(json===lastSaved&&pending===null)return;
  pending=json;set('pending');
 }
 async function drain(){
  if(running)return running;
  running=(async()=>{
   while(pending!==null&&!blocked){
    const json=pending;pending=null;set('saving');
    try{
     const next=await write(JSON.parse(json),revision);
     if(!Number.isSafeInteger(next)||next<revision)throw Error('Érvénytelen mentési válasz.');
     revision=next;lastSaved=json;
    }catch(error){
     // Preserve edits made during a failed request, otherwise retry the failed snapshot.
     if(pending===null)pending=json;
     blocked=error.code==='40001'||error.code==='conflict';
     set(blocked?'conflict':'error',error);throw error;
    }
   }
   if(pending===null)set('saved');
  })();
  try{return await running;}finally{running=null;}
 }
 return{enqueue,flush:drain,get revision(){return revision;},get dirty(){return pending!==null||running!==null;},get blocked(){return blocked;}};
}
