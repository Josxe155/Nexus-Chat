import {useEffect,useRef,useState} from 'react';
import {ChevronDown,X} from 'lucide-react';
import {collection,doc,documentId,getDoc,getDocs,limit,orderBy,query,startAfter,Timestamp,where,type DocumentData,type Firestore,type Query,type QueryDocumentSnapshot} from 'firebase/firestore';
import {get,ref,type Database} from 'firebase/database';

export type DetailKey='users'|'active'|'messages'|'delivered'|'calls'|'files'|'groups'|'channels'|'communities'|'statuses'|'notices'|'reports';
type Row={id:string;title:string;context?:string;at?:unknown;user?:string};
const batchSize=30;
const format=new Intl.DateTimeFormat('es-EC',{timeZone:'America/Guayaquil',dateStyle:'medium',timeStyle:'short'});
const num=new Intl.NumberFormat('es-EC');
function label(...values:unknown[]){return values.find((value):value is string=>typeof value==='string'&&!!value.trim())?.trim();}
function formatDate(value:unknown){
 const millis=value instanceof Timestamp?value.toMillis():typeof value==='string'?Date.parse(value):value;
 return typeof millis==='number'&&Number.isFinite(millis)&&Math.abs(millis)<=8.64e15?format.format(millis):'';
}
async function* documents(source:Query<DocumentData>,signal:AbortSignal){
 let after:QueryDocumentSnapshot|undefined;
 for(;;){
  signal.throwIfAborted();
  const page=await getDocs(query(source,...(after?[startAfter(after)]:[]),limit(batchSize)));
  signal.throwIfAborted();
  yield* page.docs;
  if(page.size<batchSize)return;
  after=page.docs.at(-1);
 }
}
function delivered(message:DocumentData,participants:unknown){
 return Array.isArray(participants)&&participants.some(id=>id!==message.senderId&&(message.receivedBy?.[id]||message.readBy?.[id]));
}
export const isDelivered=delivered;

async function* detailRows(db:Firestore,rtdb:Database,metric:DetailKey,asOf:number,signal:AbortSignal):AsyncGenerator<Row>{
 if(metric==='calls'){
  const calls=await get(ref(rtdb,'calls'));
  const rows:Row[]=[];
  calls.forEach(entry=>{
   const call=entry.val();
   if(call&&typeof call==='object'&&call.mode!=='file')rows.push({id:entry.key||'',title:call.mode==='video'?'Videollamada':'Llamada de voz',
    context:!call.closed&&call.expiresAt>asOf?'Sala abierta':'Sala finalizada',at:call.createdAt,user:call.owner});
  });
  yield* rows;
  return;
 }
 if(metric==='messages'||metric==='delivered'){
  for await(const chat of documents(query(collection(db,'chats'),orderBy(documentId())),signal)){
   const info=chat.data();
   for await(const message of documents(query(collection(chat.ref,'messages'),orderBy('timestamp')),signal)){
    const data=message.data();
    if(data.deletedAt||(metric==='delivered'&&!delivered(data,info.participants)))continue;
    const types:Record<string,string>={text:'Mensaje de texto',audio:'Audio',image:'Imagen',video:'Video',document:'Documento',sticker:'Sticker',poll:'Encuesta',contact:'Contacto','video-note':'Nota de video'};
    yield {id:chat.id+'/'+message.id,title:Object.hasOwn(types,data.type)?types[data.type]:'Mensaje',
     context:label(info.title)||'Conversación directa',at:data.timestamp,user:data.senderId};
   }
  }
  return;
 }
 const collections={users:'users',active:'dashboardVisits',files:'mediaFiles',groups:'chats',channels:'chats',
  communities:'communities',statuses:'statuses',notices:'officialNotices',reports:'messageReports'};
 const source=collection(db,collections[metric]);
 const rows=metric==='active'?query(source,where('lastVisitAt','>=',Timestamp.fromMillis(asOf-7*86400000)),orderBy('lastVisitAt','desc')):
  metric==='groups'||metric==='channels'?query(source,where('kind','==',metric==='groups'?'group':'channel')):
  metric==='files'?query(source,orderBy('createdAt')):query(source,orderBy(documentId()));
 for await(const item of documents(rows,signal)){
  const data=item.data(),id=item.id;
  switch(metric){
   case 'users': yield {id,title:label(data.nombre,data.username)||'Cuenta de Nexus',context:label(data.username),at:data.createdAt};break;
   case 'active': yield {id,title:'Cuenta de Nexus',user:id,at:data.lastVisitAt};break;
   case 'files': yield {id,title:label(data.name)||'Archivo',context:num.format((Number(data.size)||0)/1024)+' KB',at:data.createdAt,user:data.owner};break;
   case 'groups':
   case 'channels':
   case 'communities': yield {id,title:label(data.title,data.name,data.nombre)||(metric==='groups'?'Grupo':metric==='channels'?'Canal':'Comunidad'),at:data.createdAt};break;
   case 'statuses': yield {id,title:'Estado de '+(label(data.type)||'Nexus'),at:data.createdAt,user:data.userId||data.uid||data.owner||data.senderId};break;
   case 'notices': yield {id,title:label(data.title)||'Aviso oficial',context:label(data.category),at:data.publishedAt};break;
   case 'reports': yield {id,title:'Mensaje reportado',context:label(data.type),at:data.at,user:data.targetId};break;
  }
 }
}

