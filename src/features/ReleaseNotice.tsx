import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {RefreshCw,X} from 'lucide-react';
import {voiceSnapshot} from './voicePlayback';
import {downloadUpdate,savedUpdateBytes,validateRelease,type Release} from './updateDownload';
import './release-notice.css';

export function updateBlocked(){return voiceSnapshot().playing||!!document.querySelector('.nexus-call-screen,.nexus-voice-recorder,.capture-dialog,.status-reference-overlay,[aria-modal="true"]')||Array.from(document.querySelectorAll<HTMLInputElement|HTMLTextAreaElement>('textarea,input[type="password"],input[type="email"],input[type="text"]')).some(input=>!!input.value.trim());}
const pendingKey='nexus-pending-release';
const currentVersion=()=>document.querySelector<HTMLMetaElement>('meta[name="nexus-release"]')?.content||'';
function restorePending(){try{const saved=JSON.parse(localStorage.getItem(pendingKey)||'null');if(saved?.base===currentVersion()&&saved.release?.id!==currentVersion()){validateRelease(saved.release);return saved.release as Release;}}catch{}return undefined;}
export default function ReleaseManager(){
 const [release,setRelease]=useState<Release|undefined>(restorePending),[open,setOpen]=useState(false),[dismissed,setDismissed]=useState(false),[busy,setBusy]=useState(false),[cancelling,setCancelling]=useState(false),[complete,setComplete]=useState(false),[loaded,setLoaded]=useState(0),[error,setError]=useState(''),[checked,setChecked]=useState(false),[checkingView,setCheckingView]=useState(false);
 const download=useRef<AbortController|null>(null),checkRequest=useRef<AbortController|null>(null),checkRef=useRef<()=>Promise<void>>(async()=>{}),alive=useRef(true);
 useEffect(()=>{let live=true;alive.current=true;const current=currentVersion();let request:AbortController|undefined;
  const check=async()=>{if(checkRequest.current||download.current||document.visibilityState!=='visible')return;setCheckingView(true);const controller=new AbortController();request=controller;checkRequest.current=controller;const timer=setTimeout(()=>controller.abort(),15000);
   try{const response=await fetch('/release.json?check='+Date.now(),{cache:'no-store',signal:controller.signal});if(!response.ok)throw Error();const data=await response.json();validateRelease(data);if(!live||download.current)return;
    setError('');if(data.id!==current){const bytes=await savedUpdateBytes(data).catch(()=>0);if(!live||download.current)return;setRelease(previous=>{if(previous?.id!==data.id)setDismissed(false);return data;});setLoaded(bytes);try{localStorage.setItem(pendingKey,JSON.stringify({base:current,release:data}));}catch{}document.documentElement.dataset.nexusUpdate='pending';
    }else{setRelease(undefined);try{localStorage.removeItem(pendingKey);}catch{}delete document.documentElement.dataset.nexusUpdate;}setChecked(true);
   }catch{if(live){setChecked(false);setError('No se pudo comprobar la versión. Revisa tu conexión y vuelve a intentarlo.');}}
   finally{clearTimeout(timer);if(checkRequest.current===controller){checkRequest.current=null;if(live)setCheckingView(false);}}
  };
  checkRef.current=check;void check();const timer=setInterval(check,60000),show=()=>{setOpen(true);setDismissed(false);void check();};
  window.addEventListener('nexus:show-update',show);window.addEventListener('focus',check);window.addEventListener('online',check);window.addEventListener('pageshow',check);document.addEventListener('visibilitychange',check);
  return()=>{live=false;alive.current=false;request?.abort();if(checkRequest.current===request)checkRequest.current=null;download.current?.abort();clearInterval(timer);window.removeEventListener('nexus:show-update',show);window.removeEventListener('focus',check);window.removeEventListener('online',check);window.removeEventListener('pageshow',check);document.removeEventListener('visibilitychange',check);};
 },[]);
 useEffect(()=>{if(!release)return;document.documentElement.dataset.nexusUpdate='pending';let live=true;void savedUpdateBytes(release).then(bytes=>{if(live&&!download.current)setLoaded(bytes);}).catch(()=>{});return()=>{live=false;};},[release?.id]);
 const apply=async()=>{if(!release||download.current)return;if(updateBlocked()){setError('Termina la llamada o guarda y cierra lo que estés editando antes de actualizar.');return;}
  const controller=new AbortController();download.current=controller;setBusy(true);setComplete(false);setCancelling(false);setError('');
  try{await downloadUpdate(release,controller.signal,bytes=>{if(alive.current)setLoaded(bytes);});const timeout=setTimeout(()=>controller.abort(),15000);let latest:Release;
   try{const response=await fetch('/release.json?verify='+Date.now(),{cache:'no-store',signal:controller.signal});if(!response.ok)throw Error('No se pudo verificar la versión descargada. Reintenta cuando tengas conexión.');latest=await response.json();validateRelease(latest);}finally{clearTimeout(timeout);}
   if(latest.id!==release.id)throw Error('Hay una versión más reciente. Pulsa Buscar actualizaciones.');if(updateBlocked())throw Error('Los archivos están preparados. Guarda lo que estés editando y vuelve a pulsar Actualizar.');if(!alive.current)return;
   setComplete(true);await new Promise(resolve=>setTimeout(resolve,700));if(controller.signal.aborted)throw new DOMException('Cancelado','AbortError');const target=new URL(location.href);target.searchParams.set('nexus-update',release.id);location.replace(target.href);
  }catch(e){if(alive.current){setError(controller.signal.aborted?'Descarga pausada. El avance está guardado para continuar.':e instanceof Error?e.message:'No se pudo actualizar.');setBusy(false);setComplete(false);}}
  finally{download.current=null;if(alive.current)setCancelling(false);}
 };
 let notice;
 if(!release){if(!open)return null;notice=<aside className="release-update-banner release-info nexus-update-notice" role="status"><div className="release-copy"><strong>{checkingView?'Comprobando actualizaciones…':checked?'Ya tienes la versión actual':'No se pudo comprobar la actualización'}</strong>{error&&<small role="alert">{error}</small>}</div><div className="release-actions"><button disabled={checkingView} onClick={()=>void checkRef.current()}>Buscar actualizaciones</button><button onClick={()=>{setOpen(false);setError('');}} aria-label="Cerrar actualizaciones"><X/></button></div></aside>;
 }else if(dismissed&&!open){notice=<button className="release-update-reopen nexus-update-reopen" onClick={()=>{setDismissed(false);setOpen(true);}}>Actualización pendiente · Actualizar</button>;
 }else{const version=typeof release.version==="string"&&/^\d{2}\.\d+(?:\.\d+)?$/.test(release.version)?release.version:null;const total=validateRelease(release),mb=(n:number)=>(n/1048576).toFixed(2),percent=total?Math.min(100,loaded/total*100):0;
  notice=<aside className={'release-update-banner release-resumable nexus-update-notice'+(busy?' release-download-panel':'')} role="status"><span className="release-orbit" aria-hidden="true"><RefreshCw/></span><div className="release-copy"><strong>{complete?'Descarga completada':busy?'Descargando actualización':loaded?'Actualización pausada':'Tienes una actualización pendiente'}</strong><small>{version&&'Versión '+version+' · '}{mb(loaded)+' / '+mb(total)+' MB de archivos · '+percent.toFixed(1)+' %'}</small><progress aria-label="Descarga de actualización" max={total||1} value={loaded}/>{error&&<small role="alert">{error}</small>}</div><div className="release-actions">{busy?<button className="release-cancel" disabled={cancelling} onClick={()=>{setCancelling(true);download.current?.abort();}}>{cancelling?'Guardando avance…':'Cancelar descarga'}</button>:<><button onClick={()=>void apply()}>{loaded?'Continuar descarga':'Actualizar'}</button>{error&&<button disabled={checkingView} onClick={()=>void checkRef.current()}>Buscar actualizaciones</button>}<button aria-label="Cerrar aviso de actualización" onClick={()=>{setDismissed(true);setOpen(false);}}>Cerrar</button></>}</div></aside>;
 }
 return createPortal(notice,document.body);
}
