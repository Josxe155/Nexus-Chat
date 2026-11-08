import {useEffect,useRef,useState} from 'react';
import {collection,getCountFromServer,getDocs,query,where,orderBy,limit,startAfter,Timestamp,type Firestore,type QueryDocumentSnapshot} from 'firebase/firestore';
import {get,ref,type Database} from 'firebase/database';
import {Activity,CheckCheck,Download,Flag,HardDrive,Layers,MessageCircle,Phone,RefreshCw,Users,X} from 'lucide-react';

type Metrics={
 users:number|null;visitors:number|null;active:number|null;messages:number|null;delivered:number|null;
 calls:number|null;activeCalls:number|null;files:number|null;bytes:number|null;chats:number|null;
 groups:number|null;channels:number|null;communities:number|null;statuses:number|null;notices:number|null;reports:number|null;
 days:{label:string;count:number}[];types:Record<string,number>;
};
export type OverviewSnapshot={metrics:Metrics;updatedAt:number};
const formatDay=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Guayaquil',year:'numeric',month:'2-digit',day:'2-digit'});
const number=new Intl.NumberFormat('es-EC');
const numberLabel=(value:number|null)=>value===null?'—':number.format(value);
const typeLabels:Record<string,string>={text:'Texto',image:'Imágenes',audio:'Audio',video:'Video',document:'Documentos',other:'Otros'};
const checkAbort=(signal:AbortSignal)=>{if(signal.aborted)throw new DOMException('Cancelado','AbortError');};

export function metricRows(data:Metrics):[string,number|null][]{
 return [
  ['Cuentas registradas',data.users],['Usuarios con visitas registradas',data.visitors],['Usuarios activos en 7 días',data.active],
  ['Conversaciones y canales',data.chats],['Grupos',data.groups],['Canales',data.channels],['Comunidades',data.communities],
  ['Mensajes conservados',data.messages],['Mensajes con entrega confirmada',data.delivered],['Estados guardados',data.statuses],
  ['Llamadas registradas',data.calls],['Salas abiertas',data.activeCalls],['Archivos registrados',data.files],
  ['Bytes registrados',data.bytes],['Avisos oficiales',data.notices],['Reportes de mensajes',data.reports],
 ];
}
export function overviewCSV(data:Metrics,updatedAt:number){
 const rows=[['Métrica','Valor'],['Actualizado (UTC)',new Date(updatedAt).toISOString()],
  ...metricRows(data).map(([label,value])=>[label,value??'Sin datos']),
  [],['Fecha (Ecuador)','Mensajes'],...data.days.map(d=>[d.label,d.count])];
 return '\ufeff'+rows.map(row=>row.map(value=>'"'+String(value).replaceAll('"','""')+'"').join(',')).join('\r\n');
}

export function saveDashboardFile(contents:string,name:string,type:string){
 const url=URL.createObjectURL(new Blob([contents],{type}));
 const a=document.createElement('a');a.href=url;a.download=name;a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}

