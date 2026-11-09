import {collection,getDocs,limit,orderBy,query,startAfter,where,type QueryDocumentSnapshot,type DocumentData,type QueryConstraint} from 'firebase/firestore';
import {auth,db} from '../firebase';
import type {Chat,Message,UserProfile} from '../types';
import {visibleMessage,type ConversationState,type MessageFlag} from './PersonalState';
import {isOneTimeMedia} from './viewOnce';
import {readableMessage} from './encryption';
import {pickReportFields} from './accountReportModel';
export async function buildChatBackup(user:UserProfile,chats:Chat[],state:{conversations:Record<string,ConversationState>;flags:Record<string,MessageFlag>;loaded:boolean}){
 const current=()=>{if(auth.currentUser?.uid!==user.uid)throw Error('La sesión cambió. Vuelve a iniciar la copia.');};current();if(!state.loaded)throw Error('Espera a que se cargue tu historial antes de crear la copia.');
 const result:{id:string;info:Record<string,unknown>;messages:Record<string,unknown>[]}[]=[];let bytes=0;
 for(const chat of chats){current();if(!chat.participants.includes(user.uid)||chat.kind==='channel'||state.conversations[chat.id]?.deletedAt)continue;const messages:Record<string,unknown>[]=[];let cursor:QueryDocumentSnapshot<DocumentData>|undefined;
 for(;;){current();const constraints:QueryConstraint[]=[where('timestamp','>=',Math.max(chat.historyStartsAt?.[user.uid]||0,(state.conversations[chat.id]?.clearedAt||0)+1)),orderBy('timestamp','asc'),limit(200)];if(cursor)constraints.push(startAfter(cursor));const snapshot=await getDocs(query(collection(db,'chats',chat.id,'messages'),...constraints));current();for(const record of snapshot.docs){const message={...record.data(),id:record.id,chatId:chat.id} as Message;if(isOneTimeMedia(message)||message.deletedAt||!visibleMessage(message,state.conversations[chat.id],state.flags))continue;const readable=await readableMessage(message,user.uid);const copy={id:record.id,...pickReportFields(readable as unknown as Record<string,unknown>,['senderId','timestamp','content','type','fileUrl','fileName','fileSize','voiceNote','contact','encrypted','encryption','cipher'])};bytes+=new TextEncoder().encode(JSON.stringify(copy)).length;if(bytes>38*1024*1024)throw Error('Tu historial supera el tamaño de una copia. No se guardó una copia incompleta.');messages.push(copy);}if(snapshot.docs.length<200)break;cursor=snapshot.docs.at(-1);}
 result.push({id:chat.id,info:pickReportFields(chat as unknown as Record<string,unknown>,['title','kind','createdAt']),messages});}
 current();return {format:'nexus-chat-backup-v1',uid:user.uid,createdAt:Date.now(),profile:pickReportFields(user as unknown as Record<string,unknown>,['nombre','username','bio']),chats:result,media:'references-only'};
}