export default function MetricDetails({db,rtdb,metric,title,total,asOf,onClose}:{db:Firestore;rtdb:Database;metric:DetailKey;title:string;total:number|null;asOf:number;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 const [rows,setRows]=useState<Row[]>([]),[busy,setBusy]=useState(true),[more,setMore]=useState(true),[error,setError]=useState('');
 const loadRef=useRef<()=>void>(()=>{});
 const [retry,setRetry]=useState(0);
 useEffect(()=>{
  const element=dialog.current;
  element?.showModal();
  return()=>element?.close();
 },[]);
 useEffect(()=>{
  const controller=new AbortController(),iterator=detailRows(db,rtdb,metric,asOf,controller.signal);
  const people=new Map<string,Promise<string>>();
  let loading=false,lookahead:Row|undefined;
  function resolveName(uid:string){
   if(!people.has(uid))people.set(uid,getDoc(doc(db,'users',uid)).then(profile=>label(profile.data()?.nombre,profile.data()?.username)||'Cuenta sin perfil').catch(()=>'Cuenta sin perfil'));
   return people.get(uid)!;
  }
  async function load(){
   if(loading||controller.signal.aborted)return;
   loading=true;setBusy(true);
   try{
    const batch:Row[]=lookahead?[lookahead]:[];
    while(batch.length<batchSize){
     const result=await iterator.next();if(result.done)break;
     batch.push(result.value);
    }
    const next=await iterator.next();
    lookahead=next.done?undefined:next.value;
    const named=await Promise.all(batch.map(async row=>{
     const name=typeof row.user==='string'&&row.user?await resolveName(row.user):'';
     return metric==='active'?{...row,title:name||row.title}:{...row,context:[row.context,name].filter(Boolean).join(' · ')};
    }));
    if(controller.signal.aborted)return;
    setRows(previous=>[...previous,...named]);setMore(!next.done);
   }catch{if(!controller.signal.aborted)setError('No se pudo cargar la lista. Comprueba el acceso y vuelve a intentarlo.');}
   finally{loading=false;if(!controller.signal.aborted)setBusy(false);}
  }
  loadRef.current=()=>void load();
  setRows([]);setMore(true);setError('');void load();
  return()=>{controller.abort();void iterator.return(undefined).catch(()=>{});};
 },[db,rtdb,metric,asOf,retry]);
 return <dialog ref={dialog} className="metric-dialog" aria-labelledby="metric-detail-title" onCancel={event=>{event.preventDefault();onClose();}} onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
  <div className="metric-dialog-content">
   <header><div><span className="badge">DETALLE DEL RESUMEN</span><h2 id="metric-detail-title">{title}</h2></div>
    <button type="button" className="secondary metric-close" aria-label="Cerrar detalle" autoFocus onClick={onClose}><X size={20}/></button></header>
   <p>{total===null?'Recuento anterior sin datos':num.format(total)+' en el último resumen'} · {num.format(rows.length)} en la lista</p>
   {rows.length>0&&<ul>{rows.map(row=><li key={row.id}><strong>{row.title}</strong><small>{[row.context,formatDate(row.at)].filter(Boolean).join(' · ')}</small></li>)}</ul>}
   {busy&&<p role="status">Cargando registros…</p>}
   {!busy&&!error&&!rows.length&&<p>No hay registros para mostrar.</p>}
   {error&&<div role="alert"><p>{error}</p><button type="button" className="secondary" onClick={()=>setRetry(n=>n+1)}>Reintentar</button></div>}
   {more&&!busy&&!error&&<button type="button" className="secondary icon-action" onClick={()=>loadRef.current()}><ChevronDown size={16}/> Cargar más</button>}
  </div>
 </dialog>;
}