export async function loadOverview(db:Firestore,rtdb:Database,signal:AbortSignal,onProgress:(text:string)=>void):Promise<Metrics>{
 checkAbort(signal);
 const now=Date.now(),count=async(name:string)=> (await getCountFromServer(collection(db,name))).data().count;
 const attempts=await Promise.allSettled([
  count('users'),count('dashboardVisits'),getCountFromServer(query(collection(db,'dashboardVisits'),where('lastVisitAt','>=',Timestamp.fromMillis(now-7*86400000)))).then(r=>r.data().count),
  count('communities'),count('statuses'),count('officialNotices'),count('messageReports'),
  getDocs(collection(db,'chats')),get(ref(rtdb,'calls')),
 ]);
 checkAbort(signal);
 const value=<T,>(result:PromiseSettledResult<T>)=>result.status==='fulfilled'?result.value:null;
 const [users,visitors,active,communities,statuses,notices,reports,chats,calls]=attempts;
 const m:Metrics={users:value(users),visitors:value(visitors),active:value(active),communities:value(communities),statuses:value(statuses),
  notices:value(notices),reports:value(reports),chats:null,groups:null,channels:null,messages:null,delivered:null,calls:null,activeCalls:null,
  files:null,bytes:null,days:[],types:{}};

 async function collectMessages(){
  const rows=value(chats)?.docs;
  if(!rows)return;
  m.chats=rows.length;
  m.groups=rows.filter(chat=>chat.data().kind==='group').length;
  m.channels=rows.filter(chat=>chat.data().kind==='channel').length;
  const days=Array.from({length:14},(_,i)=>({label:formatDay.format(now-(13-i)*86400000),count:0}));
  const buckets=new Map(days.map(d=>[d.label,d]));
  const types={text:0,image:0,audio:0,video:0,document:0,other:0};
  let messages=0,delivered=0;
  for(const chat of rows){
   const participants=chat.data().participants;
   let cursor:QueryDocumentSnapshot|undefined;
   for(;;){
    checkAbort(signal);
    const result=await getDocs(query(collection(db,'chats',chat.id,'messages'),orderBy('timestamp'),...(cursor?[startAfter(cursor)]:[]),limit(200)));
    checkAbort(signal);
    for(const document of result.docs){
     const data=document.data();
     if(data.deletedAt)continue;
     messages++;
     if(Array.isArray(participants)&&participants.some((id:string)=>id!==data.senderId&&(data.receivedBy?.[id]||data.readBy?.[id])))delivered++;
     const bucket=typeof data.timestamp==='number'&&Math.abs(data.timestamp)<=8.64e15?buckets.get(formatDay.format(data.timestamp)):undefined;
     if(bucket)bucket.count++;
     const kind=Object.hasOwn(types,data.type)?data.type as keyof typeof types:'other';
     types[kind]++;
    }
    onProgress(number.format(messages)+' mensajes revisados');
    if(result.size<200)break;
    cursor=result.docs.at(-1);
   }
  }
  Object.assign(m,{messages,delivered,types,days});
 }

 async function collectFiles(){
  let cursor:QueryDocumentSnapshot|undefined,files=0,bytes=0;
  for(;;){
   checkAbort(signal);
   const rows=await getDocs(query(collection(db,'mediaFiles'),orderBy('createdAt'),...(cursor?[startAfter(cursor)]:[]),limit(200)));
   checkAbort(signal);
   for(const document of rows.docs){
    files++;
    const size=Number(document.data().size);
    if(Number.isFinite(size)&&size>0)bytes+=size;
   }
   if(rows.size<200)break;
   cursor=rows.docs.at(-1);
  }
  Object.assign(m,{files,bytes});
 }

 const callRows=value(calls);
 if(callRows){
  let total=0,opened=0;
  callRows.forEach(row=>{
   const call=row.val();
   if(call&&typeof call==='object'&&call.mode!=='file'){
    total++;
    if(!call.closed&&call.expiresAt>now)opened++;
   }
  });
  m.calls=total;
  m.activeCalls=opened;
 }
 await Promise.allSettled([collectMessages(),collectFiles()]);
 checkAbort(signal);
 if(metricRows(m).every(([,value])=>value===null))throw Error('No se pudieron consultar las estadísticas.');
 return m;
}

