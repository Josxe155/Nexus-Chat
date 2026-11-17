import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {Camera,Mic,Bell,MapPin,Check,Minus,LoaderCircle,X} from 'lucide-react';
import {useDesktopWeb} from './useDesktopWeb';
import {reviewBrowserPermissions,type ReviewedPermissionState} from './browserPermissionReview';

export const permissionRegistry=['microphone','camera','notifications','location'];
let seenInMemory=false;
function alreadyIntroduced(){try{return seenInMemory||!!localStorage.getItem('nexus-permission-intro-seen')||!!localStorage.getItem('nexus-permission-review');}catch{return seenInMemory;}}
function rememberIntroduction(){seenInMemory=true;try{localStorage.setItem('nexus-permission-intro-seen','1');}catch{}}
type PermissionState=ReviewedPermissionState;
const permissions=[
 {id:'microphone',label:'Micrófono',description:'Llamadas y notas de voz',Icon:Mic},
 {id:'camera',label:'Cámara',description:'Videollamadas y fotos',Icon:Camera},
 {id:'notifications',label:'Notificaciones',description:'Avisos de mensajes y llamadas',Icon:Bell},
 {id:'location',label:'Ubicación',description:'Identificar tu país y compartir ubicación',Icon:MapPin},
] as const;
export default function PermissionReview(){
 const desktop=useDesktopWeb(),[open,setOpen]=useState(()=>!alreadyIntroduced()),[busy,setBusy]=useState(false),[reviewed,setReviewed]=useState(false),[slow,setSlow]=useState(false),[manual,setManual]=useState(false),[states,setStates]=useState<Record<string,PermissionState>>({});
 const active=useRef<AbortController|null>(null),generation=useRef(0);
 useEffect(()=>{if(open&&(!desktop||manual))rememberIntroduction();},[desktop,open,manual]);
 useEffect(()=>()=>{generation.current++;active.current?.abort();},[]);
 const close=()=>{generation.current++;active.current?.abort();active.current=null;setBusy(false);rememberIntroduction();setOpen(false);};
 useEffect(()=>{const show=()=>{generation.current++;active.current?.abort();setBusy(false);setSlow(false);setOpen(true);setManual(true);setReviewed(false);};window.addEventListener('nexus:show-permissions',show);return()=>window.removeEventListener('nexus:show-permissions',show);},[]);
 const request=async()=>{
  if(busy)return;active.current?.abort();const controller=new AbortController(),id=++generation.current;active.current=controller;setBusy(true);setSlow(false);
  const result=await reviewBrowserPermissions((key,value)=>{if(id===generation.current)setStates(old=>({...old,[key]:value}));},controller.signal);
  if(id!==generation.current)return;active.current=null;setReviewed(true);setSlow(result.timedOut);setBusy(false);
 };
 if((desktop&&!manual)||!open)return null;
 return createPortal(<section className="permission-review permission-review-polished" role="dialog" aria-modal="true" aria-label="Permisos de Nexus Chat"><div>
  <header className="permission-intro"><button type="button" className="permission-close" aria-label="Cerrar solicitud de permisos" onClick={close}><X size={20}/></button><span className="permission-brand"><img src="/nexus-icon.svg?v=4" alt="" width="48" height="48"/></span><small>TODO LISTO PARA CONECTAR</small><h2>Prepara Nexus Chat</h2><p>Activa lo que necesitas para conversar, llamar y compartir.</p></header>
  <div className="permission-options">{permissions.map(({id,label,description,Icon})=><article key={id} data-permission={id} data-state={states[id]||'pending'}><span className="permission-kind"><Icon size={23}/></span><span className="permission-description"><strong>{label}</strong><small>{states[id]==='granted'?'Permitido':states[id]==='denied'?'No permitido · puedes cambiarlo en tu navegador':states[id]==='unavailable'?'No disponible en este navegador':states[id]==='waiting'?'Sin respuesta todavía · puedes volver a intentarlo':description}</small></span><span className="permission-result" aria-label={states[id]==='granted'?'Permiso concedido':states[id]==='denied'?'Permiso no concedido':undefined}>{states[id]==='granted'?<Check size={18}/>:states[id]?<Minus size={18}/>:busy?<LoaderCircle size={18}/>:null}</span></article>)}</div>
  {slow&&<p className="permission-recovery" role="status">La revisión está tardando. Puedes volver a intentar o continuar y activar los permisos cuando los necesites.</p>}
  <div className="permission-buttons">{reviewed&&!slow?<><button className="permission-primary" onClick={close}>Continuar a Nexus Chat</button><button className="permission-secondary" onClick={()=>void request()} disabled={busy}>{busy?'Revisando permisos…':'Volver a intentar'}</button></>:<><button className="permission-primary" onClick={()=>void request()} disabled={busy}>{busy?'Revisando permisos…':reviewed?'Volver a intentar':'Revisar permisos'}</button><button className="permission-secondary" onClick={close}>{busy?'Cerrar y continuar':reviewed?'Continuar a Nexus Chat':'Continuar sin revisar'}</button></>}</div>
  <p className="permission-footnote">Tú decides qué permitir. Los mensajes de texto siguen disponibles aunque no concedas algún permiso. Las fotos se eligen al compartirlas.</p>
 </div></section>,document.body);
}
