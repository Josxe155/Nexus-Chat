import {deleteField,doc,runTransaction,serverTimestamp} from 'firebase/firestore';
import {auth,db} from '../firebase';
import type {Message} from '../types';
import {isOneTimeMedia} from './viewOnce';
export async function keepMessage(chatId:string,messageId:string,keep:boolean){
 const uid=auth.currentUser?.uid;if(!uid)throw Error('Inicia sesión para conservar el mensaje.');
 await runTransaction(db,async tx=>{const ref=doc(db,'chats',chatId,'messages',messageId),snapshot=await tx.get(ref),message=snapshot.data() as Message;
  if(!snapshot.exists()||message.deletedAt||isOneTimeMedia(message)||message.keepVetoed)throw Error('Este mensaje no se puede conservar.');
  const mediaId=/^\/api\/media\/([a-f0-9-]{36})$/.exec(message.fileUrl||'')?.[1],mediaRef=mediaId?doc(db,'mediaFiles',mediaId):null,media=mediaRef?await tx.get(mediaRef):null;
  const syncMedia=(expiry:number)=>{if(mediaRef&&media?.exists()&&media.data().referenceId===messageId)tx.update(mediaRef,{expiresAt:expiry});};
  if(keep){
   if(message.keptBy)return;
   if(!message.expiresAt||message.expiresAt<=Date.now())throw Error('Solo se pueden conservar mensajes temporales que no hayan vencido.');
   if(uid!==message.senderId){
    if(message.keepRequestedBy===uid)return;
    if(message.keepRequestedBy)throw Error('Ya hay una solicitud pendiente para este mensaje.');
    tx.update(ref,{keepRequestedBy:uid});return;
   }
   syncMedia(0);tx.update(ref,{keptBy:message.keepRequestedBy||uid,keptAt:serverTimestamp(),originalExpiresAt:message.expiresAt,expiresAt:0,keepRequestedBy:deleteField()});
  }else if(message.keptBy){
   if((message.keptBy!==uid&&message.senderId!==uid)||!message.originalExpiresAt)throw Error('Solo quien envió o conservó el mensaje puede dejar de conservarlo.');
   syncMedia(message.originalExpiresAt);tx.update(ref,{expiresAt:message.originalExpiresAt,keptBy:deleteField(),keptAt:deleteField(),originalExpiresAt:deleteField(),...(uid===message.senderId&&message.keptBy!==uid?{keepVetoed:true}:{})});
  }else if(message.keepRequestedBy){
   if(message.senderId!==uid&&message.keepRequestedBy!==uid)throw Error('No puedes responder a esta solicitud.');
   tx.update(ref,{keepRequestedBy:deleteField(),...(message.senderId===uid?{keepVetoed:true}:{})});
  }
 });
}
