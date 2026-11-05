import {useEffect,useState,type CSSProperties} from 'react';
import {createPortal} from 'react-dom';
import {Maximize,Minimize} from 'lucide-react';
import '../fullscreen-polish.css';

type FullscreenDocument=Document&{webkitFullscreenElement?:Element;webkitFullscreenEnabled?:boolean;webkitExitFullscreen?:()=>Promise<void>|void};
type FullscreenRoot=HTMLElement&{webkitRequestFullscreen?:()=>Promise<void>|void};
const fullscreenDocument=()=>document as FullscreenDocument;
const fullscreenRoot=()=>document.documentElement as FullscreenRoot;
function isAppFullscreen(){const doc=fullscreenDocument();return (doc.fullscreenElement||doc.webkitFullscreenElement)===document.documentElement;}
function isMobileDevice(){
 const nav=navigator as Navigator&{userAgentData?:{mobile?:boolean}};
 // Device identity survives rotation, desktop-site mode and a tablet mouse.
 return nav.userAgentData?.mobile===true||/Android|iPhone|iPad|iPod|Tablet|Mobile/i.test(nav.userAgent)||(nav.platform==='MacIntel'&&nav.maxTouchPoints>1)||(nav.maxTouchPoints>0&&matchMedia('(pointer:coarse)').matches);
}
function canFullscreen(){const doc=fullscreenDocument(),root=fullscreenRoot();return !!((root.requestFullscreen&&doc.fullscreenEnabled)||(root.webkitRequestFullscreen&&doc.webkitFullscreenEnabled!==false));}
function useAppFullscreen(){
 const [full,setFull]=useState(isAppFullscreen),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{const doc=fullscreenDocument(),update=()=>{setFull(isAppFullscreen());setError('');},failed=()=>setError('El navegador no permitió cambiar la pantalla completa. Puedes volver a intentarlo.');doc.addEventListener('fullscreenchange',update);doc.addEventListener('webkitfullscreenchange',update);doc.addEventListener('fullscreenerror',failed);doc.addEventListener('webkitfullscreenerror',failed);window.addEventListener('pageshow',update);return()=>{doc.removeEventListener('fullscreenchange',update);doc.removeEventListener('webkitfullscreenchange',update);doc.removeEventListener('fullscreenerror',failed);doc.removeEventListener('webkitfullscreenerror',failed);window.removeEventListener('pageshow',update);};},[]);
 const toggle=async()=>{if(busy)return;const doc=fullscreenDocument(),root=fullscreenRoot();setBusy(true);setError('');try{if(isAppFullscreen()){if(doc.fullscreenElement)await doc.exitFullscreen();else if(doc.webkitExitFullscreen)await doc.webkitExitFullscreen();else throw Error();}else if(root.requestFullscreen&&doc.fullscreenEnabled)await root.requestFullscreen({navigationUI:'hide'});else if(root.webkitRequestFullscreen&&doc.webkitFullscreenEnabled!==false)await root.webkitRequestFullscreen();else throw Error();setFull(isAppFullscreen());}catch{setError('El navegador no permitió cambiar la pantalla completa. Puedes volver a intentarlo.');}finally{setBusy(false);}};
 return {full,busy,error,toggle};
}
export default function MobileFullscreenSetting(){
 const {full,busy,error,toggle}=useAppFullscreen();if(!isMobileDevice())return null;const supported=canFullscreen();
 return <div className="mobile-fullscreen-setting"><button type="button" className="setting-row" aria-label={full?'Salir de pantalla completa':'Pantalla completa'} aria-pressed={full} disabled={busy||(!supported&&!full)} onClick={()=>void toggle()}>{full?<Minimize size={22}/>:<Maximize size={22}/>}<span><strong>{full?'Salir de pantalla completa':'Pantalla completa'}</strong><small>{!supported&&!full?'No disponible en este navegador':full?'Nexus ocupa toda la pantalla. También puedes salir con el botón flotante.':'Oculta las barras del navegador mientras utilizas Nexus.'}</small></span></button>{error&&<p className="settings-error" role="alert">{error}</p>}</div>;
}
/** Mount once beside the workspace so leaving Settings never hides the exit. */
export function MobileFullscreenExit(){
 const {full,busy,error,toggle}=useAppFullscreen(),[keyboardInset,setKeyboardInset]=useState(0);
 useEffect(()=>{if(!full)return;const viewport=window.visualViewport,update=()=>setKeyboardInset(viewport?Math.max(0,window.innerHeight-viewport.height-viewport.offsetTop):0);update();viewport?.addEventListener('resize',update);viewport?.addEventListener('scroll',update);window.addEventListener('resize',update);return()=>{viewport?.removeEventListener('resize',update);viewport?.removeEventListener('scroll',update);window.removeEventListener('resize',update);};},[full]);
 if(!isMobileDevice()||!full)return null;
 return createPortal(<div className="mobile-fullscreen-exit" style={{'--fullscreen-keyboard-inset':keyboardInset+'px'} as CSSProperties}><button type="button" aria-label="Salir de pantalla completa desde cualquier apartado" title="Salir de pantalla completa" disabled={busy} onClick={()=>void toggle()}><Minimize size={20}/><span>Salir de pantalla completa</span></button>{error&&<p role="alert">{error}</p>}</div>,document.body);
}
