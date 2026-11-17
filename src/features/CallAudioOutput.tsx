import {useCallback,useEffect,useRef,useState} from 'react';
import {Check,Headphones,Smartphone,Volume2} from 'lucide-react';
import {devicePreferences} from './DeviceSettings';
import {callAudioRoutes,currentCallAudioRoute,callAudioOutputError,type CallAudioRoute} from './callAudioOutput';
import {useMobileBack} from './useMobileBack';
const systemNotice='La salida de audio se controla desde el teléfono. Usa sus controles de sonido para elegir altavoz o audífonos.';
type Props={busy:boolean;open:boolean;onOpen:(open:boolean)=>void;onChange?:(id:string)=>Promise<void>;onNotice:(text:string)=>void};
export default function CallAudioOutput({busy,open,onOpen,onChange,onNotice}:Props){
 const [devices,setDevices]=useState<MediaDeviceInfo[]>([]),[selected,setSelected]=useState<string>(()=>devicePreferences().speaker||''),[changing,setChanging]=useState(false);
 const button=useRef<HTMLButtonElement>(null),menu=useRef<HTMLDivElement>(null),mounted=useRef(true),selectedRef=useRef(selected),switching=useRef(false),changeRef=useRef(onChange),noticeRef=useRef(onNotice);
 changeRef.current=onChange;noticeRef.current=onNotice;
 const supported=typeof HTMLMediaElement.prototype.setSinkId==='function'&&!!onChange;
 const refresh=useCallback(async()=>{
  try{
   const list=await navigator.mediaDevices?.enumerateDevices();if(!list||!mounted.current)return;setDevices(list);
   const id=selectedRef.current;
   if(supported&&id&&id!=='default'&&!switching.current&&!list.some(d=>d.kind==='audiooutput'&&d.deviceId===id)){
    switching.current=true;setChanging(true);
    try{await changeRef.current?.('');if(mounted.current){selectedRef.current='';setSelected('');}}
    catch(error){if(mounted.current)noticeRef.current(callAudioOutputError(error));}
    finally{switching.current=false;if(mounted.current)setChanging(false);}
   }
  }catch{/* Existing audio continues when device enumeration is unavailable. */}
 },[supported]);
 useEffect(()=>{
  mounted.current=true;void refresh();const media=navigator.mediaDevices;
  const changed=()=>void refresh(),preference=(event:Event)=>{const id=(event as CustomEvent<string>).detail;selectedRef.current=id;setSelected(id);void refresh();};
  media?.addEventListener('devicechange',changed);window.addEventListener('nexus:call-output',preference);
  return()=>{mounted.current=false;media?.removeEventListener('devicechange',changed);window.removeEventListener('nexus:call-output',preference);};
 },[refresh]);
 useMobileBack(open,()=>onOpen(false),110);
 useEffect(()=>{
  if(!open)return;
  menu.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus();
  const outside=(event:PointerEvent)=>{if(!menu.current?.contains(event.target as Node)&&!button.current?.contains(event.target as Node))onOpen(false);};
  const key=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();onOpen(false);button.current?.focus();}else if(event.key==='Tab')onOpen(false);};
  document.addEventListener('pointerdown',outside);document.addEventListener('keydown',key);return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',key);};
 },[open,onOpen]);
 const routes=callAudioRoutes(devices),current=currentCallAudioRoute(devices,selected),Icon=current.kind==='headset'?Headphones:Volume2;
 async function choose(id:string){
  if(switching.current||busy)return;switching.current=true;setChanging(true);
  try{await onChange!(id);if(mounted.current){selectedRef.current=id;setSelected(id);onOpen(false);button.current?.focus();}}
  catch(error){if(mounted.current)onNotice(callAudioOutputError(error));}
  finally{switching.current=false;if(mounted.current){setChanging(false);void refresh();}}
 }
 async function activate(){
  if(open){onOpen(false);return;}
  if(!supported){onNotice(systemNotice);return;}
  // Without an accessory, WhatsApp switches directly between phone and speaker.
  if(routes.length===2&&routes.some(r=>r.kind==='phone')&&routes.some(r=>r.kind==='speaker')){const next=routes.find(r=>r.id!==current.id);if(next)await choose(next.id);return;}
  if(routes.length>1){onOpen(true);return;}
  const media=navigator.mediaDevices as MediaDevices&{selectAudioOutput?:(options?:{deviceId?:string})=>Promise<MediaDeviceInfo>};
  if(media?.selectAudioOutput){try{const device=await media.selectAudioOutput({deviceId:selected});await choose(device.deviceId);}catch(error){if((error as DOMException)?.name!=='NotAllowedError')onNotice(callAudioOutputError(error));}return;}
  onNotice(systemNotice);
 }
 function menuKey(event:React.KeyboardEvent){if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;event.preventDefault();const items=Array.from(menu.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]')||[]),index=items.indexOf(document.activeElement as HTMLButtonElement);items[event.key==='Home'?0:event.key==='End'?items.length-1:(index+(event.key==='ArrowDown'?1:-1)+items.length)%items.length]?.focus();}
 return <><button ref={button} className={'call-output-trigger'+(current.kind==='headset'||current.kind==='speaker'?' is-on':'')} disabled={busy||changing} aria-label="Altavoz" aria-haspopup="menu" aria-expanded={open} title={'Salida de audio: '+current.label} onClick={()=>void activate()}><span><Icon size={25}/></span><small>Altavoz</small></button>{open&&<div ref={menu} className="call-output-menu" role="menu" aria-label="Salida de audio" onKeyDown={menuKey}>{routes.map((item:CallAudioRoute)=>{const RouteIcon=item.kind==='headset'?Headphones:item.kind==='phone'?Smartphone:Volume2;return <button type="button" role="menuitemradio" aria-checked={current.id===item.id} key={item.id} disabled={busy||changing} onClick={()=>void choose(item.id)}><RouteIcon aria-hidden="true"/><span>{item.label}</span>{current.id===item.id&&<Check aria-hidden="true" className="call-output-check"/>}</button>;})}</div>}</>;
}
