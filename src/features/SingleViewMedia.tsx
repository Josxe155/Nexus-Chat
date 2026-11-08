import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {CircleDashed,X} from 'lucide-react';
import {doc,onSnapshot,runTransaction,serverTimestamp} from 'firebase/firestore';
import {db} from '../firebase';
import type {Message} from '../types';
import {isPrivateMedia,loadSingleMedia} from './mediaTransfer';
import {useMobileBack} from './useMobileBack';
import {pauseVoice} from './voicePlayback';
import './single-view-media.css';

export default function SingleViewMedia({message,uid}:{message:Message;uid:string}){
 const sender=message.senderId===uid,video=message.type==='video',url=message.fileUrl||'',mediaId=isPrivateMedia(url)?url.split('/').at(-1):undefined;
 const [opened,setOpened]=useState(false),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[source,setSource]=useState(''),[error,setError]=useState('');
 const request=useRef<AbortController|null>(null),objectURL=useRef(''),dialog=useRef<HTMLElement>(null);
 const close=()=>{URL.revokeObjectURL(objectURL.current);objectURL.current='';setSource('');};
 useMobileBack(!!source,close,90);
 useEffect(()=>{
  if(sender||!mediaId)return;
  return onSnapshot(doc(db,'mediaFiles',mediaId,'singleViews',uid),{includeMetadataChanges:true},snapshot=>{
   setOpened(snapshot.exists());setReady(!snapshot.metadata.fromCache);
  },()=>setError('No se pudo comprobar la apertura de este archivo.'));
 },[mediaId,uid,sender]);
 useEffect(()=>()=>{request.current?.abort();URL.revokeObjectURL(objectURL.current);},[]);
 useEffect(()=>{if(source)dialog.current?.querySelector('button')?.focus();},[source]);
 async function open(){
  if(!mediaId||request.current||opened)return;
  const controller=new AbortController();request.current=controller;setBusy(true);setError('');
  const marker=doc(db,'mediaFiles',mediaId,'singleViews',uid);
  try{
   await runTransaction(db,async transaction=>{
    if((await transaction.get(marker)).exists())throw Error('Este archivo ya se abrió.');
    transaction.set(marker,{messageId:message.id,openedAt:serverTimestamp()});
   });
   if(controller.signal.aborted)return;
   setOpened(true);
   const blob=await loadSingleMedia(url,controller.signal);
   if(controller.signal.aborted)return;
   pauseVoice();objectURL.current=URL.createObjectURL(blob);setSource(objectURL.current);
  }catch{
   if(!controller.signal.aborted)setError('No se pudo mostrar el archivo. Si la apertura se registró, aparecerá como abierto.');
  }finally{if(!controller.signal.aborted){request.current=null;setBusy(false);}}
 }
 const label=video?'Video de visualización única':'Foto de visualización única';
 return <div className="single-listen-audio"><button type="button" disabled={sender||opened||!ready||busy||!mediaId} onClick={()=>void open()}><CircleDashed size={22}/><span>{busy?'Abriendo…':opened?'Abierto':label}</span></button>
  {!source&&error&&<small role="alert">{error}</small>}
  {source&&createPortal(<section ref={dialog} className="single-view-media" role="dialog" aria-modal="true" aria-label={label} onContextMenu={event=>event.preventDefault()} onKeyDown={event=>{if(event.key==='Escape')close();}}>
   <header><button type="button" onClick={close} aria-label="Cerrar visualización única"><X/></button><strong>{label}</strong></header>
   {video?<video src={source} controls playsInline controlsList="nodownload noremoteplayback" disablePictureInPicture onEnded={close} onError={()=>setError('No se pudo reproducir el video.')}/>:<img src={source} alt="Foto recibida" draggable={false} onError={()=>setError('No se pudo mostrar la foto.')}/>}
   {error&&<p role="alert">{error}</p>}
  </section>,document.body)}
 </div>;
}
