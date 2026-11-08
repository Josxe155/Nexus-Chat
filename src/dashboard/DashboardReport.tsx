import {useEffect,useRef,useState} from 'react';
import {Download,FileText,Sparkles,X} from 'lucide-react';
import {version} from '../webVersion.json';
import {metricRows,saveDashboardFile,type OverviewSnapshot} from './Overview';

const dateLabel=(value:number)=>new Date(value).toLocaleString('es-EC',{timeZone:'America/Guayaquil',dateStyle:'medium',timeStyle:'short'});
type PlanStatus={enabled:boolean;dueAt?:number};

function formatInput(snapshot:OverviewSnapshot,plan?:PlanStatus){
 return {
  version:'V'+version,
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

function bold(text:string){
 return text.split(/(\*\*[^*]+\*\*)/).map((part,index)=>part.startsWith('**')&&part.endsWith('**')
  ? <strong key={index}>{part.slice(2,-2)}</strong> : part);
}

function ReportPreview({text}:{text:string}){
 return <article className="report-preview" aria-label="Vista previa del informe">{text.split(/\r?\n/).filter(line=>line.trim()&&line.trim()!=='---').map((line,index)=>{
  if(/^#{1,6}\s/.test(line))return <h3 key={index}>{bold(line.replace(/^#{1,6}\s+/,''))}</h3>;
  return <p key={index}>{bold(line.replace(/^[-*]\s+/,'• '))}</p>;
 })}</article>;
}

export default function DashboardReport({snapshot,plan}:{snapshot?:OverviewSnapshot;plan?:PlanStatus}){
 const [report,setReport]=useState<{text:string;source:'ia'|'datos';at:number}>();
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const controller=useRef<AbortController|null>(null);
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
    'Redacta un informe operativo de Nexus Chat en español claro, con secciones Markdown, viñetas, negrita y emojis discretos.',
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
    if(report)saveDashboardFile(report.text,'nexus-informe.md','text/markdown;charset=utf-8');
   }}><Download size={17}/> Descargar informe</button>
  </div>
  {message&&<p className="notice" role="status">{message}</p>}
  {report&&<><p className="metrics-updated">{report.source==='ia'?'Informe generado con Nexus AI':'Informe de datos'} · Lectura del {dateLabel(report.at)} (Ecuador)</p><ReportPreview text={report.text}/></>}
 </section>;
}
