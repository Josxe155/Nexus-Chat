import {useEffect,useRef,useState} from 'react';
import {Square,Volume2,LoaderCircle} from 'lucide-react';
import TransientNotice from './TransientNotice';
import {playSpanish} from '../features/spanishSpeech';

export function SpeakAnswer({text,compact=false}:{text:string;compact?:boolean}){
 const [progress,setProgress]=useState<number>();
 const [state,setState]=useState<'idle'|'preparing'|'playing'>('idle'),[error,setError]=useState('');
 const cancel=useRef<(()=>void)|null>(null);
 useEffect(()=>{const stop=()=>{cancel.current?.();cancel.current=null;};window.addEventListener('nexus:stop-assistant-speech',stop);return()=>{window.removeEventListener('nexus:stop-assistant-speech',stop);stop();};},[]);
 function toggle(){
  if(state!=='idle'){cancel.current?.();cancel.current=null;return;}
  setError('');setProgress(undefined);cancel.current=playSpanish(text,setState,()=>setError('No se pudo preparar la voz a tiempo o reproducir la respuesta. La descarga guardada puede continuar al reintentar.'),setProgress);
 }
 return <div className="dashboard-voice-control">
  <button type="button" className={compact?'dashboard-ai-composer-icon dashboard-ai-speaker':'secondary icon-action'} aria-label={state!=='idle'?'Detener lectura':'Escuchar respuesta'} title={state==='preparing'?'Preparando la voz'+(progress!==undefined?' '+progress+' %. ':'. ')+'La primera lectura necesita descargar el modelo. Pulsa para cancelar.':state==='playing'?'Detener lectura':'Escuchar respuesta'} disabled={!text} onClick={toggle}>
   {state==='preparing'?<LoaderCircle size={15} className="animate-spin"/>:state==='playing'?<Square size={15}/>:<Volume2 size={17}/>} {!compact&&(state!=='idle'?'Detener lectura':'Escuchar respuesta')}
  </button>
  <TransientNotice message={error} onClose={()=>setError('')}/>
 </div>;
}
