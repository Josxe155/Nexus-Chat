import {useEffect,useState} from 'react';
import {Flag,RefreshCw,Search} from 'lucide-react';
import {collection,getDocsFromServer,limit,orderBy,query,startAfter,type Firestore,type QueryDocumentSnapshot} from 'firebase/firestore';

const pageSize=20;
const types:Record<string,string>={text:'Texto',image:'Imagen',audio:'Audio',video:'Video',document:'Documento',sticker:'Sticker',contact:'Contacto','video-note':'Nota de video'};
const text=(value:unknown)=>typeof value==='string'?value:'';
function formatReportDate(value:unknown){
 const raw=value&&typeof value==='object'&&'toMillis' in value&&typeof value.toMillis==='function'?value.toMillis():value;
 if(typeof raw!=='number'&&typeof raw!=='string')return 'Fecha no registrada';
 const date=new Date(raw);
 return Number.isFinite(date.getTime())?date.toLocaleString('es-EC',{timeZone:'America/Guayaquil',dateStyle:'medium',timeStyle:'short'}):'Fecha no registrada';
}
type Report={id:string;kind:string;at:string;content:string;fileName:string;target:string;reporter:string;chat:string;message:string};
function readReport(item:QueryDocumentSnapshot):Report{
 const value=item.data();
 const type=text(value.type)||({user:'Contacto',group:'Grupo',channel:'Canal'} as Record<string,string>)[text(value.kind)]||'';
 return {id:item.id,kind:Object.hasOwn(types,type)?types[type]:type||'Otro',at:formatReportDate(value.at),content:text(value.content)||text(value.reason),
  fileName:text(value.fileName),target:text(value.targetId),reporter:text(value.reporter),chat:text(value.chatId),message:text(value.messageId)};
}

export default function MessageReports({db}:{db:Firestore}){
 const [category,setCategory]=useState<'messageReports'|'communityReports'>('messageReports');
 return <div className="dashboard-report-center"><h2>Centro de reportes</h2><div className="actions" aria-label="Tipos de reporte">
  <button type="button" className={category==='messageReports'?'':'secondary'} aria-pressed={category==='messageReports'} onClick={()=>setCategory('messageReports')}>Mensajes</button>
  <button type="button" className={category==='communityReports'?'':'secondary'} aria-pressed={category==='communityReports'} onClick={()=>setCategory('communityReports')}>Contactos, grupos y canales</button>
 </div><ReportList key={category} db={db} category={category}/></div>;
}
function ReportList({db,category}:{db:Firestore;category:'messageReports'|'communityReports'}){
 const conversations=category==='communityReports';
 const [reports,setReports]=useState<Report[]>([]),[cursor,setCursor]=useState<QueryDocumentSnapshot>(),[more,setMore]=useState(false);
 const [loading,setLoading]=useState(true),[error,setError]=useState(''),[search,setSearch]=useState('');
 const [load,setLoad]=useState<{after?:QueryDocumentSnapshot}>({});
 useEffect(()=>{
  let active=true;
  setLoading(true);
  setError('');
  const source=collection(db,category);
  const page=query(source,orderBy('at','desc'),...(load.after?[startAfter(load.after)]:[]),limit(pageSize+1));
  getDocsFromServer(page).then(result=>{
   if(!active)return;
   const rows=result.docs.slice(0,pageSize);
   setReports(previous=>load.after?[...previous,...rows.map(readReport)]:rows.map(readReport));
   setMore(result.size>pageSize);
   setCursor(rows.at(-1));
  }).catch((cause:unknown)=>{
   if(active)setError(cause&&typeof cause==='object'&&'code' in cause&&cause.code==='permission-denied'
    ?'Esta sesión no tiene permiso para consultar reportes. Comprueba el acceso de la cuenta.'
    :'No se pudieron consultar los reportes. Revisa la conexión y vuelve a intentarlo.');
  }).finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[db,load,category]);
 const term=search.trim().toLocaleLowerCase('es');
 const results=reports.filter(report=>[report.kind,report.content,report.fileName,report.target,report.reporter,report.chat,report.message]
  .some(value=>value.toLocaleLowerCase('es').includes(term)));
 return <section className="dashboard-message-reports panel-card" aria-labelledby="message-reports-heading">
  <div className="panel-title"><div><span className="badge"><Flag size={14}/> MODERACIÓN</span><h2 id="message-reports-heading">{conversations?'Reportes de contactos, grupos y canales':'Reportes de mensajes'}</h2></div>
   <button type="button" className="secondary icon-action" disabled={loading} onClick={()=>setLoad({})}><RefreshCw size={16}/> Actualizar</button></div>
  <p>Consulta el contenido reportado y sus referencias desde el panel privado.</p>
  <label className="report-search"><Search size={18}/><input type="search" placeholder="Buscar entre los reportes cargados" aria-label="Buscar reportes" value={search} onChange={e=>setSearch(e.target.value)}/></label>
  {loading&&<p role="status">Cargando reportes…</p>}
  {error&&<div className="feedback error" role="alert">{error} <button type="button" className="secondary" onClick={()=>setLoad({...load})}>Reintentar</button></div>}
  {!loading&&!error&&!reports.length&&<p className="empty-panel">Todavía no hay reportes de este tipo.</p>}
  {!!reports.length&&<p className="metrics-updated">{results.length} de {reports.length} reportes cargados</p>}
  {!loading&&!error&&!!reports.length&&!results.length&&<p className="empty-panel">La búsqueda no coincide con los reportes cargados.</p>}
  {results.map(report=><details key={report.id}>
   <summary><span>{report.kind}</span><time>{report.at}</time></summary>
   <p className="reported-content">{report.content||(conversations?'Motivo sin texto':'Mensaje sin texto')}</p>
   {report.fileName&&<p>Archivo · {report.fileName}</p>}
   <dl className="report-fields">{[['Reportado por',report.reporter],[conversations?'Reportado': 'Remitente',report.target],['Conversación',report.chat],['Mensaje',report.message]].map(([label,value])=>
    <div key={label}><dt>{label}</dt><dd>{value||'—'}</dd></div>)}</dl>
  </details>)}
  {more&&cursor&&<button type="button" className="secondary" disabled={loading} onClick={()=>setLoad({after:cursor})}>Cargar más reportes</button>}
 </section>;
}
