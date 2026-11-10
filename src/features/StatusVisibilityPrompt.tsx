import {useEffect,useRef,useState} from 'react';
import {SettingsDialog} from './MobileSettingsControls';
// Layout and flow: WhatsApp Help Center 1508707852886383, Android illustration.
export default function StatusVisibilityPrompt({name,hidden,onConfirm,onClose}:{name:string;hidden:boolean;onConfirm:()=>Promise<void>;onClose:()=>void}){
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),lock=useRef(false);
 useEffect(()=>{if(!error)return;const timer=setTimeout(()=>setError(''),3000);return()=>clearTimeout(timer);},[error]);
 const close=()=>{if(!lock.current)onClose();};
 return <SettingsDialog title={'¿Quieres '+(hidden?'mostrar':'ocultar')+' los estados de '+name+'?'} onClose={close} actions={<><button disabled={busy} onClick={close}>Cancelar</button><button disabled={busy} onClick={async()=>{if(lock.current)return;lock.current=true;setBusy(true);try{await onConfirm();onClose();}catch{setError('No se pudo cambiar la visibilidad del estado.');}finally{lock.current=false;setBusy(false);}}}>{hidden?'Mostrar':'Ocultar'}</button></>}><p>{hidden?'Los nuevos estados de '+name+' aparecerán en las actualizaciones recientes.':'Los nuevos estados de '+name+' ya no aparecerán en las actualizaciones recientes.'}</p>{error&&<p role="alert">{error}</p>}</SettingsDialog>;
}
