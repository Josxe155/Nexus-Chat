import {useEffect,useRef,useState} from 'react';
import {X,Camera,Video,Square,Send,RotateCcw} from 'lucide-react';
import {useRecordingCamera,RecordingCameraSwitch} from './useRecordingCamera';
export default function CameraCapture({onClose,onSend,onVideo}:{onVideo?:()=>void;onClose:()=>void;onSend:(file:File,type:'image'|'video')=>Promise<void>}){
 const [state,setState]=useState<'idle'|'live'|'recording'|'review'|'sending'>('idle'),[error,setError]=useState(''),[seconds,setSeconds]=useState(0),[captured,setCaptured]=useState<{blob:Blob;url:string;type:'image'|'video'}>(),[ready,setReady]=useState(false);
 const preview=useRef<HTMLVideoElement>(null),recorder=useRef<MediaRecorder|undefined>(undefined),chunks=useRef<Blob[]>([]),url=useRef(''),mounted=useRef(true),sending=useRef(false);
 const camera=useRecordingCamera(preview);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;if(recorder.current){recorder.current.onstop=null;if(recorder.current.state!=='inactive')recorder.current.stop();}URL.revokeObjectURL(url.current);};},[]);
 useEffect(()=>{if(!error)return;const timer=setTimeout(()=>setError(''),3000);return()=>clearTimeout(timer);},[error]);
 useEffect(()=>{if(state!=='recording')return;const id=setInterval(()=>setSeconds(s=>s+1),1000);return()=>clearInterval(id);},[state]);
 useEffect(()=>{if(seconds>=60&&recorder.current?.state==='recording')recorder.current.stop();},[seconds]);
 const start=async()=>{setError('');setReady(false);if(await camera.open())setState('live');};
 const review=(blob:Blob,type:'image'|'video')=>{
  camera.release();if(!mounted.current)return;setReady(false);
  if(!blob.size){setError('No se pudo guardar la captura. Vuelve a intentarlo.');setState('idle');return;}
  URL.revokeObjectURL(url.current);url.current=URL.createObjectURL(blob);setCaptured({blob,url:url.current,type});setState('review');
 };
 const record=()=>{
  if(camera.busy||recorder.current&&recorder.current.state!=='inactive')return;
  try{const media=camera.stream();if(!media)throw Error('camera-missing');const next=new MediaRecorder(media);recorder.current=next;chunks.current=[];
   next.ondataavailable=event=>{if(event.data.size)chunks.current.push(event.data);};next.onstop=()=>review(new Blob(chunks.current,{type:next.mimeType}),'video');
   next.onerror=()=>{if(mounted.current)setError('La grabación se interrumpió. Revisa el video antes de enviarlo.');};next.start(1000);setSeconds(0);setState('recording');
  }catch{camera.release();setReady(false);setState('idle');setError('Este navegador no permite grabar video con la cámara seleccionada.');}
 };
 return <div className="feature-backdrop"><section className="feature-dialog capture-dialog" role="dialog" aria-modal="true" aria-label="Cámara">
  <button type="button" className="dialog-close" disabled={sending.current} aria-label="Cerrar cámara" onClick={onClose}><X/></button><h2>Comparte lo que ves.</h2>
  {state==='idle'&&<><button type="button" disabled={camera.busy} onClick={()=>void start()}>Activar cámara</button>{onVideo&&<button type="button" disabled={camera.busy} onClick={onVideo}>Grabar video instantáneo</button>}</>}
  <video ref={preview} hidden={state==='idle'||!!captured} autoPlay muted playsInline onCanPlay={()=>setReady(true)}/>
  {captured&&(captured.type==='image'?<img src={captured.url} alt="Vista previa de la foto"/>:<video src={captured.url} controls playsInline/>)}
  {state==='recording'&&<p role="status">Grabando · {seconds} / 60 s</p>}{(error||camera.error)&&<p role="alert">{error||camera.error}</p>}
  <div className="feature-actions">
   {['idle','live','recording'].includes(state)&&<RecordingCameraSwitch facing={camera.facing} busy={camera.busy} onClick={()=>void camera.flip()}/>}
   {state==='live'&&<><button type="button" disabled={!ready||camera.busy} onClick={()=>{const video=preview.current;if(!video?.videoWidth)return;const canvas=document.createElement('canvas');canvas.width=video.videoWidth;canvas.height=video.videoHeight;canvas.getContext('2d')!.drawImage(video,0,0);canvas.toBlob(blob=>{if(blob)review(blob,'image');},'image/jpeg',0.9);}}><Camera/>Tomar foto</button><button type="button" disabled={!ready||camera.busy} onClick={record}><Video/>Grabar video</button></>}
   {state==='recording'&&<button type="button" onClick={()=>{if(recorder.current?.state==='recording')recorder.current.stop();}}><Square/>Detener y revisar</button>}
   {state==='review'&&captured&&<><button type="button" onClick={()=>{URL.revokeObjectURL(url.current);url.current='';setCaptured(undefined);setState('idle');}}><RotateCcw/>Repetir</button><button type="button" onClick={async()=>{if(sending.current)return;sending.current=true;setState('sending');try{const ext=captured.type==='image'?'jpg':captured.blob.type.includes('mp4')?'mp4':'webm';await onSend(new File([captured.blob],`captura-${Date.now()}.${ext}`,{type:captured.blob.type}),captured.type);if(mounted.current)onClose();}catch(cause){if(mounted.current){setError(cause instanceof Error?cause.message:'No se pudo enviar.');setState('review');}}finally{sending.current=false;}}}><Send/>Enviar captura</button></>}
  </div>
 </section></div>;
}
