import type {ReactNode,RefObject} from 'react';
import {useEffect,useRef,useState} from 'react';
import {Download,FileText,Sparkles,X} from 'lucide-react';
import {version} from '../webVersion.json';
import {metricRows,saveDashboardFile,type OverviewSnapshot} from './Overview';

const dateLabel=(value:number)=>new Date(value).toLocaleString('es-EC',{timeZone:'America/Guayaquil',dateStyle:'medium',timeStyle:'short'});
type PlanStatus={enabled:boolean;dueAt?:number};

function formatInput(snapshot:OverviewSnapshot,plan?:PlanStatus){
 return {
  version:'v'+version,
  datosDel:dateLabel(snapshot.updatedAt)+' (Ecuador)',
  metricas:Object.fromEntries(metricRows(snapshot.metrics)),
  mensajesPorDia:snapshot.metrics.days,
  tiposDeMensaje:snapshot.metrics.types,
  limpieza:{plan:!plan?'Sin comprobar':plan.enabled?'Activo':'Pausado',proximaFecha:plan?.enabled&&plan.dueAt?dateLabel(plan.dueAt):null},
 };
}

function localReport(data:ReturnType<typeof formatInput>){
 return ['# 📊 Informe de Nexus Chat '+data.version,'','**Datos del '+data.datosDel+'**','','## Actividad de la comunidad',
  ...Object.entries(data.metricas).map(([label,value])=>'- **'+label+'** · '+(value===null?'Sin datos':value.toLocaleString('es-EC'))),
  '', '## 🧹 Mantenimiento','- **Plan mensual** · '+data.limpieza.plan,
  ...(data.limpieza.proximaFecha?['- **Próxima fecha** · '+data.limpieza.proximaFecha]:[]),
 ].join('\n');
}

