import {useMobileBack} from './useMobileBack';
import {pauseVoice} from './voicePlayback';
import VoiceRecorder from './VoiceMessage';
export {AudioPlayer} from './VoiceMessage';
import {useRef,useState,useEffect} from 'react';
import {Video,Pause,Play,Square,Send,Trash2,X} from 'lucide-react';
import {useRecordingCamera,RecordingCameraSwitch} from './useRecordingCamera';
function VideoRecorder({onClose,onSend}:{mode:'audio'|'video';onClose:()=>void;onSend:(file:File,type:'audio'|'video-note')=>Promise<void>}){
 const starting=useRef(false),sending=useRef(false),recorder=useRef<MediaRecorder|undefined>(undefined),mounted=useRef(true),preview=useRef<HTMLVideoElement>(null),chunks=useRef<Blob[]>([]),url=useRef('');
 const [state,setState]=useState<'idle'|'recording'|'paused'|'review'|'sending'>('idle'),[seconds,setSeconds]=useState(0),[blob,setBlob]=useState<Blob>(),[error,setError]=useState('');
 const camera=useRecordingCamera(preview);
 useMobileBack(true,()=>{if(!sending.current&&!starting.current)onClose();},80);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;if(recorder.current){recorder.current.onstop=null;if(recorder.current.state!=='inactive')recorder.current.stop();}if(url.current)URL.revokeObjectURL(url.current);};},[]);
 useEffect(()=>{if(!error)return;const timer=setTimeout(()=>setError(''),3000);return()=>clearTimeout(timer);},[error]);
 useEffect(()=>{if(state!=='recording')return;const id=setInterval(()=>setSeconds(v=>v+1),1000);return()=>clearInterval(id);},[state]);
 useEffect(()=>{if(seconds>=60&&recorder.current?.state!=='inactive')recorder.current?.stop();},[seconds]);
 const start=async()=>{
  if(starting.current||camera.busy)return;starting.current=true;pauseVoice();setError('');
  try{if(!await camera.open())return;if(!mounted.current)return;const media=camera.stream();if(!media)throw Error('camera-missing');
   const next=new MediaRecorder(media);recorder.current=next;chunks.current=[];next.ondataavailable=event=>{if(event.data.size)chunks.current.push(event.data);};
   next.onstop=()=>{const data=new Blob(chunks.current,{type:next.mimeType});camera.release();if(!mounted.current)return;if(!data.size){setError('No se pudo guardar el video. Vuelve a intentarlo.');setState('idle');return;}URL.revokeObjectURL(url.current);url.current=URL.createObjectURL(data);setBlob(data);setState('review');};
   next.onerror=()=>{if(mounted.current)setError('La grabación se interrumpió. Revisa el video antes de enviarlo.');};next.start(1000);setSeconds(0);setState('recording');
  }catch{camera.release();if(mounted.current)setError('Este navegador no permite grabar video con la cámara seleccionada.');}finally{starting.current=false;}
 };
 return <div className="feature-backdrop"><section className="feature-dialog recorder-dialog" role="dialog" aria-modal="true" aria-label="Video instantáneo">
  <button type="button" disabled={state==='sending'} className="dialog-close" onClick={onClose} aria-label="Cerrar grabación"><X/></button><h2>Un momento en video.</h2><p>Hasta 60 segundos, en formato circular.</p>
  <video ref={preview} src={state==='review'?url.current:undefined} className="circular-video" autoPlay={state!=='review'} muted={state!=='review'} playsInline controls={state==='review'}/>
  <strong className="record-time">{Math.floor(seconds/60)}:{String(seconds%60).padStart(2,'0')}</strong>{(error||camera.error)&&<p role="alert" className="feature-error">{error||camera.error}</p>}
  <div className="feature-actions">
   {['idle','recording','paused'].includes(state)&&<RecordingCameraSwitch facing={camera.facing} busy={camera.busy} onClick={()=>void camera.flip()}/>}
   {state==='idle'&&<button type="button" disabled={camera.busy} onClick={()=>void start()}><Video/>Empezar</button>}
   {(state==='recording'||state==='paused')&&<><button type="button" onClick={()=>{if(state==='recording'){recorder.current?.pause();setState('paused');}else{recorder.current?.resume();setState('recording');}}}>{state==='recording'?<Pause/>:<Play/>}{state==='recording'?'Pausar':'Continuar'}</button><button type="button" onClick={()=>{if(recorder.current&&recorder.current.state!=='inactive')recorder.current.stop();}}><Square/>Revisar</button></>}
   {state==='review'&&<><button type="button" onClick={()=>{URL.revokeObjectURL(url.current);url.current='';setBlob(undefined);setState('idle');}}><Trash2/>Descartar</button><button type="button" onClick={async()=>{if(!blob||sending.current)return;sending.current=true;setState('sending');try{await onSend(new File([blob],`nota-${Date.now()}.${blob.type.includes('mp4')?'mp4':'webm'}`,{type:blob.type}),'video-note');if(mounted.current)onClose();}catch(cause){if(mounted.current){setError(cause instanceof Error?cause.message:'No se pudo enviar.');setState('review');}}finally{sending.current=false;}}}><Send/>Enviar</button></>}
   {state==='sending'&&<p>Enviando…</p>}
  </div>
 </section></div>;
}
export default function Recorder(props:{mode:'audio'|'video';onClose:()=>void;onSend:(file:File,type:'audio'|'video-note')=>Promise<void>}){return props.mode==='audio'?<VoiceRecorder onClose={props.onClose} onSend={props.onSend}/>:<VideoRecorder {...props}/>;}
