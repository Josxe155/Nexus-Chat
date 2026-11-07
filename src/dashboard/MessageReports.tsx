import {useEffect,useState} from 'react';
import {collection,limit,onSnapshot,orderBy,query,type Firestore,type Timestamp} from 'firebase/firestore';

type Report={id:string;chatId:string;messageId:string;targetId:string;content:string;fileName:string;type:string;at?:Timestamp};

export default function MessageReports({db}:{db:Firestore}){
 const [open,setOpen]=useState(false),[reports,setReports]=useState<Report[]|null>(null),[error,setError]=useState(false);
 useEffect(()=>{
  if(!open)return;
  setReports(null);
  setError(false);
  return onSnapshot(query(collection(db,'messageReports'),orderBy('at','desc'),limit(20)),
   snapshot=>setReports(snapshot.docs.map(item=>({...item.data(),id:item.id} as Report))),
   ()=>setError(true));
 },[db,open]);
 return <section className="dashboard-message-reports">
  <h2>Reportes de mensajes</h2>
  <p>Revisa el contenido reportado y los datos del mensaje desde el panel privado.</p>
  <button type="button" aria-expanded={open} onClick={()=>setOpen(!open)}>{open?'Cerrar reportes':'Ver reportes recientes'}</button>
  {open&&(error?<p role="alert">No se pudieron cargar los reportes.</p>:reports===null?<p role="status">Cargando reportes…</p>:reports.length===0?<p>Todavía no hay mensajes reportados.</p>:reports.map(report=><details key={report.id}>
   <summary>{report.at?.toDate().toLocaleString('es-EC')} · {report.type}</summary>
   <p className="reported-content">{report.content||'Mensaje sin texto'}</p>
   {report.fileName&&<p>Archivo · {report.fileName}</p>}
   <small>Remitente · {report.targetId}<br/>Conversación · {report.chatId}<br/>Mensaje · {report.messageId}</small>
  </details>))}
 </section>;
}
