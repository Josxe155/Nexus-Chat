export type OwnerPolicy={uid?:unknown;email?:unknown;enabled?:unknown};
export const normalizeEmail=(value:unknown)=>typeof value==='string'?value.trim().toLowerCase():'';
export function matchesDashboardOwner(uid:string,email:unknown,verified:unknown,provider:unknown,owner:OwnerPolicy|undefined){
 return !!owner&&owner.enabled===true&&owner.uid===uid&&!!normalizeEmail(owner.email)
  &&normalizeEmail(email)===normalizeEmail(owner.email)&&verified===true&&['google.com','password'].includes(String(provider));
}
