import DownloadMeter from '../features/DownloadMeter';
import type {DownloadProgress} from '../features/resumableVoice';
import {useEffect,useRef,useState,type RefObject} from 'react';
import {Square,Volume2,LoaderCircle} from 'lucide-react';
import {playSpanish} from '../features/spanishSpeech';
import TransientNotice from './TransientNotice';

export default function ReportVoice({report,disabled}:{report:RefObject<HTMLElement|null>;disabled:boolean}){
 const [progress,setProgress]=useState<number>();
 const [bytes,setBytes]=useState<DownloadProgress>();
 const [state,setState]=useState<'idle'|'preparing'|'playing'>('idle'),[error,setError]=useState('');
 const active=useRef<(()=>void)|null>(null);
 const release=()=>{active.current?.();active.current=null;};
 useEffect(()=>{window.addEventListener('nexus:stop-assistant-speech',release);return()=>{window.removeEventListener('nexus:stop-assistant-speech',release);release();};},[]);
 useEffect(()=>{if(disabled){release();setError('');setProgress(undefined);setBytes(undefined);}},[disabled]);
 function listen(){
  if(state!=='idle'){release();return;}
  const content=report.current?.innerText.split(/\n+/).map(line=>line.trim()).filter(Boolean).map(line=>/[.!?]$/.test(line)?line:line+'.').join(' ');
  if(!content)return;
  setError('');setProgress(undefined);setBytes(undefined);active.current=playSpanish(content,setState,()=>setError('No se pudo preparar la voz a tiempo o reproducir el informe. La descarga guardada puede continuar al reintentar.'),setProgress,setBytes);
 }
 return <div className="dashboard-voice-control report-voice-control">
  <button type="button" className="secondary icon-action" title={state==='preparing'?'Preparando la voz. La primera lectura necesita descargar el modelo. Pulsa para cancelar.':undefined} disabled={disabled} onClick={listen}>
   {state==='idle'?<><Volume2 size={17}/> Escuchar informe</>:state==='preparing'?<><LoaderCircle size={16} className="animate-spin"/> {progress!==undefined?'Descargando voz '+progress+' %':'Preparando audio'} · Cancelar</>:<><Square size={16}/> Detener lectura</>}
  </button>
  {state==='preparing'&&<DownloadMeter progress={bytes}/>}
  <TransientNotice message={error} onClose={()=>setError('')}/>
 </div>;
}
