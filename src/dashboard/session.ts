import {useEffect,useState} from 'react';
import {initializeApp,getApps} from 'firebase/app';
import {getAuth,onAuthStateChanged,signInWithPopup,GoogleAuthProvider,signInWithEmailAndPassword,setPersistence,browserSessionPersistence,browserLocalPersistence,signOut,type User} from 'firebase/auth';
import {getFirestore,doc,getDocFromServer,onSnapshot,type Firestore} from 'firebase/firestore';
import {getDatabase} from 'firebase/database';
import config from '../../firebase-applet-config.json';
import {auth as primaryAuth,db as primaryDb,rtdb as primaryRtdb} from '../firebase';

const secondaryApp=getApps().find(a=>a.name==='nexus-dashboard')||initializeApp(config,'nexus-dashboard');
const secondaryAuth=getAuth(secondaryApp),secondaryDb=getFirestore(secondaryApp),secondaryRtdb=getDatabase(secondaryApp);

export async function verifyDashboardAccess(user:User,db:Firestore,provider?:'google.com'|'password'){
 const token=await user.getIdTokenResult();
 const method=token.signInProvider;
 if(!user.emailVerified||!['google.com','password'].includes(method||'')||(provider&&method!==provider))return false;
 return (await getDocFromServer(doc(db,'dashboardAdmins',user.uid))).data()?.enabled===true;
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

export function useDashboardSession(){
 const [state,setState]=useState({user:null as User|null,allowed:false,checking:true,db:primaryDb,rtdb:primaryRtdb,sessionAuth:primaryAuth});
 useEffect(()=>{
  let live=true,revision=0;
  const users:(User|null|undefined)[]=[undefined,undefined];
  const update=async()=>{
   if(users.some(u=>u===undefined))return;
   const version=++revision;
   setState(s=>({...s,checking:true,allowed:false}));
   for(const index of [0,1]){
    const user=users[index],db=index?secondaryDb:primaryDb;
    if(!user)continue;
    try{
     const allowed=await verifyDashboardAccess(user,db,index?'password':'google.com');
     if(!live||version!==revision)return;
     if(allowed){
      setState({user,allowed:true,checking:false,db,rtdb:index?secondaryRtdb:primaryRtdb,sessionAuth:index?secondaryAuth:primaryAuth});
      return;
     }
    }catch{/* Keep private views closed when permission cannot be verified. */}
   }
   if(live&&version===revision)setState({user:users[0]||users[1]||null,allowed:false,checking:false,db:primaryDb,rtdb:primaryRtdb,sessionAuth:primaryAuth});
  };
  const stops=[onAuthStateChanged(primaryAuth,u=>{users[0]=u;void update();}),onAuthStateChanged(secondaryAuth,u=>{users[1]=u;void update();})];
  return()=>{live=false;revision++;stops.forEach(stop=>stop());};
 },[]);
 const uid=state.user?.uid;
 useEffect(()=>{
  if(!state.allowed||!uid)return;
  const close=()=>setState(current=>current.user?.uid===uid?{...current,allowed:false,checking:false}:current);
  return onSnapshot(doc(state.db,'dashboardAdmins',uid),{includeMetadataChanges:true},snapshot=>{
   if(!snapshot.metadata.fromCache&&snapshot.data()?.enabled!==true)close();
  },close);
 },[state.allowed,state.db,uid]);
 return state;
}

export async function logoutDashboard(selected:typeof primaryAuth){
 await signOut(secondaryAuth);
 if(selected===primaryAuth)await signOut(primaryAuth);
}
