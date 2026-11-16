import {isDashboardAccessDenied} from './accessErrors';
import {matchesDashboardOwner} from './ownerPolicy';
import {useEffect,useRef,useState} from 'react';
import {initializeApp,getApps} from 'firebase/app';
import {getAuth,onIdTokenChanged,signInWithPopup,GoogleAuthProvider,signInWithEmailAndPassword,setPersistence,browserSessionPersistence,browserLocalPersistence,signOut,type User} from 'firebase/auth';
import {getFirestore,doc,getDocFromServer,onSnapshot,type Firestore} from 'firebase/firestore';
import {getDatabase} from 'firebase/database';
import config from '../../firebase-applet-config.json';
import {auth as primaryAuth,db as primaryDb,rtdb as primaryRtdb} from '../firebase';

const secondaryApp=getApps().find(a=>a.name==='nexus-dashboard')||initializeApp(config,'nexus-dashboard');
const secondaryAuth=getAuth(secondaryApp),secondaryDb=getFirestore(secondaryApp),secondaryRtdb=getDatabase(secondaryApp);

export async function verifyDashboardAccess(user:User,db:Firestore,provider?:'google.com'|'password',refresh=true){
 const token=await user.getIdTokenResult(refresh);
 const method=token.signInProvider;
 if(token.claims.email_verified!==true||!['google.com','password'].includes(method||'')||(provider&&method!==provider))return false;
 try{
  const [owner,role]=await Promise.all([getDocFromServer(doc(db,'dashboardSecurity','owner')),getDocFromServer(doc(db,'dashboardAdmins',user.uid))]);
  return role.data()?.enabled===true&&matchesDashboardOwner(user.uid,token.claims.email,token.claims.email_verified,method,owner.data());
 }catch(error){if(isDashboardAccessDenied(error))return false;throw error;}
}

export async function loginGoogle(){
 await setPersistence(primaryAuth,browserLocalPersistence);
 const provider=new GoogleAuthProvider();
 provider.setCustomParameters({prompt:'select_account'});
 await signInWithPopup(primaryAuth,provider);
}

export async function loginPassword(email:string,password:string){
 await setPersistence(secondaryAuth,browserSessionPersistence);
 let user:User;
 try{
  user=(await signInWithEmailAndPassword(secondaryAuth,email.trim(),password)).user;
 }catch{
  await signOut(secondaryAuth).catch(()=>{});
  throw Error('No se pudo acceder al panel con esas credenciales.');
 }
 let allowed:boolean;
 try{allowed=await verifyDashboardAccess(user,secondaryDb,'password');}
 catch(error){
  if(!isDashboardAccessDenied(error))throw Error('Tu sesión se inició, pero no se pudo comprobar el acceso. Usa «Volver a comprobar acceso» para reintentarlo.');
  allowed=false;
 }
 if(!allowed){await signOut(secondaryAuth).catch(()=>{});throw Error('Esta cuenta no tiene acceso administrativo al dashboard.');}
}

type Candidate={user:User|null;allowed:boolean;checking:boolean;failed:boolean};
const clients=[
 {sessionAuth:primaryAuth,db:primaryDb,rtdb:primaryRtdb},
 {sessionAuth:secondaryAuth,db:secondaryDb,rtdb:secondaryRtdb},
] as const;
const pending:Candidate={user:null,allowed:false,checking:true,failed:false};

