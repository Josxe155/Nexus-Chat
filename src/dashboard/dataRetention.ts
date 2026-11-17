import {collection,deleteDoc,doc,getDocsFromServer,getDocFromServer,limit,deleteField,updateDoc,query,runTransaction,serverTimestamp,where,writeBatch} from 'firebase/firestore';
import {ref,remove,set} from 'firebase/database';
import {getAuth} from 'firebase/auth';
import type {Firestore} from 'firebase/firestore';
import type {Database} from 'firebase/database';
import {guestInactive} from '../features/retentionPolicy';
import {purgeRoomExpired} from '../features/messageRetention';
export function createDataRetention({db,rtdb}:{db:Firestore;rtdb:Database}){
const auth=getAuth(db.app);
let running=false;
async function eraseCollection(path:string){for(;;){const rows=await getDocsFromServer(query(collection(db,path),limit(100)));if(rows.empty)return;const batch=writeBatch(db);rows.docs.forEach(r=>batch.delete(r.ref));await batch.commit();}}
async function purgeGuest(uid:string){
 // A tombstone revokes access before deleting anything and makes interrupted runs resumable.
 await runTransaction(db,async tx=>{const marker=doc(db,'deletedAccounts',uid),old=await tx.get(marker);if(old.exists()){if(old.data().reason!=='guest-inactivity')throw Error('Esta cuenta no corresponde a la retención de invitados.');return;}const profile=await tx.get(doc(db,'users',uid));if(!profile.exists()||!guestInactive(profile.data()))throw Error('La cuenta sigue activa.');tx.set(marker,{uid,reason:'guest-inactivity',deletedAt:serverTimestamp(),purgedAt:0});});
 await set(ref(rtdb,'moderatedUsers/'+uid),true);
 const files=await getDocsFromServer(query(collection(db,'mediaFiles'),where('owner','==',uid)));
 for(const file of files.docs){await remove(ref(rtdb,'clientMedia/'+file.id));await eraseCollection('mediaFiles/'+file.id+'/singleViews');await deleteDoc(file.ref);}
 const statuses=await getDocsFromServer(query(collection(db,'statuses'),where('owner','==',uid)));
 for(const status of statuses.docs){await eraseCollection('statuses/'+status.id+'/reactions');await deleteDoc(status.ref);}
 const chats=await getDocsFromServer(collection(db,'chats'));
 for(const chat of chats.docs){if(chat.data().lastMessage?.senderId===uid)await updateDoc(chat.ref,{lastMessage:deleteField(),unreadCount:{}});for(;;){const rows=await getDocsFromServer(query(collection(db,'chats',chat.id,'messages'),where('senderId','==',uid),limit(100)));if(rows.empty)break;const batch=writeBatch(db);rows.docs.forEach(r=>batch.delete(r.ref));await batch.commit();}}
 for(const name of ['private','details','conversations','messageFlags'])await eraseCollection('users/'+uid+'/'+name);
 for(const name of ['usernames','nexusNumberReservations','contactCodes']){const rows=await getDocsFromServer(query(collection(db,name),where('uid','==',uid)));for(const record of rows.docs)await deleteDoc(record.ref);}
 for(const name of ['guestAccountCredentials','nexusNumbers','nexusIdentities','usernameChanges'])await deleteDoc(doc(db,name,uid));
 for(const name of ['guestActivity','presence','presenceSessions','presenceLastSeen','presencePrivacy','incoming'])await remove(ref(rtdb,name+'/'+uid));
 await deleteDoc(doc(db,'users',uid));
 await updateDoc(doc(db,'deletedAccounts',uid),{purgedAt:serverTimestamp()});
}
/** Independent of the monthly wipe; runs only inside an authenticated owner dashboard. */
async function retainDashboardData(){
 if(running||!navigator.onLine||!auth.currentUser)return;
 running=true;const owner=auth.currentUser.uid;
 const active=()=>{if(auth.currentUser?.uid!==owner)throw Error('La sesión cambió.');};
 try{
  const chats=await getDocsFromServer(collection(db,'chats'));
  for(const chat of chats.docs){
   active();await purgeRoomExpired(chat.id,db);
   const last=chat.data().lastMessage;
   if(last?.expiresAt&&last.expiresAt<=Date.now()&&!(await getDocFromServer(doc(db,'chats',chat.id,'messages',last.id))).exists())await updateDoc(chat.ref,{lastMessage:deleteField(),unreadCount:{}});
   const votes=await getDocsFromServer(collection(db,'chats',chat.id,'pollVotes'));
   for(const vote of votes.docs){active();if(!(await getDocFromServer(doc(db,'chats',chat.id,'messages',vote.data().messageId))).exists())await deleteDoc(vote.ref);}
  }
  const media=await getDocsFromServer(query(collection(db,'mediaFiles'),where('scope','==','chat')));
  for(const file of media.docs){active();const d=file.data();if(d.referenceId&&!(await getDocFromServer(doc(db,'chats',d.chatId,'messages',d.referenceId))).exists()){await remove(ref(rtdb,'clientMedia/'+file.id));await eraseCollection('mediaFiles/'+file.id+'/singleViews');await deleteDoc(file.ref);}}

  const users=await getDocsFromServer(collection(db,'users'));
  for(const user of users.docs){active();if(user.id!==owner&&guestInactive(user.data()))await purgeGuest(user.id);}
  // Resume accounts whose process was interrupted after access had already been revoked.
  const pending=await getDocsFromServer(query(collection(db,'deletedAccounts'),where('reason','==','guest-inactivity')));
  for(const marker of pending.docs){active();if(!marker.data().purgedAt)await purgeGuest(marker.id);}
 }finally{running=false;}
}

return {retainDashboardData};
}
