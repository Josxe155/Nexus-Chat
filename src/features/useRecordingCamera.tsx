import {useEffect,useRef,useState,type RefObject} from 'react';
import {SwitchCamera} from 'lucide-react';
import './recording-camera.css';
import {captureConstraints} from './DeviceSettings';
import {RecordingCamera,recordingCameraError} from './recordingCamera';
import type {CameraFacing} from './callCamera';
export function useRecordingCamera(preview:RefObject<HTMLVideoElement|null>){
 const controller=useRef<RecordingCamera|undefined>(undefined),requested=useRef<CameraFacing|undefined>(undefined),lock=useRef(false),mounted=useRef(true);
 const [busy,setBusy]=useState(false),[facing,setFacing]=useState<CameraFacing>('user'),[error,setError]=useState('');
 const release=()=>{controller.current?.close();controller.current=undefined;};
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;release();};},[]);
 useEffect(()=>{if(!error)return;const timer=setTimeout(()=>setError(''),3000);return()=>clearTimeout(timer);},[error]);
 const open=async()=>{
  if(lock.current)return false;lock.current=true;setBusy(true);setError('');
  const camera=new RecordingCamera(()=>preview.current);release();controller.current=camera;
  try{const ready=await camera.open(captureConstraints(true),requested.current);if(ready&&mounted.current)setFacing(camera.facing);return ready&&mounted.current;}
  catch(cause){camera.close();if(controller.current===camera)controller.current=undefined;if(mounted.current)setError(['NotFoundError','OverconstrainedError','NotAllowedError','SecurityError'].includes((cause as Error)?.name)?recordingCameraError(cause):'No se pudo abrir la cámara. Permite usar la cámara y el micrófono y abre Nexus en su dirección publicada.');return false;}
  finally{lock.current=false;if(mounted.current)setBusy(false);}
 };
 const flip=async()=>{
  if(lock.current)return;setError('');
  if(controller.current&&!controller.current.active){setError('La cámara ya no está disponible. Detén y revisa el video antes de volver a intentarlo.');return;}
  if(!controller.current){requested.current=facing==='user'?'environment':'user';setFacing(requested.current);return;}
  lock.current=true;setBusy(true);const camera=controller.current;
  try{await camera.flip();if(mounted.current){requested.current=camera.facing;setFacing(camera.facing);}}
  catch(cause){if(mounted.current)setError(recordingCameraError(cause));}
  finally{lock.current=false;if(mounted.current)setBusy(false);}
 };
 return {open,flip,release,busy,facing,error,stream:()=>controller.current?.recordingStream()};
}
export function RecordingCameraSwitch({facing,busy,onClick}:{facing:CameraFacing;busy:boolean;onClick:()=>void}){
 const label=facing==='user'?'Cambiar a cámara trasera':'Cambiar a cámara frontal';
 return <button type="button" className="recording-camera-switch" aria-label={label} aria-busy={busy} title={label} disabled={busy} onClick={onClick}><SwitchCamera aria-hidden="true"/></button>;
}
