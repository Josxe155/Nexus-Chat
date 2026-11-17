export const GUEST_RETENTION_MS=30*86400000;
export function guestInactive(data:{isGuest?:boolean;lastActiveAt?:number;createdAt?:number},now=Date.now()){
 const activity=Math.max(Number(data.lastActiveAt)||0,Number(data.createdAt)||0);
 return data.isGuest===true&&activity>0&&activity<=now-GUEST_RETENTION_MS;
}
export function expiredMessage(data:{expiresAt?:number;keptBy?:string},now=Date.now()){
 return !data.keptBy&&typeof data.expiresAt==='number'&&data.expiresAt>0&&data.expiresAt<=now;
}