export default function Overview({db,rtdb,onData}:{db:Firestore;rtdb:Database;onData:(snapshot:OverviewSnapshot)=>void}){
 const [snapshot,setSnapshot]=useState<OverviewSnapshot>(),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [status,setStatus]=useState(''),[refresh,setRefresh]=useState(0),[cancelled,setCancelled]=useState(false);
 const request=useRef<AbortController|null>(null);
 useEffect(()=>{
  const controller=new AbortController();request.current=controller;setBusy(true);setCancelled(false);setStatus('');setError('');
  loadOverview(db,rtdb,controller.signal,text=>{if(!controller.signal.aborted)setStatus(text);}).then(metrics=>{
   if(controller.signal.aborted)return;
   const next={metrics,updatedAt:Date.now()};setSnapshot(next);onData(next);
  }).catch(()=>{if(!controller.signal.aborted)setError('No se pudieron cargar las estadísticas. Vuelve a intentarlo.');})
   .finally(()=>{if(!controller.signal.aborted)setBusy(false);if(request.current===controller)request.current=null;});
  return()=>controller.abort();
 },[db,rtdb,refresh,onData]);
 const data=snapshot?.metrics;
 const cards=data?[
  [Users,'Cuentas registradas',data.users],[Activity,'Usuarios activos · 7 días',data.active],
  [MessageCircle,'Mensajes conservados',data.messages],[CheckCheck,'Mensajes con entrega',data.delivered],
  [Phone,'Llamadas registradas',data.calls],[HardDrive,'Archivos registrados',data.files],
  [Layers,'Grupos',data.groups],[Layers,'Canales',data.channels],[Layers,'Comunidades',data.communities],
  [MessageCircle,'Estados guardados',data.statuses],[MessageCircle,'Avisos oficiales',data.notices],[Flag,'Reportes de mensajes',data.reports],
 ] as const:[];
 return <div className="dashboard-overview">
  <div className="overview-heading"><div><span className="badge">ACTIVIDAD DE NEXUS</span><h2>Actividad de la comunidad</h2></div>
   <div className="overview-tools">
    <button className="secondary icon-action" disabled={busy} onClick={()=>setRefresh(n=>n+1)}><RefreshCw size={17}/>Actualizar datos</button>
    {busy&&<button className="secondary icon-action" onClick={()=>{request.current?.abort();setBusy(false);setCancelled(true);}}><X size={17}/>Detener lectura</button>}
    <button className="secondary icon-action" disabled={!snapshot||busy} onClick={()=>{if(snapshot)saveDashboardFile(overviewCSV(snapshot.metrics,snapshot.updatedAt),'nexus-estadisticas.csv','text/csv;charset=utf-8');}}><Download size={17}/>Descargar estadísticas</button>
   </div></div>
  {snapshot&&<p className="metrics-updated">Última lectura · {new Date(snapshot.updatedAt).toLocaleString('es-EC',{timeZone:'America/Guayaquil'})} · Ecuador</p>}
  {cancelled&&<p role="status">Lectura detenida. Puedes actualizarla cuando quieras.</p>}
  {busy&&<p role="status">{status||'Preparando estadísticas…'}</p>}
  {error&&<p role="alert">{error}</p>}
  {data&&metricRows(data).some(([,value])=>value===null)&&<p className="notice" role="status">Algunas fuentes no respondieron. Las métricas sin datos aparecen con —.</p>}
  <div className="metric-grid">{cards.map(([Icon,label,value])=><section key={label} className="metric-card"><span className="metric-icon"><Icon size={20}/></span><small>{label}</small><strong>{numberLabel(value)}</strong></section>)}</div>
  {data?.days.length? <div className="overview-charts"><section><div className="chart-heading"><h3>Mensajes · últimos 14 días</h3><small>Hora de Ecuador</small></div>
   <div className="activity-chart" role="img" aria-label={'Mensajes diarios: '+data.days.map(d=>d.label+': '+d.count).join(', ')}>
    {data.days.map(d=><div key={d.label} title={d.label+' · '+d.count}><span style={{height:(d.count/Math.max(1,...data.days.map(v=>v.count))*100)+'%'}}/><small>{d.label.slice(-2)}</small></div>)}
   </div></section><section><h3>Contenido compartido</h3>{Object.entries(data.types).map(([type,value])=><div className="type-row" key={type}><span>{typeLabels[type]}</span><div><i style={{width:value/Math.max(1,data.messages??0)*100+'%'}}/></div><strong>{value}</strong></div>)}
   <p className="storage-summary">{data.bytes===null?'Espacio sin datos':(data.bytes/1048576).toFixed(2)+' MB registrados'} · {numberLabel(data.activeCalls)} salas abiertas</p></section></div>:null}
  <p className="metrics-footnote">Los recuentos corresponden al contenido conservado. Las visitas identificadas solo incluyen cuentas con actividad registrada. Las llamadas cuentan salas.</p>
 </div>;
}
