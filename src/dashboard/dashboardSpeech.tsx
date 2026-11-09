import {useEffect,useRef,useState} from 'react';
import {Square,Volume2} from 'lucide-react';
import TransientNotice from './TransientNotice';
import {playSpanish} from '../features/spanishSpeech';

export function SpeakAnswer({text,compact=false}:{text:string;compact?:boolean}){
 const [state,setState]=useState<'idle'|'preparing'|'playing'>('idle'),[error,setError]=useState('');
 const cancel=useRef<(()=>void)|null>(null);
 useEffect(()=>{const stop=()=>{cancel.current?.();cancel.current=null;};window.addEventListener('nexus:stop-assistant-speech',stop);return()=>{window.removeEventListener('nexus:stop-assistant-speech',stop);stop();};},[]);
 function toggle(){
  if(state!=='idle'){cancel.current?.();cancel.current=null;return;}
  setError('');cancel.current=playSpanish(text,setState,()=>setError('No se pudo reproducir la respuesta. Vuelve a intentarlo.'));
 }
 return <div className="dashboard-voice-control">
  <button type="button" className={compact?'dashboard-ai-composer-icon dashboard-ai-speaker':'secondary icon-action'} aria-label={state!=='idle'?'Detener lectura':'Escuchar respuesta'} title={state!=='idle'?'Detener lectura':'Escuchar respuesta'} disabled={!text} onClick={toggle}>
   {state!=='idle'?<Square size={15}/>:<Volume2 size={17}/>} {!compact&&(state!=='idle'?'Detener lectura':'Escuchar respuesta')}
  </button>
  <TransientNotice message={error} onClose={()=>setError('')}/>
 </div>;
}
