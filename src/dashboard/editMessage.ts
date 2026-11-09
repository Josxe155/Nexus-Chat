import {collection,doc,documentId,getDocFromServer,getDocsFromServer,query,where,orderBy,limit,startAfter,runTransaction,serverTimestamp,type Firestore,type QueryDocumentSnapshot} from 'firebase/firestore';
import type {User} from 'firebase/auth';
import {verifyDashboardAccess} from './session';
import {assertEditableMessage,normalizeName,type MessageEditCommand} from './messageEditCommand';

export async function editMessageByCommand(db:Firestore,user:User,command:MessageEditCommand,signal:AbortSignal,onCommit?:()=>void){
 const check=async()=>{signal.throwIfAborted();if(!await verifyDashboardAccess(user,db))throw Error('Tu acceso de administración ya no está disponible.');signal.throwIfAborted();};
 await check();
 if(!command.after.trim()||command.after.length>20000)throw Error('El texto nuevo debe tener entre 1 y 20 000 caracteres.');
 const people:{id:string;name:string}[]=[];let cursor:QueryDocumentSnapshot|undefined;
 for(;;){
  signal.throwIfAborted();const rows=await getDocsFromServer(query(collection(db,'users'),orderBy(documentId()),...(cursor?[startAfter(cursor)]:[]),limit(100)));
  for(const row of rows.docs){const p=row.data();if([p.nombre,p.username,row.id].some(value=>typeof value==='string'&&normalizeName(value)===normalizeName(command.author)))people.push({id:row.id,name:p.nombre||p.username||row.id});}
  if(rows.size<100)break;cursor=rows.docs.at(-1);
 }
 if(!people.length)return 'No encontré una cuenta con ese nombre. No se modificó ningún mensaje.';
 if(people.length!==1)return 'Hay varias cuentas con ese nombre. Repite el comando usando el @usuario exacto. No se modificó ningún mensaje.';
 const person=people[0],matches:{path:string;chatId:string;messageId:string}[]=[];cursor=undefined;
 for(;;){
  signal.throwIfAborted();const chats=await getDocsFromServer(query(collection(db,'chats'),orderBy(documentId()),...(cursor?[startAfter(cursor)]:[]),limit(50)));
  for(const chat of chats.docs){
   if(command.chat&&command.chat!==chat.id&&normalizeName(String(chat.data().title||''))!==normalizeName(command.chat))continue;
   signal.throwIfAborted();const rows=await getDocsFromServer(query(collection(db,'chats',chat.id,'messages'),where('senderId','==',person.id),where('content','==',command.before)));
   for(const message of rows.docs){try{assertEditableMessage(message.data(),command,person.id,Date.now());matches.push({path:message.ref.path,chatId:chat.id,messageId:message.id});}catch{}}
  }
  if(chats.size<50)break;cursor=chats.docs.at(-1);
 }
 if(!matches.length)return 'No encontré un mensaje de texto editable con ese autor y ese contenido exacto. No se realizó ningún cambio.';
 if(matches.length!==1)return 'Encontré varias coincidencias. Repite el comando añadiendo al final en el chat "ID". Chats: '+[...new Set(matches.map(m=>m.chatId))].join(', ')+'. No se modificó ningún mensaje.';
 const match=matches[0],messageRef=doc(db,match.path),chatRef=doc(db,'chats',match.chatId),auditRef=doc(collection(db,'dashboardEdits'));
 await check();
 onCommit?.();
 await runTransaction(db,async tx=>{
  signal.throwIfAborted();const [message,chat]=await Promise.all([tx.get(messageRef),tx.get(chatRef)]);const previous=message.data();
  assertEditableMessage(previous,command,person.id,Date.now());signal.throwIfAborted();
  const edit={content:command.after,edited:true,adminEditedBy:user.uid,adminEditedAt:serverTimestamp(),adminEditId:auditRef.id};
  tx.update(messageRef,edit);
  tx.set(auditRef,{actor:user.uid,chatId:match.chatId,messageId:match.messageId,senderId:person.id,before:command.before,after:command.after,at:serverTimestamp()});
  const last=chat.data()?.lastMessage;
  if(last&&(last.id===match.messageId||last.senderId===person.id&&last.timestamp===previous!.timestamp&&last.content===command.before))tx.update(chatRef,{'lastMessage.content':command.after,'lastMessage.edited':true});
 });
 try{
  const verified=await getDocFromServer(messageRef);
  if(verified.data()?.content!==command.after)return 'Se guardó la edición, pero el mensaje volvió a cambiar. Revisa la conversación.';
 }catch{return 'La edición quedó guardada, pero no se pudo volver a consultar el mensaje. Revisa la conversación.';}
 return 'Mensaje de '+person.name+' actualizado en el chat '+match.chatId+':\n\n«'+command.after+'»';
}
