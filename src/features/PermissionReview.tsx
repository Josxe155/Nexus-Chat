import {useEffect,useState} from 'react';
import {createPortal} from 'react-dom';
import {Camera,Mic,Bell,MapPin,Check,Minus,LoaderCircle} from 'lucide-react';
import {useDesktopWeb} from './useDesktopWeb';

export const permissionRegistry=['microphone','camera','notifications','location'];
const version=permissionRegistry.join('|');
type PermissionState='granted'|'denied'|'unavailable';
const permissions=[
 {id:'microphone',label:'Micrófono',description:'Llamadas y notas de voz',Icon:Mic},
 {id:'camera',label:'Cámara',description:'Videollamadas y fotos',Icon:Camera},
 {id:'notifications',label:'Notificaciones',description:'Avisos de mensajes y llamadas',Icon:Bell},
 {id:'location',label:'Ubicación',description:'Solo al compartir tu ubicación',Icon:MapPin},
] as const;
export default function PermissionReview(){
 const desktop=useDesktopWeb(),[open,setOpen]=useState(()=>localStorage.getItem('nexus-permission-review')!==version),[busy,setBusy]=useState(false),[reviewed,setReviewed]=useState(false),[states,setStates]=useState<Record<string,PermissionState>>({});
 const update=(key:string,value:PermissionState)=>setStates(old=>({...old,[key]:value}));
 useEffect(()=>{const show=()=>{setOpen(true);setReviewed(false);};window.addEventListener('nexus:show-permissions',show);return()=>window.removeEventListener('nexus:show-permissions',show);},[]);
 const request=async()=>{
  if(busy)return;setBusy(true);const timer=setTimeout(()=>{setBusy(false);setReviewed(true);},30000);
  const capture=async(kind:'audio'|'video',key:string)=>{
   if(!navigator.mediaDevices?.getUserMedia){update(key,'unavailable');return;}
   try{const stream=await navigator.mediaDevices.getUserMedia({audio:kind==='audio',video:kind==='video'});stream.getTracks().forEach(track=>track.stop());update(key,'granted');}catch{update(key,'denied');}
  };
  const notify=async()=>{if(typeof Notification==='undefined'){update('notifications','unavailable');return;}try{update('notifications',await Notification.requestPermission()==='granted'?'granted':'denied');}catch{update('notifications','denied');}};
  const location=new Promise<void>(resolve=>{if(!navigator.geolocation){update('location','unavailable');resolve();return;}navigator.geolocation.getCurrentPosition(()=>{update('location','granted');resolve();},()=>{update('location','denied');resolve();},{timeout:10000,maximumAge:60000});});
  await Promise.all([capture('audio','microphone'),capture('video','camera'),notify(),location]);clearTimeout(timer);setReviewed(true);setBusy(false);
 };
 if(desktop||!open)return null;
 return createPortal(<section className="permission-review permission-review-polished" role="dialog" aria-modal="true" aria-label="Permisos de Nexus Chat"><div>
  <header className="permission-intro"><span className="permission-brand"><img src="/nexus-icon.svg?v=3" alt="" width="48" height="48"/></span><small>TODO LISTO PARA CONECTAR</small><h2>Prepara Nexus Chat</h2><p>Activa lo que necesitas para conversar, llamar y compartir.</p></header>
  <div className="permission-options">{permissions.map(({id,label,description,Icon})=><article key={id} data-permission={id} data-state={states[id]||'pending'}><span className="permission-kind"><Icon size={23}/></span><span className="permission-description"><strong>{label}</strong><small>{states[id]==='granted'?'Permitido':states[id]==='denied'?'No permitido · puedes cambiarlo en tu navegador':states[id]==='unavailable'?'No disponible en este navegador':description}</small></span><span className="permission-result" aria-label={states[id]==='granted'?'Permiso concedido':states[id]==='denied'?'Permiso no concedido':undefined}>{states[id]==='granted'?<Check size={18}/>:states[id]?<Minus size={18}/>:busy?<LoaderCircle size={18}/>:null}</span></article>)}</div>
  <div className="permission-buttons">{reviewed&&<button className="permission-primary" onClick={()=>{localStorage.setItem('nexus-permission-review',version);setOpen(false);}}>Continuar a Nexus Chat</button>}<button className={reviewed?'permission-secondary':'permission-primary'} onClick={()=>void request()} disabled={busy}>{busy?'Revisando permisos…':reviewed?'Revisar de nuevo':'Revisar permisos'}</button></div>
  <p className="permission-footnote">Tú decides qué permitir. Los mensajes de texto siguen disponibles aunque no concedas algún permiso. Las fotos se eligen al compartirlas.</p>
 </div></section>,document.body);
}
