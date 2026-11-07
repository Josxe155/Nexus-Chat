import {deleteField,doc,runTransaction,serverTimestamp} from 'firebase/firestore';
import {auth,db} from '../firebase';
import type {Message} from '../types';
export async function keepMessage(chatId:string,messageId:string,keep:boolean){
 const uid=auth.currentUser?.uid;if(!uid)throw Error('Inicia sesión para conservar el mensaje.');
 await runTransaction(db,async tx=>{const ref=doc(db,'chats',chatId,'messages',messageId),snapshot=await tx.get(ref),message=snapshot.data() as Message;
  if(!snapshot.exists()||message.deletedAt||message.fileName?.startsWith('nota-unica-'))throw Error('Este mensaje no se puede conservar.');
  if(!keep&&!message.keptBy)return;
  if(keep){if(message.keptBy)return;if(!message.expiresAt||message.expiresAt<=Date.now())throw Error('Solo se pueden conservar mensajes temporales que no hayan vencido.');tx.update(ref,{keptBy:uid,keptAt:serverTimestamp(),originalExpiresAt:message.expiresAt,expiresAt:deleteField()});}
  else{if((message.keptBy!==uid&&message.senderId!==uid)||!message.originalExpiresAt)throw Error('Solo quien envió o conservó el mensaje puede dejar de conservarlo.');tx.update(ref,{expiresAt:message.originalExpiresAt,keptBy:deleteField(),keptAt:deleteField(),originalExpiresAt:deleteField()});}
 });
}
