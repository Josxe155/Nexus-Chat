import {enqueueMessage} from './Outbox';
import {queueNotificationEvent} from './push';
import {playOutgoing} from './Notifications';
import {collection,doc,getDoc,writeBatch,setDoc,runTransaction,updateDoc,serverTimestamp,increment} from 'firebase/firestore';
import {db} from '../firebase';
import {decryptMessage} from './encryption';
import type {Chat,Message} from '../types';
export async function postMessage(chat:Chat,uid:string,content:string,type:Message['type']='text',extra:Partial<Message>={}){
 return enqueueMessage(chat,uid,content,type,extra);
}
export async function createPoll(chat:Chat,uid:string,question:string,options:string[],multiple:boolean,closesAt?:number){
 const clean=options.map(s=>s.trim()).filter(Boolean);if(!question.trim()||clean.length<2||clean.length>12||clean.some(option=>option.length>100)||question.length>255)throw new Error('La encuesta necesita una pregunta y entre 2 y 12 opciones.');
 if(closesAt&&(!Number.isFinite(closesAt)||closesAt<=Date.now()||closesAt>Date.now()+31*86400000))throw Error('Elige una fecha de cierre dentro de los próximos 31 días.');
 await postMessage(chat,uid,question.trim(),'poll',{poll:{question:question.trim(),options:clean.map((text,i)=>({id:String(i),text})),multiple,optionIds:clean.map((_,i)=>String(i)),votes:{},...(closesAt?{closesAt}:{})}});
}
export async function vote(chatId:string,messageId:string,uid:string,option:string){
 const target=doc(db,'chats',chatId,'messages',messageId);await runTransaction(db,async tx=>{const snap=await tx.get(target);const poll=snap.data()?.poll;if(!poll||snap.data()?.deletedAt||!poll.options.some((o:any)=>o.id===option))throw new Error('La opción no está disponible.');if(poll.closedAt||poll.closesAt&&poll.closesAt<=Date.now())throw Error('La encuesta está cerrada.');const previous=poll.votes?.[uid]||[];const next=poll.multiple?(previous.includes(option)?previous.filter((id:string)=>id!==option):[...previous,option]):(previous.includes(option)?[]:[option]);tx.update(target,{[`poll.votes.${uid}`]:next});});
}
export async function closePoll(chatId:string,messageId:string){await updateDoc(doc(db,'chats',chatId,'messages',messageId),{'poll.closedAt':serverTimestamp()});}
export async function editPollQuestion(chat:Chat,uid:string,messageId:string,question:string){
 const text=question.trim();if(!text||text.length>255)throw Error('Escribe una pregunta de hasta 255 caracteres.');
 const target=doc(db,'chats',chat.id,'messages',messageId),before=await getDoc(target);
 if(!before.exists())throw Error('La encuesta ya no está disponible.');
 const original=before.data() as Message;if(original.sealed)throw Error('Esta encuesta pertenece al historial cifrado anterior y no se puede editar.');const decoded=await decryptMessage(original,uid);
 if(!decoded.poll||original.senderId!==uid||original.deletedAt)throw Error('Solo puedes editar tus propias encuestas.');
 const stamp=original.serverSentAt?.toMillis?.()||original.timestamp;
 if(Date.now()-stamp>900000||original.expiresAt&&original.expiresAt<=Date.now())throw Error('Solo puedes editar la pregunta durante los primeros 15 minutos.');
 await runTransaction(db,async tx=>{
  const current=await tx.get(target),room=await tx.get(doc(db,'chats',chat.id));if(!current.exists()||!room.exists())throw Error('La conversación ya no está disponible.');
  const latest=current.data();if(latest.deletedAt||JSON.stringify(latest.sealed)!==JSON.stringify(original.sealed)||latest.poll?.question!==original.poll?.question)throw Error('La encuesta cambió. Ábrela otra vez antes de editar.');
  // Only the question is changed. Votes that arrive during editing remain intact.
  tx.update(target,{content:text,'poll.question':text,edited:true});
  if(room.data().lastMessage?.id===messageId)tx.update(doc(db,'chats',chat.id),{'lastMessage.content':text});
 });
}
