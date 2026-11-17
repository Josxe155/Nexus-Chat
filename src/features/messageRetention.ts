import {collection,deleteDoc,doc,getDocsFromServer,limit,orderBy,startAfter,query,where,writeBatch} from 'firebase/firestore';
import {auth,db} from '../firebase';
import type {Chat} from '../types';
let running=false;
/** Delete by reference, without reading the content which rules now deny after expiry. */
export async function purgeExpiredMessages(uid:string,chats:Chat[]){
 if(running||auth.currentUser?.uid!==uid||!navigator.onLine)return;
 running=true;
 try{for(const chat of chats){
  if(auth.currentUser?.uid!==uid)return;
  // Only expiration metadata is queried by the privileged dashboard. Ordinary clients
  // cannot list expired bodies, so loaded message references are removed separately.
  const last=chat.lastMessage;
  if(last?.expiresAt&&last.expiresAt<=Date.now())await deleteDoc(doc(db,'chats',chat.id,'messages',last.id)).catch(()=>{});
 }}finally{running=false;}
}
export async function purgeLoadedExpired(uid:string,chatId:string,messages:{id:string;expiresAt?:number;keptBy?:string}[]){
 if(auth.currentUser?.uid!==uid||!navigator.onLine)return;
 const expired=messages.filter(m=>!m.keptBy&&m.expiresAt&&m.expiresAt<=Date.now());
 for(let start=0;start<expired.length;start+=50){const batch=writeBatch(db);expired.slice(start,start+50).forEach(m=>batch.delete(doc(db,'chats',chatId,'messages',m.id)));await batch.commit();}
}
export async function purgeRoomExpired(chatId:string,dbInstance=db){
 let cursor;
 for(;;){
  const constraints:any[]=[where('expiresAt','>',0),where('expiresAt','<=',Date.now()),orderBy('expiresAt'),limit(100)];if(cursor)constraints.push(startAfter(cursor));
  const rows=await getDocsFromServer(query(collection(dbInstance,'chats',chatId,'messages'),...constraints));if(rows.empty)return;
  const batch=writeBatch(dbInstance);rows.docs.filter(r=>!r.data().keptBy).forEach(r=>batch.delete(r.ref));await batch.commit();cursor=rows.docs.at(-1);if(rows.size<100)return;
 }
}
