import {useEffect,useRef,useState} from 'react';
import {Mic,Square,Volume2} from 'lucide-react';
import {collectDictation} from '../features/dictationResults';
import {playSpanish} from '../features/spanishSpeech';

type RecognitionResult={isFinal:boolean;0:{transcript:string}};
type Recognition={
 lang:string;continuous:boolean;interimResults:boolean;
 start():void;stop():void;abort():void;
 onresult:((event:{resultIndex:number;results:ArrayLike<RecognitionResult>})=>void)|null;
 onend:(()=>void)|null;
 onerror:((event:{error:string})=>void)|null;
};
type SpeechWindow=Window & {SpeechRecognition?:new()=>Recognition;webkitSpeechRecognition?:new()=>Recognition};
const recognitionConstructor=()=> (window as SpeechWindow).SpeechRecognition||(window as SpeechWindow).webkitSpeechRecognition;

export function DictateQuestion({disabled,onText,compact=false}:{disabled:boolean;onText:(text:string)=>void;compact?:boolean}){
 const active=useRef<Recognition|null>(null);
 const latestText=useRef(onText);latestText.current=onText;
 const [listening,setListening]=useState(false),[interim,setInterim]=useState(''),[error,setError]=useState('');
 function stop(){
  const recognition=active.current;
  active.current=null;
  if(recognition){
   recognition.onresult=null;recognition.onend=null;recognition.onerror=null;
   recognition.abort();
  }
 }
 useEffect(()=>stop,[]);
 useEffect(()=>{if(disabled){stop();setListening(false);setInterim('');}},[disabled]);
 function toggle(){
  if(active.current){active.current.stop();return;}
  const Constructor=recognitionConstructor();
  if(!Constructor){setError('El dictado no está disponible en este navegador.');return;}
  setError('');setInterim('');
  const recognition=new Constructor();
  recognition.lang='es-EC';recognition.continuous=true;recognition.interimResults=true;
  active.current=recognition;
  const collect=collectDictation();
  recognition.onresult=event=>{
   if(active.current!==recognition)return;
   const result=collect(event.resultIndex,event.results);
   if(result.text)latestText.current(result.text);
   setInterim(result.interim);
  };
  recognition.onerror=event=>{
   if(active.current!==recognition)return;
   stop();setListening(false);setInterim('');
   if(event.error!=='aborted')setError(event.error==='not-allowed'||event.error==='service-not-allowed'
    ?'Permite el micrófono y vuelve a intentar.':'No se pudo completar el dictado. Comprueba el micrófono y la conexión.');
  };
  recognition.onend=()=>{if(active.current===recognition){active.current=null;setListening(false);setInterim('');}};
  try{recognition.start();setListening(true);}
  catch{active.current=null;setError('No se pudo iniciar el micrófono.');}
 }
 return <div className="dashboard-voice-control">
  <button type="button" className={compact?'dashboard-ai-composer-icon':'secondary icon-action'} disabled={disabled} aria-label={listening?'Detener dictado':'Dictar pregunta'} title={listening?'Detener dictado':'Dictar pregunta'} aria-pressed={listening} onClick={toggle}>
   {listening?<Square size={15}/>:<Mic size={16}/>} {!compact&&(listening?'Detener dictado':'Dictar pregunta')}
  </button>
  {listening&&<span role="status">{interim||'Escuchando…'}</span>}
  {error&&<span role="alert">{error}</span>}
 </div>;
}

export function SpeakAnswer({text,compact=false}:{text:string;compact?:boolean}){
 const [state,setState]=useState<'idle'|'preparing'|'playing'>('idle'),[error,setError]=useState('');
 const cancel=useRef<(()=>void)|null>(null);
 useEffect(()=>()=>{cancel.current?.();cancel.current=null;},[text]);
 function toggle(){
  if(state!=='idle'){cancel.current?.();cancel.current=null;return;}
  setError('');cancel.current=playSpanish(text,setState,()=>setError('No se pudo reproducir la respuesta. Vuelve a intentarlo.'));
 }
 return <div className="dashboard-voice-control">
  <button type="button" className={compact?'dashboard-ai-composer-icon dashboard-ai-speaker':'secondary icon-action'} aria-label={state!=='idle'?'Detener lectura':'Escuchar respuesta'} title={state!=='idle'?'Detener lectura':'Escuchar respuesta'} disabled={!text} onClick={toggle}>
   {state!=='idle'?<Square size={15}/>:<Volume2 size={17}/>} {!compact&&(state!=='idle'?'Detener lectura':'Escuchar respuesta')}
  </button>
  {state==='preparing'&&<span role="status">Preparando audio…</span>}
  {error&&<span role="alert">{error}</span>}
 </div>;
}
