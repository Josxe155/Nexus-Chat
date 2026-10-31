import {presencePolicy} from './privacy';
import {uuid} from './uuid';
import {useEffect} from 'react';
import {onValue,ref,set,remove,onDisconnect,serverTimestamp} from 'firebase/database';
import {rtdb} from '../firebase';
import {UserProfile} from '../types';
export default function usePresence(user:UserProfile|null){useEffect(()=>{
 if(!user)return;
 let policy=presencePolicy(user.privacy);const uid=user.uid,session=ref(rtdb,`presenceSessions/${uid}/${uuid()}`),seen=ref(rtdb,`presenceLastSeen/${uid}`);
 let alive=true,connected=false,generation=0,queue=Promise.resolve();
 const sync=()=>{const revision=++generation;queue=queue.catch(()=>{}).then(async()=>{
  if(!alive||!connected||revision!==generation)return;
  await onDisconnect(session).cancel();await onDisconnect(seen).cancel();
  if(!alive||revision!==generation)return;
  try{await set(ref(rtdb,`presencePrivacy/${uid}`),policy);}catch(error:any){if(!/permission[-_]denied/i.test(error.code||''))throw error;const blocked=!!user.privacy?.blockedIds?.length;policy={...policy,hideOnline:policy.onlineAudience!=='everyone'||blocked,hideLastSeen:policy.lastSeenAudience!=='everyone'||blocked};await set(ref(rtdb,`presencePrivacy/${uid}`),{hideOnline:policy.hideOnline,hideLastSeen:policy.hideLastSeen});}window.dispatchEvent(new Event('nexus:presence-policy'));
  await remove(ref(rtdb,`presence/${uid}`));
  if(policy.hideOnline)await remove(ref(rtdb,`presenceSessions/${uid}`));
  if(policy.hideLastSeen)await set(seen,0);
  if(document.visibilityState!=='visible'){await remove(session);if(!policy.hideLastSeen)await set(seen,serverTimestamp());return;}
  await onDisconnect(session).remove();if(!policy.hideLastSeen)await onDisconnect(seen).set(serverTimestamp());
  if(!alive||revision!==generation){await remove(session);return;}
  if(!policy.hideOnline)await set(session,true);
 }).catch(error=>console.warn('No se pudo sincronizar la presencia.',error));};
 const stop=onValue(ref(rtdb,'.info/connected'),snapshot=>{connected=snapshot.val()===true;if(connected)sync();});
 document.addEventListener('visibilitychange',sync);
 const pagehide=()=>{remove(session).catch(()=>{});if(!policy.hideLastSeen)set(seen,serverTimestamp()).catch(()=>{});};window.addEventListener('pagehide',pagehide);
 return()=>{alive=false;generation++;stop();document.removeEventListener('visibilitychange',sync);window.removeEventListener('pagehide',pagehide);remove(session).catch(()=>{});if(!policy.hideLastSeen)set(seen,serverTimestamp()).catch(()=>{});onDisconnect(session).cancel().catch(()=>{});onDisconnect(seen).cancel().catch(()=>{});};
},[user?.uid,JSON.stringify(user?.privacy)]);}
