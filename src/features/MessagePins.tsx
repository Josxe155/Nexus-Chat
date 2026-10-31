import {useEncryptionRevision} from './useEncryptionRevision';
import {readableMessage} from './encryption';
import {useEffect,useState} from 'react';
import {Pin,X} from 'lucide-react';
import {doc,runTransaction,onSnapshot} from 'firebase/firestore';
import {auth,db} from '../firebase';
import type {Chat,Message} from '../types';
import {useMobileBack} from './useMobileBack';
import {dataErrorMessage} from './dataErrors';
export const PIN_DURATIONS=[86400000,604800000,2592000000] as const;
export function messagePinned(message:Message,chat:Chat,now=Date.now()){
 if(!message.pinned||message.deletedAt||message.expiresAt&&message.expiresAt<=now)return false;
 if(!message.pinExpiresAt)return true;
 return message.pinExpiresAt>now&&chat.messagePins?.[message.id]?.expiresAt===message.pinExpiresAt;
}
export async function setMessagePin(chatId:string,messageId:string,duration:number){
 const uid=auth.currentUser?.uid;if(!uid)throw Error('Inicia sesión para fijar mensajes.');
 if(duration!==0&&!PIN_DURATIONS.includes(duration as any))throw Error('Elige una duración válida.');
 await runTransaction(db,async tx=>{const chatRef=doc(db,'chats',chatId),messageRef=doc(db,'chats',chatId,'messages',messageId),[room,snapshot]=await Promise.all([tx.get(chatRef),tx.get(messageRef)]);const chat=room.data() as Chat,message=snapshot.data() as Message,now=Date.now();
  if(!room.exists()||!snapshot.exists()||!chat.participants.includes(uid))throw Error('El mensaje ya no está disponible.');
  if(chat.kind==='group'&&!chat.membersCanEdit&&!chat.admins?.includes(uid))throw Error('Solo los administradores pueden fijar mensajes en este grupo.');
  if(duration&&(message.deletedAt||message.expiresAt&&message.expiresAt<=now))throw Error('Este mensaje ya no puede fijarse.');
  const candidates=Object.entries(chat.messagePins||{}).filter(([id,pin])=>id!==messageId&&pin.expiresAt>now);const previous=await Promise.all(candidates.map(async([id,pin])=>{const record=await tx.get(doc(db,'chats',chatId,'messages',id)),data=record.data();return record.exists()&&!data?.deletedAt&&(!data?.expiresAt||data.expiresAt>now)?[id,pin] as const:null;}));const pins=Object.fromEntries(previous.filter((entry):entry is NonNullable<typeof entry>=>entry!==null));
  if(duration){if(Object.keys(pins).length>=3)throw Error('Puedes fijar hasta 3 mensajes. Desfija uno antes de añadir otro.');pins[messageId]={expiresAt:now+duration,by:uid};}
  tx.update(chatRef,{messagePins:pins});tx.update(messageRef,{pinned:duration>0,pinExpiresAt:duration?now+duration:0,pinnedAt:duration?now:0,pinnedBy:duration?uid:''});
 });
}
export default function PinMessageDialog({chat,message,onClose}:{chat:Chat;message:Message;onClose:()=>void}){
 const [duration,setDuration]=useState<number>(604800000),[busy,setBusy]=useState(false),[error,setError]=useState('');useMobileBack(true,()=>{if(!busy)onClose();},85);
 return <div className="feature-backdrop"><form className="feature-dialog message-pin-dialog" role="dialog" aria-modal="true" aria-label="Fijar mensaje" onSubmit={async event=>{event.preventDefault();setBusy(true);try{await setMessagePin(chat.id,message.id,duration);onClose();}catch(error){setError((error as any)?.code?dataErrorMessage(error):error instanceof Error?error.message:'No se pudo fijar el mensaje.');}finally{setBusy(false);}}}><header><Pin/><h2>Fijar mensaje</h2><button type="button" disabled={busy} aria-label="Cerrar fijar mensaje" onClick={onClose}><X/></button></header><p>Elige cuánto tiempo aparecerá fijado para las personas de este chat.</p>{PIN_DURATIONS.map((value,index)=><label className="settings-radio" key={value}><input type="radio" name="pin-duration" checked={duration===value} onChange={()=>setDuration(value)}/>{['24 horas','7 días','30 días'][index]}</label>)}{error&&<p role="alert">{error}</p>}<footer><button type="button" disabled={busy} onClick={onClose}>Cancelar</button><button type="submit" disabled={busy}>{busy?'Fijando…':'Fijar'}</button></footer></form></div>;
}
export function usePinClock(messages:Message[]){const [now,setNow]=useState(Date.now());useEffect(()=>{const next=Math.min(...messages.map(message=>message.pinExpiresAt||Infinity).filter(stamp=>stamp>Date.now()));if(!Number.isFinite(next))return;const timer=setTimeout(()=>setNow(Date.now()),Math.min(2147483647,Math.max(1,next-Date.now()+10)));return()=>clearTimeout(timer);},[messages,now]);return now;}
export function useSharedPins(chat:Chat,uid:string){
 const keyRevision=useEncryptionRevision();const [records,setRecords]=useState<Record<string,Message>>({});const revision=JSON.stringify(chat.messagePins||{});
 useEffect(()=>{let active=true;setRecords({});const stops=Object.keys(chat.messagePins||{}).slice(0,3).map(id=>{let turn=0;const discard=()=>{turn++;if(active)setRecords(previous=>{const next={...previous};delete next[id];return next;});};return onSnapshot(doc(db,'chats',chat.id,'messages',id),async snapshot=>{const current=++turn;if(snapshot.exists()){const message=await readableMessage({...snapshot.data(),id}as Message,uid);if(active&&current===turn)setRecords(previous=>({...previous,[id]:message}));}else discard();},discard);});return()=>{active=false;stops.forEach(stop=>stop());};},[chat.id,uid,revision,keyRevision]);
 return Object.values(records).filter(message=>chat.messagePins?.[message.id]);
}
