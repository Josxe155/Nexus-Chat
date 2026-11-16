import {deleteUser,EmailAuthProvider,linkWithCredential,signInAnonymously,signOut,updateProfile,type Auth,type User} from 'firebase/auth';
import {doc,runTransaction,serverTimestamp,type Firestore} from 'firebase/firestore';
import {GUEST_CREDENTIAL_COLLECTION,isGuestIdentity,newGuestCredentials} from './guestIdentity';
let pending:Promise<User>|undefined;
let failure='';
export function takeGuestCreationError(){const message=failure;failure='';return message;}
export async function awaitGuestCreation(user:User){
 const task=pending;if(!task||!isGuestIdentity(user))return user;
 const ready=await task;return ready.uid===user.uid?ready:user;
}
export function createGuestAccount(auth:Auth,db:Firestore,nickname:string):Promise<User>{
 if(pending)return pending;
 if(!nickname.trim()||nickname.trim().length>32)return Promise.reject(Error('Escribe un apodo de hasta 32 caracteres.'));
 failure='';
 const operation=(async()=>{
  let created:User|undefined;
  try{
   // A new invitation always gets a new UID, including retries after signing out.
   if(auth.currentUser)await signOut(auth);
   const session=await signInAnonymously(auth);created=session.user;
   const credentials=newGuestCredentials(created.uid);
   const active=()=>{if(auth.currentUser?.uid!==created!.uid)throw Error('session-changed');};
   active();const linked=await linkWithCredential(created,EmailAuthProvider.credential(credentials.email,credentials.password));
   active();await updateProfile(linked.user,{displayName:nickname.trim()});active();await linked.user.getIdToken(true);active();
   // Write once after Authentication confirms the linked address. No web reads.
   await runTransaction(db,async transaction=>{active();transaction.set(doc(db,GUEST_CREDENTIAL_COLLECTION,created!.uid),{uid:created!.uid,...credentials,version:1,createdAt:serverTimestamp()});});
   active();return linked.user;
  }catch{
   const message='No se pudo preparar tu cuenta de invitado. Comprueba tu conexión e inténtalo de nuevo.';failure=message;
   // Only the fresh identity created by this operation is eligible for rollback.
   if(created)await deleteUser(created).catch(()=>{});
   throw Error(message);
  }
 })();
 pending=operation;
 void operation.finally(()=>{if(pending===operation)pending=undefined;}).catch(()=>{});
 return operation;
}
