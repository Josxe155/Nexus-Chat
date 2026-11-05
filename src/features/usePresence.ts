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
  // Do not disarm a live session while network writes are still in flight.
  if(!alive||revision!==generation)return;
  await set(ref(rtdb,`presencePrivacy/${uid}`),policy);
  if(!alive||revision!==generation)return;
  window.dispatchEvent(new Event('nexus:presence-policy'));
  await remove(ref(rtdb,`presence/${uid}`));
  if(!alive||revision!==generation)return;
  if(policy.hideOnline)await remove(ref(rtdb,`presenceSessions/${uid}`));
  if(policy.hideLastSeen)await set(seen,0);
  if(document.visibilityState!=='visible'){await remove(session);if(!policy.hideLastSeen)await set(seen,serverTimestamp());return;}
  await onDisconnect(session).remove();if(!alive||revision!==generation)return;if(!policy.hideLastSeen)await onDisconnect(seen).set(serverTimestamp());
  if(!alive||revision!==generation){await remove(session);return;}
  if(!policy.hideLastSeen)await set(seen,serverTimestamp());
  if(!alive||revision!==generation)return;
  if(!policy.hideOnline){await set(session,true);if(!alive||revision!==generation)await remove(session);}
 }).catch(error=>{if(alive&&revision===generation)console.warn('No se pudo sincronizar la presencia.',error);});};
 const stop=onValue(ref(rtdb,'.info/connected'),snapshot=>{connected=snapshot.val()===true;if(connected)sync();});
 document.addEventListener('visibilitychange',sync);
 const pagehide=()=>{generation++;remove(session).catch(()=>{});if(!policy.hideLastSeen)set(seen,serverTimestamp()).catch(()=>{});};window.addEventListener('pagehide',pagehide);window.addEventListener('pageshow',sync);
 return()=>{alive=false;generation++;stop();document.removeEventListener('visibilitychange',sync);window.removeEventListener('pagehide',pagehide);window.removeEventListener('pageshow',sync);void (async()=>{try{await remove(session);if(!policy.hideLastSeen)await set(seen,serverTimestamp());await onDisconnect(session).cancel();}catch{/* Keep the server disconnect fallback if cleanup could not be confirmed. */}})();};
},[user?.uid,JSON.stringify(user?.privacy)]);}
