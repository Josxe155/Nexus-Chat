import {useEffect,useRef,useState} from 'react';
import {collection,getCountFromServer,getDocs,query,where,orderBy,limit,startAfter,Timestamp,type Firestore,type QueryDocumentSnapshot} from 'firebase/firestore';
import {get,ref,type Database} from 'firebase/database';
import {Activity,ArrowUpRight,CheckCheck,Download,Flag,HardDrive,Layers,MessageCircle,Phone,RefreshCw,Users,X} from 'lucide-react';
import MetricDetails,{isDelivered,type DetailKey} from './MetricDetails';

type Metrics={
 users:number|null;visitors:number|null;active:number|null;messages:number|null;delivered:number|null;
 calls:number|null;activeCalls:number|null;files:number|null;bytes:number|null;chats:number|null;
 groups:number|null;channels:number|null;communities:number|null;statuses:number|null;notices:number|null;reports:number|null;
 days:{label:string;count:number}[];types:Record<string,number>;
};
export type OverviewSnapshot={metrics:Metrics;updatedAt:number;asOf:number};
const formatDay=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Guayaquil',year:'numeric',month:'2-digit',day:'2-digit'});
const axis=new Intl.DateTimeFormat('es-EC',{timeZone:'UTC',day:'numeric',month:'short'});
const dayLabel=(day:string)=>axis.format(new Date(day+'T12:00:00Z'));
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

export async function loadOverview(db:Firestore,rtdb:Database,signal:AbortSignal,onProgress:(text:string)=>void,now=Date.now()):Promise<Metrics>{
 checkAbort(signal);
 const count=async(name:string)=> (await getCountFromServer(collection(db,name))).data().count;
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
     if(isDelivered(data,participants))delivered++;
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
 const [detail,setDetail]=useState<DetailKey>(),[selectedDay,setSelectedDay]=useState<string>();
 useEffect(()=>{
  const asOf=Date.now();
  const controller=new AbortController();request.current=controller;setBusy(true);setCancelled(false);setStatus('');setError('');
  loadOverview(db,rtdb,controller.signal,text=>{if(!controller.signal.aborted)setStatus(text);},asOf).then(metrics=>{
   if(controller.signal.aborted)return;
   const next={metrics,updatedAt:Date.now(),asOf};setSnapshot(next);onData(next);
  }).catch(()=>{if(!controller.signal.aborted)setError('No se pudieron cargar las estadísticas. Vuelve a intentarlo.');})
   .finally(()=>{if(!controller.signal.aborted)setBusy(false);if(request.current===controller)request.current=null;});
  return()=>controller.abort();
 },[db,rtdb,refresh,onData]);
 const data=snapshot?.metrics;
 const cards=data?[
  ['users',Users,'Cuentas registradas',data.users],['active',Activity,'Usuarios activos · 7 días',data.active],
  ['messages',MessageCircle,'Mensajes conservados',data.messages],['delivered',CheckCheck,'Mensajes con entrega',data.delivered],
  ['calls',Phone,'Llamadas registradas',data.calls],['files',HardDrive,'Archivos registrados',data.files],
  ['groups',Layers,'Grupos',data.groups],['channels',Layers,'Canales',data.channels],['communities',Layers,'Comunidades',data.communities],
  ['statuses',MessageCircle,'Estados guardados',data.statuses],['notices',MessageCircle,'Avisos oficiales',data.notices],['reports',Flag,'Reportes de mensajes',data.reports],
 ] as const:[];
 const opened=cards.find(card=>card[0]===detail);
 const day=data?.days.find(value=>value.label===selectedDay)||data?.days.at(-1);
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
  <div className="metric-grid">{cards.map(([key,Icon,label,value])=><button type="button" key={key} className="metric-card" aria-haspopup="dialog" onClick={()=>setDetail(key)}>
   <span className="metric-icon"><Icon size={20}/></span><ArrowUpRight className="metric-arrow" size={16}/><small>{label}</small><strong>{numberLabel(value)}</strong>
  </button>)}</div>
  {opened&&snapshot&&<MetricDetails key={opened[0]} db={db} rtdb={rtdb} metric={opened[0]} title={opened[2]} total={opened[3]} asOf={snapshot.asOf} onClose={()=>setDetail(undefined)}/>}
  {data?.days.length? <div className="overview-charts"><section><div className="chart-heading"><h3>Mensajes por día</h3><small>Del {dayLabel(data.days[0].label)} al {dayLabel(data.days.at(-1)!.label)} · hora de Ecuador</small></div>
   {day&&<p className="chart-day" aria-live="polite"><strong>{dayLabel(day.label)}</strong> · {number.format(day.count)} {day.count===1?'mensaje':'mensajes'}</p>}
   <div className="activity-chart" aria-label="Últimos 14 días, de izquierda a derecha">
    {data.days.map(d=><button type="button" key={d.label} title={dayLabel(d.label)+' · '+d.count} aria-label={dayLabel(d.label)+': '+d.count+' mensajes'} aria-pressed={day?.label===d.label} onClick={()=>setSelectedDay(d.label)}><span style={{height:(d.count/Math.max(1,...data.days.map(v=>v.count))*100)+'%'}}/></button>)}
   </div>
   <div className="chart-axis"><span>{dayLabel(data.days[0].label)}</span><span>{dayLabel(data.days[6].label)}</span><span>{dayLabel(data.days.at(-1)!.label)}</span></div></section><section><h3>Contenido compartido</h3>{Object.entries(data.types).map(([type,value])=><div className="type-row" key={type}><span>{typeLabels[type]}</span><div><i style={{width:value/Math.max(1,data.messages??0)*100+'%'}}/></div><strong>{value}</strong></div>)}
   <p className="storage-summary">{data.bytes===null?'Espacio sin datos':(data.bytes/1048576).toFixed(2)+' MB registrados'} · {numberLabel(data.activeCalls)} salas abiertas</p></section></div>:null}
  <p className="metrics-footnote">Los recuentos corresponden al contenido conservado. Las visitas identificadas solo incluyen cuentas con actividad registrada. Las llamadas cuentan salas.</p>
 </div>;
}
