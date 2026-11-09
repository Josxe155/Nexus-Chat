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
 const [owner,role]=await Promise.all([getDocFromServer(doc(db,'dashboardSecurity','owner')),getDocFromServer(doc(db,'dashboardAdmins',user.uid))]);
 return role.data()?.enabled===true&&matchesDashboardOwner(user.uid,token.claims.email,token.claims.email_verified,method,owner.data());
}

export async function loginGoogle(){
 await setPersistence(primaryAuth,browserLocalPersistence);
 const provider=new GoogleAuthProvider();
 provider.setCustomParameters({prompt:'select_account'});
 await signInWithPopup(primaryAuth,provider);
}

export async function loginPassword(email:string,password:string){
 await setPersistence(secondaryAuth,browserSessionPersistence);
 try{
  const {user}=await signInWithEmailAndPassword(secondaryAuth,email.trim(),password);
  if(!await verifyDashboardAccess(user,secondaryDb,'password'))throw Error('Acceso denegado');
 }catch{
  await signOut(secondaryAuth).catch(()=>{});
  throw Error('No se pudo acceder al panel con esas credenciales.');
 }
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
 const retry=()=>setAttempt(value=>value+1);
 const allowedRef=useRef(false);
 useEffect(()=>{
  let live=true;
  const revisions=[0,0];
  const clearRoleListeners=[()=>{},()=>{}];
  async function check(index:number,user:User|null){
   const current=++revisions[index],{db}=clients[index];
   clearRoleListeners[index]();
   const update=(result:Candidate)=>{
    if(!live||revisions[index]!==current)return;
    setCandidates(previous=>index===0?[result,previous[1]]:[previous[0],result]);
   };
   if(!user){update({user:null,allowed:false,checking:false,failed:false});return;}
   const previous=candidatesRef.current[index];
   update({user,allowed:previous.allowed&&previous.user?.uid===user.uid,checking:true,failed:false});
   let timer:ReturnType<typeof setTimeout>|undefined;
   try{
    const allowed=await Promise.race([
     verifyDashboardAccess(user,db,index===1?'password':undefined,false),
     new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('Tiempo de espera agotado')),12000);}),
    ]);
    if(!live||revisions[index]!==current)return;
    update({user,allowed,checking:false,failed:false});
    if(allowed){const stops=[onSnapshot(doc(db,'dashboardSecurity','owner'),{includeMetadataChanges:true},snapshot=>{if(!snapshot.metadata.fromCache&&!matchesDashboardOwner(user.uid,user.email,user.emailVerified,index===1?'password':user.providerData.find(item=>['google.com','password'].includes(item.providerId))?.providerId,snapshot.data()))update({user,allowed:false,checking:false,failed:false});},()=>update({user,allowed:false,checking:false,failed:true})),onSnapshot(doc(db,'dashboardAdmins',user.uid),{includeMetadataChanges:true},snapshot=>{
     if(!snapshot.metadata.fromCache&&snapshot.data()?.enabled!==true)update({user,allowed:false,checking:false,failed:false});
    },()=>update({user,allowed:false,checking:false,failed:true}))];clearRoleListeners[index]=()=>stops.forEach(stop=>stop());}
   }catch{update({user,allowed:false,checking:false,failed:true});}
   finally{clearTimeout(timer);}
  }
  const stops=clients.map(({sessionAuth},index)=>onIdTokenChanged(sessionAuth,user=>void check(index,user)));
  const reconnect=()=>{if(!allowedRef.current)clients.forEach(({sessionAuth},index)=>{if(sessionAuth.currentUser)void check(index,sessionAuth.currentUser);});};
  window.addEventListener('online',reconnect);
  return()=>{live=false;stops.forEach(stop=>stop());clearRoleListeners.forEach(stop=>stop());window.removeEventListener('online',reconnect);};
 },[attempt]);

 const selected=candidates.findIndex(value=>value.allowed);
 const allowed=selected!==-1;
 allowedRef.current=allowed;
 const user=allowed?candidates[selected].user:candidates[0].user||candidates[1].user;
 const checking=!allowed&&(candidates.every(value=>value.checking)||candidates.some(value=>value.checking&&value.user));
 const error=!checking&&!allowed&&user?(candidates.some(value=>value.failed)
  ?'No se pudo verificar tu permiso con Firebase. Vuelve a comprobar el acceso.'
  :'La cuenta de esta sesión no tiene acceso administrativo al dashboard.'):undefined;
 return {user,allowed,checking,error,retry,...clients[allowed?selected:0]};
}

export async function logoutDashboard(selected:typeof primaryAuth){
 await signOut(secondaryAuth);
 if(selected===primaryAuth)await signOut(primaryAuth);
}
