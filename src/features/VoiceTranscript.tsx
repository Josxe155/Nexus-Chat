import {useAutoTranscript} from './TranscriptPreferences';
import {useEffect,useRef,useState} from 'react';import config from '../public-services.json';import {auth} from '../firebase';
import {useMobileBack} from './useMobileBack';
import {isPrivateMedia,previewMedia} from './mediaTransfer';
export async function transcribeAudio(src:string,language:string,signal:AbortSignal){
 if(!auth.currentUser)throw Error('Inicia sesión para continuar.');if(!['','es','en','pt','fr','de','it'].includes(language))throw Error('Selecciona un idioma válido.');
 const audio=await fetch(src,{signal});if(!audio.ok)throw Error('No se pudo cargar el audio.');const blob=await audio.blob();if(!blob.size||blob.size>20*1024**2)throw Error('El audio debe ocupar hasta 20 MB.');
 const data=new FormData();data.append('file',blob,'nota.'+(blob.type.includes('mp4')?'m4a':blob.type.includes('ogg')?'ogg':blob.type.includes('wav')?'wav':'webm'));data.append('model','whisper-large-v3-turbo');data.append('response_format','json');if(language)data.append('language',language);
 const response=await fetch('https://api.groq.com/openai/v1/audio/transcriptions',{method:'POST',headers:{Authorization:'Bearer '+config.groq},body:data,signal});if(!response.ok)throw Error('La transcripción no está disponible ahora. Inténtalo más tarde.');const result=await response.json();if(typeof result.text!=='string'||result.text.length>50000)throw Error('No se obtuvo una transcripción válida.');return result.text.trim()||'No se detectó voz en este audio.';
}
export function VoiceTranscriptDialog({src,onClose}:{src:string;onClose:()=>void}){
 const [text,setText]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const request=useRef<AbortController>(null);
 useMobileBack(true,onClose,85);
 useEffect(()=>()=>request.current?.abort(),[]);
 const start=async()=>{
  if(request.current)return;
  const controller=new AbortController();
  request.current=controller;
  setBusy(true);
  setError('');
  try{
   const uid=auth.currentUser?.uid;
   if(!uid)throw Error('Inicia sesión para continuar.');
   const source=isPrivateMedia(src)?await previewMedia(src,uid):src;
   if(controller.signal.aborted)return;
   const value=await transcribeAudio(source,'',AbortSignal.any([controller.signal,AbortSignal.timeout(65000)]));
   if(!controller.signal.aborted)setText(value);
  }catch(cause){
   if(!controller.signal.aborted)setError(cause instanceof Error?cause.message:'No se pudo transcribir el audio.');
  }finally{
   request.current=null;
   if(!controller.signal.aborted)setBusy(false);
  }
 };
 return <div className="feature-backdrop"><section className="feature-dialog conversation-tool" role="dialog" aria-modal="true" aria-label="Transcripción del audio">
  <h2>Transcripción del audio</h2>
  {text?<p>{text}</p>:<p>Si continúas, Nexus AI procesará este audio. La transcripción se muestra solo aquí.</p>}
  {error&&<p role="alert">{error}</p>}
  <div className="feature-actions"><button onClick={onClose}>{text?'Cerrar':'Cancelar'}</button>{!text&&<button disabled={busy} onClick={()=>void start()}>{busy?'Transcribiendo…':'Transcribir'}</button>}</div>
 </section></div>;
}
const transcripts=new Map<string,Promise<string>>();
export default function VoiceTranscript({src}:{src:string}){
 const enabled=useAutoTranscript(),host=useRef<HTMLDivElement>(null);const [visible,setVisible]=useState(false),[text,setText]=useState(''),[error,setError]=useState('');
 useEffect(()=>{const observer=new IntersectionObserver(entries=>setVisible(entries.some(entry=>entry.isIntersecting)));if(host.current)observer.observe(host.current);return()=>observer.disconnect();},[]);
 useEffect(()=>{let live=true;setText('');setError('');if(!enabled||!visible||!src)return;const key=(auth.currentUser?.uid||'')+':'+src;let request=transcripts.get(key);if(!request){request=transcribeAudio(src,'',AbortSignal.timeout(65000));transcripts.set(key,request);request.catch(()=>transcripts.delete(key));if(transcripts.size>100)transcripts.delete(transcripts.keys().next().value!);}request.then(value=>{if(live)setText(value);}).catch(()=>{if(live)setError('No se pudo transcribir este audio.');});return()=>{live=false;};},[src,enabled,visible]);
 return <div ref={host} className="voice-transcription">{enabled&&(text?<details open><summary>Transcripción</summary><p>{text}</p></details>:error?<small role="status">{error}</small>:visible?<small role="status">Transcribiendo…</small>:null)}</div>;
}
