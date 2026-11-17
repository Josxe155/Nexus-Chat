import {needsEmailVerification} from './guestIdentity';
import {doc,getDoc} from 'firebase/firestore';
import {db} from '../firebase';
import {validCountry} from './countryLocation';
import {browserAccess} from './staticAccess';
import {entryPermissions,countrySource} from './entryPermissions';
import type {User} from 'firebase/auth';import {apiFetch} from './api';
export function suggestedCountry(){const timezone=Intl.DateTimeFormat().resolvedOptions().timeZone;const zones:Record<string,string>={'America/Guayaquil':'EC','Pacific/Galapagos':'EC','America/Bogota':'CO','America/Lima':'PE','America/Caracas':'VE','Europe/Madrid':'ES','America/Mexico_City':'MX','America/Santiago':'CL','America/Argentina/Buenos_Aires':'AR'};try{return zones[timezone]||new Intl.Locale(navigator.language).region||'EC';}catch{return 'EC';}}
const admitted=new Map<string,Promise<any>>();
export async function admitAccount(user:User,registration?:{username:string;phone?:string}){const key=user.uid+':'+user.emailVerified;if(admitted.has(key))return admitted.get(key);const task=(async()=>{if(needsEmailVerification(user))return browserAccess(user,{registration,country:''});if(user.providerData.some(p=>p.providerId==='password')&&user.emailVerified)await user.getIdToken(true);const saved=await getDoc(doc(db,'users',user.uid,'private','region')),region=saved?.data();const country=validCountry(region?.country)?region.country:await entryPermissions(suggestedCountry());return browserAccess(user,{registration,country,countryConfirmed:true,countrySource:region?.source||countrySource()});})();admitted.set(key,task);try{return await task;}catch(error){admitted.delete(key);throw error;}}
