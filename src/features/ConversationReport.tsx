import React,{useState} from 'react';
import {X,Flag} from 'lucide-react';import {auth,db} from '../firebase';import {apiFetch} from './api';import type {Chat,Message,UserProfile} from '../types';
import {addDoc,collection,doc,getDoc,serverTimestamp} from 'firebase/firestore';
import {blockContact} from './privacy';
import {useMobileBack} from './useMobileBack';

export function MessageReport({chatId,message,user,name,onClose}:{chatId:string;message:Message;user:UserProfile;name:string;onClose:()=>void}){
 const [complete,setComplete]=useState(false),[block,setBlock]=useState(false),[busy,setBusy]=useState(false),[sent,setSent]=useState(false),[error,setError]=useState('');
 const close=()=>{if(!busy)onClose();};
 useMobileBack(true,close,85);
 const submit=async(event:React.FormEvent)=>{
  event.preventDefault();
  if(busy)return;
  setBusy(true);
  setError('');
  let recorded=sent;
  try{
   if(auth.currentUser?.uid!==user.uid||message.senderId===user.uid)throw Error('No se pudo verificar el reporte.');
   if(!recorded){
    const snapshot=await getDoc(doc(db,'chats',chatId,'messages',message.id));
    const original=snapshot.data();
    if(!original||original.senderId!==message.senderId||original.deletedAt||original.expiresAt&&original.expiresAt<=Date.now())throw Error('El mensaje ya no está disponible para reportarlo.');
    if(original.content!==message.content||original.type!==message.type)throw Error('El mensaje cambió. Vuelve a seleccionarlo para reportarlo.');
    await addDoc(collection(db,'messageReports'),{reporter:user.uid,chatId,messageId:message.id,targetId:original.senderId,type:original.type,content:original.content,fileName:original.fileName||'',at:serverTimestamp()});
    recorded=true;
    setSent(true);
   }
   if(block)await blockContact(user.uid,message.senderId);
   setComplete(true);
  }catch(cause){
   setError(recorded?'El reporte se envió. Puedes volver a intentar el bloqueo.':cause&&typeof cause==='object'&&'code' in cause&&cause.code==='permission-denied'?'Nexus no pudo verificar este mensaje para reportarlo.':cause instanceof Error?cause.message:'No se pudo enviar el reporte.');
  }finally{setBusy(false);}
 };
 return <div className="feature-backdrop"><form className="feature-dialog conversation-tool message-report" role="dialog" aria-modal="true" aria-labelledby="message-report-title" onSubmit={submit}>
  <h2 id="message-report-title">Reporta a Nexus Chat</h2>
  {complete?<><p role="status">El reporte se envió a Nexus Chat.</p><button type="button" onClick={close}>Listo</button></>:<>
  <p>Se enviará este mensaje a Nexus Chat. {name} no recibirá una notificación si lo reportas o bloqueas.</p>
  <label className="message-report-block">
   <input type="checkbox" checked={block} disabled={busy||sent} onChange={event=>setBlock(event.target.checked)}/>
   <span><strong>Bloquear a {name}</strong><small>Este usuario no podrá llamarte ni enviarte mensajes directos.</small></span>
  </label>
  {error&&<p role="alert">{error}</p>}
  <div className="feature-actions"><button type="button" disabled={busy} onClick={close}>Cancelar</button><button type="submit" disabled={busy}>{sent?'Reintentar bloqueo':'Reportar'}</button></div></>}
 </form></div>;
}
export default function ConversationReport({chat,user,onClose}:{chat:Chat;user:UserProfile;messages:Message[];onClose:()=>void}){
const [reason,setReason]=useState(''),[busy,setBusy]=useState(false),[sent,setSent]=useState(false),[error,setError]=useState('');const kind=chat.kind==='group'?'group':chat.kind==='channel'?'channel':'user',targetId=kind==='user'?chat.participants.find(id=>id!==user.uid):chat.id;
return <div className="feature-backdrop"><form className="feature-dialog conversation-tool" role="dialog" aria-modal="true" aria-label="Reportar conversación" onSubmit={async event=>{event.preventDefault();setBusy(true);setError('');try{if(!targetId)throw Error('No puedes reportarte a ti mismo.');const token=await auth.currentUser?.getIdToken(true);if(!token)throw Error('Vuelve a iniciar sesión.');const response=await apiFetch('/api/moderation/report',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({kind,targetId,chatId:chat.id,reason})});const result=await response.json();if(!response.ok)throw Error(result.error||'No se pudo enviar el reporte.');setSent(true);}catch(error){setError(error instanceof Error?error.message:'No se pudo enviar el reporte.');}finally{setBusy(false);}}}><header><h2>Reportar {kind==='group'?'grupo':kind==='channel'?'canal':'contacto'}</h2><button type="button" aria-label="Cerrar reporte" onClick={onClose}><X/></button></header>{sent?<><p role="status">Recibimos tu reporte. Gracias por ayudar a cuidar Nexus Chat.</p><button type="button" onClick={onClose}>Listo</button></>:<><label>Motivo<textarea required maxLength={1000} value={reason} onChange={event=>setReason(event.target.value)}/></label><small>Cada cuenta puede guardar un reporte por conversación y actualizar su motivo. No se adjuntan tus mensajes ni archivos.</small><button disabled={busy||!reason.trim()||!targetId}><Flag size={18}/>{busy?'Enviando…':'Enviar reporte'}</button></>}{error&&<p role="alert">{error}</p>}</form></div>;}
