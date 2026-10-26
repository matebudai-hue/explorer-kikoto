export function validatePublicConfig(value){
 if(!value?.supabaseUrl||!value?.publishableKey)return null;
 const url=new URL(value.supabaseUrl);
 if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)throw Error('Érvénytelen szolgáltatáscím.');
 const key=value.publishableKey;
 if(key.startsWith('sb_secret_'))throw Error('Titkos kulcs nem kerülhet a portálba.');
 if(key.startsWith('eyJ')){
  try{const encoded=key.split('.')[1].replaceAll('-','+').replaceAll('_','/');const payload=JSON.parse(atob(encoded));if(payload.role!=='anon')throw Error();}
  catch{throw Error('Csak nyilvános alkalmazáskulcs használható.');}
 }else if(!key.startsWith('sb_publishable_'))throw Error('Érvénytelen nyilvános kulcs.');
 return{supabaseUrl:url.origin,publishableKey:key};
}
export async function loadClient(){
 const response=await fetch(new URL('./config.json',import.meta.url),{cache:'no-store'});
 if(!response.ok)throw Error('A portál beállításai nem tölthetők be.');
 const config=validatePublicConfig(await response.json());
 if(!config)return null;
 const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2.118.0');
 return createClient(config.supabaseUrl,config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'explorer-portal-auth'}});
}
