import{loadClient}from'./config.mjs';
let clientPromise;
export const getClient=()=>clientPromise??=(loadClient());
export function checked(result){if(result.error)throw result.error;return result.data;}
export async function access(client){
 const {data,error}=await client.auth.getUser();
 if(error||!data.user)return null;
 const user=data.user;
 const [profile,isAdmin,memberships]=await Promise.all([
  client.from('explorer_profiles').select('*').eq('id',user.id).single(),
  client.rpc('explorer_is_admin'),
  client.from('explorer_memberships').select('*').eq('user_id',user.id)
 ]);
 return{user,profile:checked(profile),isAdmin:checked(isAdmin),memberships:checked(memberships)};
}
