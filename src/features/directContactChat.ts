import {doc,getDoc,setDoc} from 'firebase/firestore';
import {auth,db} from '../firebase';
import type {Chat} from '../types';
// Read before creating, and re-read after a competing creation, without overwriting a conversation.
export async function ensureDirectContactChat(owner:string,chat:Chat){
 const active=()=>{if(auth.currentUser?.uid!==owner)throw Error('La sesión cambió. Vuelve a iniciar sesión.');};active();
 const ref=doc(db,'chats',chat.id);
 const existing=async()=>{try{const snapshot=await getDoc(ref);active();if(!snapshot.exists())return false;const data=snapshot.data();if((data.kind&&data.kind!=='direct')||!Array.isArray(data.participants)||data.participants.length!==chat.participants.length||!chat.participants.every(uid=>data.participants.includes(uid)))throw Error('No se pudo abrir esta conversación.');return true;}catch(error){if((error as {code?:string}).code==='permission-denied')return false;throw error;}};
 if(await existing())return;
 active();try{await setDoc(ref,chat);}catch(error){if(!await existing())throw error;}active();
}