function formatted(value:string):ReactNode[]{
 const chunks=value.split(/(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|`[^`]+`)/g);
 return chunks.map((chunk,i)=>{
  if(chunk.startsWith('***')&&chunk.endsWith('***'))return <strong key={i}><em>{chunk.slice(3,-3)}</em></strong>;
  if(/^(\*\*|__)/.test(chunk)&&/(\*\*|__)$/.test(chunk)&&chunk.length>4)return <strong key={i}>{chunk.slice(2,-2)}</strong>;
  if(/^([*_]).+\1$/.test(chunk))return <em key={i}>{chunk.slice(1,-1)}</em>;
  if(chunk.charCodeAt(0)===96&&chunk.at(-1)?.charCodeAt(0)===96)return <code key={i}>{chunk.slice(1,-1)}</code>;
  return chunk.replace(/[\x60*]+/g,'');
 });
}

function ReportPreview({text,element}:{text:string;element:RefObject<HTMLElement|null>}){
 const lines=text.split(/\r?\n/),blocks:ReactNode[]=[];
 const list=/^\s*(?:[-*+]\s+|\d+[.)]\s+)/;
 for(let i=0;i<lines.length;i++){
  const line=lines[i].trim();
  if(!line||/^(?:[-*_]\s*){3,}$/.test(line)||/^\x60{3}/.test(line))continue;
  const heading=/^#{1,6}\s+(.+?)(?:\s+#+)?$/.exec(line);
  if(heading){blocks.push(<h3 key={i}>{formatted(heading[1])}</h3>);continue;}
  if(list.test(line)){
   const start=i,items:ReactNode[]=[];
   for(;i<lines.length&&list.test(lines[i]);i++)items.push(<li key={i}>{formatted(lines[i].replace(list,''))}</li>);
   i--;blocks.push(<ul key={start}>{items}</ul>);continue;
  }
  blocks.push(<p key={i}>{formatted(line.replace(/^>\s*/,''))}</p>);
 }
 return <article ref={element} className="report-preview report-narrative" aria-label="Vista previa del informe">{blocks}</article>;
}

export default function DashboardReport({snapshot,plan}:{snapshot?:OverviewSnapshot;plan?:PlanStatus}){
 const [report,setReport]=useState<{text:string;source:'ia'|'datos';at:number}>();
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const controller=useRef<AbortController|null>(null);
 const reportElement=useRef<HTMLElement>(null);
 useEffect(()=>()=>{controller.current?.abort();controller.current=null;},[]);

 async function generate(){
  if(!snapshot||controller.current)return;
  const input=formatInput(snapshot,plan);
  const request=new AbortController();
  controller.current=request;
  const deadline=setTimeout(()=>request.abort('timeout'),45000);
  setBusy(true);setMessage('');
  try{
   const {assistant}=await import('../features/staticServices');
   request.signal.throwIfAborted();
   const {text}=await assistant([{role:'user',content:[
    'Escribe un informe narrativo de Nexus Chat en español claro, de unas 250 a 350 palabras. Devuelve Markdown, sin envolverlo en un bloque de código.',
    'Abre con un título y un párrafo de resumen ejecutivo que explique la actividad observada. Continúa con secciones breves y párrafos redactados, conectando cifras relevantes. Cierra con una observación basada en los datos.',
    'Usa negrita para unas pocas cifras clave y emojis discretos en encabezados. Evita tablas, listados de todas las métricas y encabezados vacíos.',
    'Incluye actividad, moderación, almacenamiento y mantenimiento. Usa solo las cifras proporcionadas; null significa sin datos.',
    'No inventes causas, tendencias, registros, personas ni recomendaciones de borrado. Distingue recuentos y datos no disponibles.',
    JSON.stringify(input),
   ].join('\n')}],request.signal);
   request.signal.throwIfAborted();
   setReport({text,source:'ia',at:snapshot.updatedAt});
  }catch{
   if(controller.current===request&&(!request.signal.aborted||request.signal.reason==='timeout')){
    setReport({text:localReport(input),source:'datos',at:snapshot.updatedAt});
    setMessage('La IA no respondió. Se preparó un informe con las cifras verificadas.');
   }
  }finally{
   clearTimeout(deadline);
   if(controller.current===request){controller.current=null;setBusy(false);}
  }
 }

 return <section className="panel-card" aria-labelledby="dashboard-report-heading">
  <div className="panel-title"><div><span className="badge"><FileText size={15}/> INFORMES</span><h2 id="dashboard-report-heading">Guardar informe</h2></div></div>
  <p>Genera un resumen de actividad, moderación, almacenamiento y mantenimiento a partir de la última lectura del panel. Nexus AI recibe solo cifras agregadas, fechas y el estado del plan.</p>
  {!snapshot&&<p className="notice">Carga las estadísticas en Resumen para preparar el informe.</p>}
  <div className="actions">
   <button type="button" className="icon-action" disabled={!snapshot||busy} onClick={()=>void generate()}><Sparkles size={17}/> {busy?'Generando informe…':'Generar con Nexus AI'}</button>
   {busy&&<button type="button" className="secondary icon-action" onClick={()=>{
    controller.current?.abort();setMessage('Generación cancelada.');
   }}><X size={17}/> Cancelar</button>}
   <button type="button" className="secondary" disabled={!snapshot||busy} onClick={()=>{
    if(snapshot){setReport({text:localReport(formatInput(snapshot,plan)),source:'datos',at:snapshot.updatedAt});setMessage('');}
   }}>Preparar informe de datos</button>
   <button type="button" className="secondary icon-action" disabled={!report||busy} onClick={()=>{
    if(reportElement.current)saveDashboardFile(
     '<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Informe · Nexus Chat</title><style>body{font:16px/1.7 system-ui,sans-serif;color:#192731;margin:32px auto;padding:0 18px;max-width:750px}h3{color:#1d584a;line-height:1.3}strong{color:#102f2a}</style><body>'+reportElement.current.outerHTML+'</body></html>',
     'nexus-informe.html','text/html;charset=utf-8'
    );
   }}><Download size={17}/> Descargar informe</button>
  </div>
  {message&&<p className="notice" role="status">{message}</p>}
  {report&&<><p className="metrics-updated">{report.source==='ia'?'Informe generado con Nexus AI':'Informe de datos'} · Lectura del {dateLabel(report.at)} (Ecuador)</p><ReportPreview text={report.text} element={reportElement}/></>}
 </section>;
}
