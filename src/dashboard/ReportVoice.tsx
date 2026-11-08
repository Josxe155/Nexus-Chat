import {useEffect,useRef,useState,type RefObject} from 'react';
import {Square,Volume2} from 'lucide-react';

type Playback={context:AudioContext;worker?:Worker};

export default function ReportVoice({report,disabled}:{report:RefObject<HTMLElement|null>;disabled:boolean}){
 const [state,setState]=useState<'idle'|'preparing'|'playing'>('idle');
 const [error,setError]=useState('');
 const active=useRef<Playback|null>(null);

 function release(){
  const playback=active.current;
  if(!playback)return;
  active.current=null;
  playback.worker?.terminate();
  void playback.context.close().catch(()=>{});
 }
 useEffect(()=>release,[]);
 useEffect(()=>{if(disabled){release();setState('idle');setError('');}},[disabled]);

 async function listen(){
  if(active.current){release();setState('idle');return;}
  const content=report.current?.innerText.replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\uFE0F\u200D]/gu,'')
   .split(/\n+/).map(line=>line.trim()).filter(Boolean).map(line=>/[.!?]$/.test(line)?line:line+'.').join(' ');
  if(!content)return;
  setError('');
  let playback:Playback|undefined;
  const failed=()=>{
   if(playback&&active.current!==playback)return;
   release();setState('idle');setError('No se pudo reproducir el informe. Vuelve a intentarlo.');
  };
  try{
   const context=new AudioContext();
   playback={context};active.current=playback;
   const current=playback;
   setState('preparing');
   await context.resume();
   if(active.current!==current)return;
   const worker=new Worker(new URL('./reportVoice.worker.ts',import.meta.url),{type:'module'});
   current.worker=worker;
   worker.onerror=failed;
   worker.onmessage=async(event:MessageEvent<ArrayBuffer|null>)=>{
    if(active.current!==current)return;
    worker.terminate();current.worker=undefined;
    if(!event.data){failed();return;}
    try{
     const buffer=await context.decodeAudioData(event.data);
     if(active.current!==current)return;
     const source=context.createBufferSource();
     source.buffer=buffer;
     source.connect(context.destination);
     source.onended=()=>{
      if(active.current!==current)return;
      release();setState('idle');
     };
     source.start();setState('playing');
    }catch{failed();}
   };
   worker.postMessage(content);
  }catch{failed();}
 }

 return <>
  <button type="button" className="secondary icon-action" disabled={disabled} onClick={()=>void listen()}>
   {state==='idle'?<><Volume2 size={17}/> Escuchar informe</>:<><Square size={16}/> Detener lectura</>}
  </button>
  {state==='preparing'&&<span role="status">Preparando audio…</span>}
  {error&&<span role="alert">{error}</span>}
 </>;
}
