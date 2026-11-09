import {useEffect,useRef,useState} from 'react';
import {Mic,Square,Volume2} from 'lucide-react';

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
  recognition.onresult=event=>{
   if(active.current!==recognition)return;
   const final:string[]=[],draft:string[]=[];
   for(let i=event.resultIndex;i<event.results.length;i++){
    const result=event.results[i];
    (result.isFinal?final:draft).push(result[0].transcript);
   }
   if(final.length)onText(final.join(' ').trim());
   setInterim(draft.join(' ').trim());
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

function voiceSegments(text:string){
 const clean=text.replace(/https?:\/\/\S+/g,'enlace').replace(/[\p{Extended_Pictographic}#*`_]/gu,'').replace(/\s+/g,' ').trim();
 return clean.match(/.{1,180}(?:[.!?](?=\s|$)|\s|$)|.{1,180}/g)?.map(part=>part.trim()).filter(Boolean)||[];
}

export function SpeakAnswer({text,compact=false}:{text:string;compact?:boolean}){
 const [voices,setVoices]=useState<SpeechSynthesisVoice[]>([]),[playing,setPlaying]=useState(false),[error,setError]=useState('');
 const speech=useRef<SpeechSynthesisUtterance|null>(null);
 const generation=useRef(0);
 function stop(){
  generation.current++;
  if(speech.current){speech.current.onend=null;speech.current.onerror=null;window.speechSynthesis.cancel();speech.current=null;}
 }
 useEffect(()=>{
  const engine=window.speechSynthesis;
  if(!engine)return;
  const update=()=>setVoices(engine.getVoices());
  update();engine.addEventListener('voiceschanged',update);
  return()=>{stop();engine.removeEventListener('voiceschanged',update);};
 },[]);
 function toggle(){
  if(playing){stop();setPlaying(false);return;}
  const engine=window.speechSynthesis;
  if(!engine){setError('La lectura en voz alta no está disponible en este navegador.');return;}
  const spanish=engine.getVoices().filter(voice=>/^es(?:-|$)/i.test(voice.lang));
  const voice=spanish.find(value=>/google/i.test(value.name+' '+value.voiceURI)&&/es-(EC|US|MX)/i.test(value.lang))
   ||spanish.find(value=>/es-(EC|US|MX)/i.test(value.lang))||spanish[0];
  if(!voice){setError('Este navegador no ofrece una voz en español.');return;}
  setError('');
  const parts=voiceSegments(text),current=++generation.current;
  if(!parts.length)return;
  setPlaying(true);
  function speak(index:number){
   if(current!==generation.current)return;
   if(!parts[index]){speech.current=null;setPlaying(false);return;}
   const utterance=new SpeechSynthesisUtterance(parts[index]);
   utterance.voice=voice!;utterance.lang=voice!.lang;
   speech.current=utterance;
   utterance.onend=()=>speak(index+1);
   const failed=()=>{if(current===generation.current){stop();setPlaying(false);setError('No se pudo reproducir la respuesta.');}};
   utterance.onerror=failed;
   try{engine.speak(utterance);}catch{failed();}
  }
  speak(0);
 }
 const hasSpanish=voices.some(voice=>/^es(?:-|$)/i.test(voice.lang));
 return <div className="dashboard-voice-control">
  <button type="button" className={compact?'dashboard-ai-composer-icon dashboard-ai-speaker':'secondary icon-action'} aria-label={playing?'Detener lectura':'Escuchar respuesta'} title={playing?'Detener lectura':'Escuchar respuesta'} disabled={!text} onClick={toggle}>
   {playing?<Square size={15}/>:<Volume2 size={17}/>} {!compact&&(playing?'Detener lectura':'Escuchar respuesta')}
  </button>
  {text&&!playing&&!error&&voices.length>0&&!hasSpanish&&<small>Requiere una voz en español.</small>}
  {error&&<span role="alert">{error}</span>}
 </div>;
}
