import type {User} from 'firebase/auth';
export const GUEST_CREDENTIAL_COLLECTION='guestAccountCredentials';
export const GUEST_DOMAIN='guests.nexus-chat.invalid';
type Identity=Pick<User,'uid'|'email'|'emailVerified'|'isAnonymous'|'providerData'>;
export function isManagedGuestEmail(uid:string,email:unknown){
 return /^[A-Za-z0-9]{1,40}$/.test(uid)&&typeof email==='string'&&email.toLowerCase()==='guest.'+uid.toLowerCase()+'@'+GUEST_DOMAIN;
}
export function isManagedGuest(user:Pick<User,'uid'|'email'>|null|undefined){return !!user&&isManagedGuestEmail(user.uid,user.email);}
export function isGuestIdentity(user:Pick<User,'uid'|'email'|'isAnonymous'>|null|undefined){return !!user&&(user.isAnonymous||isManagedGuest(user));}
export function needsEmailVerification(user:Identity|null|undefined){return !!user&&user.providerData.some(provider=>provider.providerId==='password')&&!user.emailVerified&&!isManagedGuest(user);}
export function visibleAccountEmail(user:Pick<User,'uid'|'email'>|null|undefined){return isManagedGuest(user)?null:user?.email||null;}
export function newGuestCredentials(uid:string){
 if(!/^[A-Za-z0-9]{1,40}$/.test(uid))throw Error('No se pudo preparar la cuenta de invitado.');
 const bytes=crypto.getRandomValues(new Uint8Array(32));
 const password='Nc9!'+btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
 return {email:'guest.'+uid.toLowerCase()+'@'+GUEST_DOMAIN,password};
}
