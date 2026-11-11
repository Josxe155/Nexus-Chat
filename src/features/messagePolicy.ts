import type {Chat,Message} from '../types';
export const CHAT_EDIT_MS=15*60000,CHAT_DELETE_MS=2*86400000,CHANNEL_CHANGE_MS=30*86400000;
export const DELETED_MESSAGE='🚫 Este mensaje fue eliminado';
export function sentAt(message:Message){return message.serverSentAt?.toMillis?.()||message.timestamp;}
export function messageIsAvailable(message:Message,now=Date.now()){const stamp=sentAt(message);return !message.deletedAt&&!message.localState&&message.content!==DELETED_MESSAGE&&Number.isFinite(stamp)&&stamp<=now+60000&&(!message.expiresAt||message.expiresAt>now);}
export function mayEditMessage(chat:Chat,message:Message,uid:string,now=Date.now()){
 if(!messageIsAvailable(message,now)||message.sealed)return false;
 if(chat.kind==='channel')return !chat.channelDeletedAt&&!!chat.admins?.includes(uid)&&message.type==='text'&&!message.forwarded&&now-sentAt(message)<=CHANNEL_CHANGE_MS;
 return message.senderId===uid&&['text','poll'].includes(message.type)&&now-sentAt(message)<=CHAT_EDIT_MS;
}
export function mayDeleteForEveryone(chat:Chat,message:Message,uid:string,now=Date.now()){
 if(!messageIsAvailable(message,now))return false;
 if(chat.kind==='channel')return !chat.channelDeletedAt&&!!chat.admins?.includes(uid)&&now-sentAt(message)<=CHANNEL_CHANGE_MS;
 return (message.senderId===uid||chat.kind==='group'&&!!chat.admins?.includes(uid))&&now-sentAt(message)<=CHAT_DELETE_MS;
}
export function deletionLabel(chat:Chat,message:Message,uid:string,names:Record<string,string>={}){if(chat.kind==='channel')return 'Se eliminó esta actualización.';if(message.deletedBy&&message.deletedBy!==message.senderId)return 'Este mensaje fue eliminado por '+(names[message.deletedBy]||'un administrador')+'.';return message.senderId===uid?'Eliminaste este mensaje.':'Se eliminó este mensaje.';}
