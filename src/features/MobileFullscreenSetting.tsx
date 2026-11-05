import {useEffect,useState} from 'react';
import {Maximize,Minimize} from 'lucide-react';
import {useDesktopWeb} from './useDesktopWeb';

type FullscreenDocument=Document&{webkitFullscreenElement?:Element;webkitFullscreenEnabled?:boolean;webkitExitFullscreen?:()=>Promise<void>|void};
type FullscreenRoot=HTMLElement&{webkitRequestFullscreen?:()=>Promise<void>|void};
export default function MobileFullscreenSetting(){
 const desktop=useDesktopWeb(),doc=document as FullscreenDocument,root=document.documentElement as FullscreenRoot;
 const active=()=>!!(doc.fullscreenElement||doc.webkitFullscreenElement);
 const [full,setFull]=useState(active),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const supported=!!((root.requestFullscreen&&doc.fullscreenEnabled)||(root.webkitRequestFullscreen&&doc.webkitFullscreenEnabled!==false));
 useEffect(()=>{const update=()=>{setFull(active());setError('');};doc.addEventListener('fullscreenchange',update);doc.addEventListener('webkitfullscreenchange',update);return()=>{doc.removeEventListener('fullscreenchange',update);doc.removeEventListener('webkitfullscreenchange',update);};},[]);
 const touchDevice=navigator.maxTouchPoints>0&&matchMedia('(pointer:coarse)').matches;
 const mobileDevice=/Android|iPhone|iPad|iPod|Tablet|Mobile/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)||touchDevice;
 if(desktop||!mobileDevice)return null;
 const toggle=async()=>{if(busy)return;setBusy(true);setError('');try{if(active()){if(doc.fullscreenElement)await doc.exitFullscreen();else await doc.webkitExitFullscreen?.();}else if(root.requestFullscreen&&doc.fullscreenEnabled)await root.requestFullscreen({navigationUI:'hide'});else if(root.webkitRequestFullscreen)await root.webkitRequestFullscreen();else throw Error();setFull(active());}catch{setError('El navegador no permitió cambiar la pantalla completa. Puedes volver a intentarlo.');}finally{setBusy(false);}};
 return <div className="mobile-fullscreen-setting"><button type="button" className="setting-row" aria-label={full?'Salir de pantalla completa':'Pantalla completa'} aria-pressed={full} disabled={busy||(!supported&&!full)} onClick={()=>void toggle()}>{full?<Minimize size={22}/>:<Maximize size={22}/>}<span><strong>{full?'Salir de pantalla completa':'Pantalla completa'}</strong><small>{!supported&&!full?'No disponible en este navegador':full?'Nexus ocupa toda la pantalla. Toca para salir.':'Oculta las barras del navegador mientras utilizas Nexus.'}</small></span></button>{error&&<p className="settings-error" role="alert">{error}</p>}</div>;
}