export function useDashboardSession(){
 const [candidates,setCandidates]=useState<[Candidate,Candidate]>([pending,pending]);
 const candidatesRef=useRef(candidates);candidatesRef.current=candidates;
 const [attempt,setAttempt]=useState(0);
 const retry=()=>{
  setCandidates(previous=>previous.map(value=>({...value,allowed:false,checking:true,failed:false})) as [Candidate,Candidate]);
  void Promise.allSettled(clients.map(async({sessionAuth})=>{if(!sessionAuth.currentUser)return;let timer:ReturnType<typeof setTimeout>|undefined;try{await Promise.race([sessionAuth.currentUser.getIdToken(true),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('No se pudo renovar la sesión.')),10000);})]);}finally{clearTimeout(timer);}})).then(()=>setAttempt(value=>value+1));
 };
 const allowedRef=useRef(false);
 useEffect(()=>{
  let live=true;
  const revisions=[0,0],retryCounts=[0,0];
  const recoveryTimers:Array<ReturnType<typeof setTimeout>|undefined>=[];
  function recover(index:number,user:User){
   if(retryCounts[index]>=3)return;
   const delay=1000*2**retryCounts[index]++;
   clearTimeout(recoveryTimers[index]);recoveryTimers[index]=setTimeout(()=>{const current=clients[index].sessionAuth.currentUser;if(live&&!allowedRef.current&&current?.uid===user.uid)void check(index,current);},delay);
  }
  const clearRoleListeners=[()=>{},()=>{}];
  async function check(index:number,user:User|null){
   const current=++revisions[index],{db}=clients[index];
   clearRoleListeners[index]();clearTimeout(recoveryTimers[index]);
   const update=(result:Candidate)=>{
    if(!live||revisions[index]!==current)return;
    setCandidates(previous=>index===0?[result,previous[1]]:[previous[0],result]);
   };
   if(!user){update({user:null,allowed:false,checking:false,failed:false});return;}
   const previous=candidatesRef.current[index];
   update({user,allowed:previous.allowed&&previous.user?.uid===user.uid,checking:true,failed:false});
   let timer:ReturnType<typeof setTimeout>|undefined;
   try{
    const {allowed,identity}=await Promise.race([
     (async()=>{const allowed=await verifyDashboardAccess(user,db,index===1?'password':undefined,false);return {allowed,identity:allowed?await user.getIdTokenResult(false):undefined};})(),
     new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('Tiempo de espera agotado')),12000);}),
    ]);
    if(!live||revisions[index]!==current)return;
    retryCounts[index]=0;update({user,allowed,checking:false,failed:false});
    const onWatchError=(error:unknown)=>{if(!live||revisions[index]!==current)return;const denied=isDashboardAccessDenied(error);update({user,allowed:false,checking:false,failed:!denied});if(!denied)recover(index,user);};
    if(allowed){const stops=[onSnapshot(doc(db,'dashboardSecurity','owner'),{includeMetadataChanges:true},snapshot=>{if(!snapshot.metadata.fromCache&&!matchesDashboardOwner(user.uid,identity?.claims.email,identity?.claims.email_verified,identity?.signInProvider,snapshot.data()))update({user,allowed:false,checking:false,failed:false});},onWatchError),onSnapshot(doc(db,'dashboardAdmins',user.uid),{includeMetadataChanges:true},snapshot=>{
     if(!snapshot.metadata.fromCache&&snapshot.data()?.enabled!==true)update({user,allowed:false,checking:false,failed:false});
    },onWatchError)];clearRoleListeners[index]=()=>stops.forEach(stop=>stop());}
   }catch(error){if(!live||revisions[index]!==current)return;const denied=isDashboardAccessDenied(error);update({user,allowed:false,checking:false,failed:!denied});if(!denied)recover(index,user);}
   finally{clearTimeout(timer);}
  }
  const stops=clients.map(({sessionAuth},index)=>onIdTokenChanged(sessionAuth,user=>void check(index,user)));
  const reconnect=()=>{if(!allowedRef.current)clients.forEach(({sessionAuth},index)=>{if(sessionAuth.currentUser)void check(index,sessionAuth.currentUser);});};
  const visible=()=>{if(document.visibilityState==='visible')reconnect();};
  window.addEventListener('online',reconnect);document.addEventListener('visibilitychange',visible);
  return()=>{live=false;stops.forEach(stop=>stop());clearRoleListeners.forEach(stop=>stop());recoveryTimers.forEach(timer=>clearTimeout(timer));window.removeEventListener('online',reconnect);document.removeEventListener('visibilitychange',visible);};
 },[attempt]);

 const selected=candidates.findIndex(value=>value.allowed);
 const allowed=selected!==-1;
 allowedRef.current=allowed;
 const failedIndex=candidates.findIndex(value=>value.user&&value.failed),signedIndex=candidates.findIndex(value=>value.user);
 const visibleIndex=allowed?selected:failedIndex!==-1?failedIndex:signedIndex!==-1?signedIndex:0;
 const user=candidates[visibleIndex].user;
 const checking=!allowed&&candidates.some(value=>value.checking);
 const error=!checking&&!allowed&&user?(candidates[visibleIndex].failed
  ?'No se pudo comprobar tu acceso. Reintentaremos al recuperar la conexión; también puedes volver a comprobarlo.'
  :'La cuenta de esta sesión no tiene acceso administrativo al dashboard.'):undefined;
 return {user,allowed,checking,error,retry,...clients[visibleIndex]};
}

export async function logoutDashboard(selected:typeof primaryAuth){
 await signOut(secondaryAuth);
 if(selected===primaryAuth)await signOut(primaryAuth);
}
