import {useEffect,useState,type CSSProperties,type ReactNode} from 'react';
import {Archive,ArrowRight,Bell,CalendarClock,Check,CheckCheck,Clock,Download,Eye,Folder,HardDrive,Image,Info,Lock,Mic,Smile,Sticker,SquarePlay,Timer,CircleGauge,SlidersHorizontal,RefreshCw,MapPin,MessageCircle,Palette,Phone,Shield,Smartphone,Trash2,User,Users,Wifi} from 'lucide-react';
import {SettingsRow as Row,SettingsHero as Hero,SettingsChoiceDialog,SettingsDialog,type SettingsChoice} from './MobileSettingsControls';
import MobileSettingsHelp,{mobileHelpTitles} from './MobileSettingsHelp';
import {browserConnection,downloadFields,mobileColors,mobileIconURL,mobileIcons,networkProfile,readMobileAccent,readMobileIcon,saveMobileBranding,type DownloadNetwork,type DownloadSelection,type NoticeVibration} from './mobileSettingsModel';
import {TONE_NAMES} from './Sounds';
import {useExperience,saveExperience} from './DeviceExperience';
import {DEFAULT_PREFERENCES,setThemeMode,type Preferences,type ThemeMode} from './preferences';
import type {PrivacyOptions} from './privacy';
import {sizeLabel} from './StorageData';
import {fileUsage,transferKey} from './transferUsage';
import {useActiveLocations,stopLiveLocation} from './LiveLocation';
import './mobile-settings.css';

type Props={page:string;uid:string;go:(page:string)=>void;chooseAudience:(field:'lastSeen'|'photo'|'info'|'status'|'group')=>void;privacy:PrivacyOptions;updatePrivacy:(patch:Partial<PrivacyOptions>)=>void;audienceNames:Record<string,string>;duration:string;preferences:Preferences;chatPreference:(patch:Partial<Preferences['chat']>)=>void;notificationPreference:(patch:Partial<Preferences['notifications']>)=>void;mode:ThemeMode;updateMode:(mode:ThemeMode)=>void;pushControl:ReactNode;chatHistory:ReactNode;storageManage:ReactNode;appearancePreview:ReactNode};
export const mobilePageTitles={...mobileHelpTitles,noticeBadge:'Contador del icono de la aplicación',appIcon:'Icono de la aplicación',appStyle:'Estilo de la aplicación',animation:'Animación',focus:'Horarios de enfoque',usage:'Uso de datos',livePrivacy:'Ubicación en tiempo real',lockPrivacy:'Bloqueo de aplicación',privacyContact:'Revisión de privacidad',privacyInfo:'Revisión de privacidad',privacyChats:'Revisión de privacidad',privacyAccount:'Revisión de privacidad',chatHistory:'Historial de chats',chatTransfer:'Transferir chats',storageTemporary:'Mensajes temporales',privacyContacts:'Contactos'};
export const phoneSettingsPages=new Set([...Object.keys(mobilePageTitles),'appAppearance','chats','privacy','privacyReview','accessibility','help','notifications','storage','storageManage']);
const options=(items:[string,string][])=>items.map(([value,label])=>({value,label}));
const vibrations=options([['off','Desactivada'],['default','Predeterminada'],['short','Corta'],['long','Larga']]);
const modeNames={system:'Predeterminado del sistema',light:'Claro',dark:'Oscuro'};
const networks:{id:DownloadNetwork;label:string}[]=[{id:'mobile',label:'Descargar con datos móviles'},{id:'wifi',label:'Descargar con wifi'},{id:'roaming',label:'En itinerancia de datos'}];
const labelFor=(downloads:DownloadSelection)=>Object.entries(downloadFields).filter(([key])=>downloads[key as keyof DownloadSelection]).map(([,label])=>label).join(', ')||'Ningún archivo';

function Switch({label,detail,icon:Icon,value,onChange}:{label:string;detail?:string;icon?:typeof Info;value:boolean;onChange:(checked:boolean)=>void}){
 return <label className="phone-setting-toggle">{Icon&&<Icon size={21} aria-hidden="true"/>}<span><strong>{label}</strong>{detail&&<small>{detail}</small>}</span><input type="checkbox" role="switch" checked={value} onChange={event=>onChange(event.target.checked)}/></label>;
}

export default function MobileSettingsPages(p:Props){
 const {page,uid,go,chooseAudience,privacy,updatePrivacy,audienceNames,duration,preferences,chatPreference,notificationPreference}=p;
 const [choice,setChoice]=useState<SettingsChoice|null>(null),[resetUsage,setResetUsage]=useState(false),[resetNotices,setResetNotices]=useState(false),[usage,setUsage]=useState(()=>fileUsage(uid)),[accent,setAccent]=useState(readMobileAccent),[icon,setIcon]=useState(readMobileIcon),[locationError,setLocationError]=useState(''),[reviewHidden,setReviewHidden]=useState(false);
 const [schedule,setSchedule]=useState(()=>preferences.notifications.focus||{start:'22:00',end:'07:00'}),[scheduleOpen,setScheduleOpen]=useState(false);
 const experience=useExperience(),activeLocations=useActiveLocations(uid,page==='livePrivacy');
 useEffect(()=>{const refresh=()=>setUsage(fileUsage(uid));refresh();window.addEventListener('nexus:transfer-usage',refresh);return()=>window.removeEventListener('nexus:transfer-usage',refresh);},[uid]);
 const radio=(title:string,items:SettingsChoice['options'],selected:string,save:(value:string)=>void,description?:string,accept?:string)=>setChoice({title,options:items,selected:[selected],save:values=>save(values[0]),description,accept});
 const clock=()=>go('temporary');
 const privacyRows=(items:[string,string,()=>void,typeof Info][])=>items.map(([label,detail,onClick,Icon])=><Row key={label} label={label} detail={detail} icon={Icon} end={<ArrowRight size={18}/>} onClick={onClick}/>);
 const group=(title:string,children:ReactNode)=><section className="phone-settings-group"><h3 className="phone-setting-section-title">{title}</h3>{children}</section>;
 const colorGrid=(kind:'accent'|'icon')=><div className={'phone-color-grid'+(kind==='icon'?' phone-icon-grid':'')}>{(kind==='accent'?mobileColors:mobileIcons).map(([name,color])=>{
  const selected=(kind==='accent'?accent:icon)===color;
  return <button type="button" aria-label={(kind==='accent'?'Color ':'Icono ')+name} aria-pressed={selected} key={name} style={kind==='accent'?{'--phone-swatch':color} as CSSProperties:undefined} onClick={()=>{saveMobileBranding(kind,color);if(kind==='accent')setAccent(color);else setIcon(color);}}>{kind==='icon'?<img src={mobileIconURL(color)} alt=""/>:null}{selected&&<Check size={20}/>}</button>;
 })}</div>;
 const mediaChoices=(network?:DownloadNetwork)=>{
  const current=network?(preferences.chat.networkDownloads?.[network]||preferences.chat.downloads):preferences.chat.downloads;
  setChoice({title:network?networks.find(row=>row.id===network)!.label:'Descarga automática general',multiple:true,options:options(Object.entries(downloadFields)),selected:Object.keys(current).filter(key=>current[key as keyof DownloadSelection]),save:keys=>{
   const values=Object.fromEntries(Object.keys(downloadFields).map(key=>[key,keys.includes(key)])) as DownloadSelection;
   chatPreference(network?{networkDownloads:{...preferences.chat.networkDownloads,[network]:values}}:{downloads:values});
  }});
 };

 function notificationSection(key:'messages'|'groups'|'statuses'|'calls',title:string){
  const settings=preferences.notifications[key],calls=key==='calls';
  const update=(patch:Partial<typeof settings>)=>notificationPreference({[key]:{...settings,...patch}});
  const tone=calls?'Tono de llamada':'Tono de notificación';
  const toneOptions=options([['0','Silencio'],...TONE_NAMES.map((name,index):[string,string]=>[String(index+1),name])]);
  return group(title,<>
    <Row label={tone} detail={toneOptions.find(option=>option.value===String(settings.tone))?.label}
      onClick={()=>radio(tone,toneOptions,String(settings.tone),value=>update({tone:Number(value)}),undefined,'Guardar')}/>
    <Row label="Vibración" detail={vibrations.find(option=>option.value===(settings.vibration||'off'))?.label}
      onClick={()=>radio('Vibración',vibrations,settings.vibration||'off',value=>update({vibration:value as NoticeVibration}))}/>
    {!calls&&<Switch label="Notificaciones en alta prioridad" detail="Muestra avisos en la parte superior cuando Nexus está abierto."
      value={('highPriority' in settings?settings.highPriority:undefined)??preferences.notifications.banner==='always'} onChange={highPriority=>update({highPriority})}/>}
    {!calls&&'reactions' in settings&&<Switch label="Notificaciones de reacciones"
      detail="Avisa cuando alguien reacciona a un mensaje que enviaste." value={settings.reactions} onChange={reactions=>update({reactions})}/>}
    <Switch label={calls?'Notificaciones de llamadas':'Mostrar notificaciones'} value={settings.enabled} onChange={enabled=>update({enabled})}/>
    {calls&&'sound' in settings&&<Switch label="Reproducir el tono de llamada" value={settings.sound} onChange={sound=>update({sound})}/>}
  </>);
 }
 let content:ReactNode;
 switch(page){
 case 'appAppearance':content=
  <>
    <div className="phone-settings-group">
      <Row label="Estilo predeterminado del chat" icon={MessageCircle} end={p.appearancePreview} onClick={()=>go('appearance')}/>
    </div>
    {group('Personalización',<>
      <Row label="Icono de la aplicación" icon={Smartphone} end={<img className="phone-setting-icon-preview" src={mobileIconURL(icon)} alt=""/>} onClick={()=>go('appIcon')}/>
      <Row label="Estilo de la aplicación" icon={Palette} end={<i className="phone-setting-color-preview" style={{background:accent}}/>} onClick={()=>go('appStyle')}/>
    </>)}
  </>;break;
 case 'appIcon':content=<><p className="phone-setting-note">Cambia el icono de Nexus en la pestaña del navegador.</p>{colorGrid('icon')}</>;break;
 case 'appStyle':content=
  <>
    <Row label="Modo oscuro" detail={modeNames[p.mode]} icon={SlidersHorizontal} onClick={()=>radio('Elige un estilo',options(Object.entries(modeNames)),p.mode,value=>{setThemeMode(value as ThemeMode);p.updateMode(value as ThemeMode);})}/>
    {group('Color',colorGrid('accent'))}
  </>;break;
 case 'accessibility':content=<><Switch label="Aumenta el contraste" detail="Resalta los elementos para que sean más fáciles de distinguir." value={experience.contrast} onChange={contrast=>saveExperience({contrast})}/><Row label="Animación" detail="Elige qué elementos pueden animarse automáticamente." onClick={()=>go('animation')}/></>;break;
 case 'animation':content=
  <>
    <p className="phone-setting-note">Si el ajuste está activado, los elementos del chat se animan automáticamente.</p>
    <Switch label="Mensajes" icon={MessageCircle} value={experience.animation!=='off'} onChange={value=>saveExperience({animation:value?'system':'off'})}/>
    {(['emoji','sticker','gif'] as const).map((key,index)=><Switch key={key}
      label={['Emojis','Stickers','GIF'][index]} icon={[Smile,Sticker,SquarePlay][index]}
      value={experience.mediaMotion?.[key]!==false} onChange={value=>saveExperience({mediaMotion:{...experience.mediaMotion,[key]:value}})}/>)}
  </>;break;
 case 'chats':content=
  <div className="phone-chat-settings">
    {group('Ajustes de chat',<>
      <Switch label="Enter (↵) para enviar" detail="La tecla Enter (↵) envía tu mensaje." value={preferences.chat.enterSend} onChange={enterSend=>chatPreference({enterSend})}/>
      <Row label="Tamaño de fuente" detail={{small:'Pequeño',medium:'Mediano',large:'Grande'}[experience.font]}
        onClick={()=>radio('Tamaño de fuente',options([['small','Pequeño'],['medium','Mediano'],['large','Grande']]),experience.font,value=>saveExperience({font:value as typeof experience.font}))}/>
      <Row label="Transcripciones de mensajes de voz" detail="Lee tus mensajes de voz recibidos." onClick={()=>go('voiceTranscripts')}/>
    </>)}
    {group('Chats archivados',<Switch label="Mantener los chats archivados"
      detail="Los chats permanecen archivados cuando reciben un mensaje nuevo."
      value={preferences.chat.keepArchived!==false} onChange={keepArchived=>chatPreference({keepArchived})}/>)}
    <div className="phone-settings-group">
      <Row label="Transferir chats" icon={Smartphone} onClick={()=>go('chatTransfer')}/>
      <Row label="Historial de chats" icon={Archive} onClick={()=>go('chatHistory')}/>
    </div>
  </div>;break;
 case 'chatHistory':content=p.chatHistory;break;
 case 'chatTransfer':content=<><Hero icon={Smartphone} title="Abre tu historial en otro teléfono" detail="Inicia sesión en Nexus con la misma cuenta desde el navegador del otro teléfono. Tus chats guardados en la cuenta estarán disponibles allí."/><Row label="Exportar una conversación" icon={Download} onClick={()=>go('chatHistory')}/></>;break;
 case 'privacy':content=
  <>
    {!reviewHidden&&<div className="phone-privacy-card">
      <button type="button" onClick={()=>go('privacyReview')}>
        <Shield size={22} aria-hidden="true"/>
        <span><strong>Revisión de privacidad</strong><small>Controla tu privacidad y elige los ajustes adecuados para ti. <b>Iniciar revisión</b></small></span>
      </button>
      <button type="button" className="phone-privacy-dismiss" aria-label="Ocultar revisión de privacidad" onClick={()=>setReviewHidden(true)}>×</button>
    </div>}
    {group('Quién puede ver mi información personal',<>
      <Row label="Hora de últ. vez y En línea" detail={audienceNames[privacy.lastSeenAudience]+', '+audienceNames[privacy.onlineAudience]} onClick={()=>chooseAudience('lastSeen')}/>
      <Row label="Foto del perfil" detail={audienceNames[privacy.photoAudience]} onClick={()=>chooseAudience('photo')}/>
      <Row label="Info." detail={audienceNames[privacy.infoAudience]} onClick={()=>chooseAudience('info')}/>
      <Row label="Estado" detail={audienceNames[privacy.statusAudience]} onClick={()=>chooseAudience('status')}/>
      <Switch label="Confirmaciones de lectura" detail="Si las desactivas, no podrás enviarlas ni recibirlas en chats individuales. En grupos se envían siempre."
        value={privacy.readReceipts} onChange={readReceipts=>updatePrivacy({readReceipts})}/>
    </>)}
    {group('Mensajes temporales',<Row label="Duración predeterminada" detail="Inicia chats nuevos con una duración para los mensajes temporales." end={<small className="phone-setting-value">{duration}</small>} onClick={clock}/>)}
    <div className="phone-settings-group">
      <Row label="Grupos" detail={audienceNames[privacy.groupAudience]} onClick={()=>chooseAudience('group')}/>
      <Row label="Ubicación en tiempo real" onClick={()=>go('livePrivacy')}/>
      <Row label="Llamadas" detail="Silenciar llamadas de desconocidos" onClick={()=>go('callPrivacy')}/>
      <Row label="Contactos" detail="Contactos guardados y bloqueados" onClick={()=>go('privacyContacts')}/>
      <Row label="Bloqueo de aplicación" onClick={()=>go('lockPrivacy')}/>
      <Row label="Avanzada" detail="Protege la dirección IP en llamadas" onClick={()=>go('advanced')}/>
      {reviewHidden&&<Row label="Revisión de privacidad" onClick={()=>go('privacyReview')}/>}
    </div>
  </>;break;
 case 'privacyContacts':content=<>
   <Row label="Mis contactos" detail={String(privacy.contactIds.length)} onClick={()=>go('contacts')}/>
   <Row label="Contactos bloqueados" detail={String(privacy.blockedIds.length)} onClick={()=>go('blocked')}/>
 </>;break;
 case 'privacyReview':content=<><Hero icon={Shield} title="Tu privacidad es importante" detail="Controla qué compartes y quién puede contactarte en Nexus."/>{privacyRows([['Selecciona quién puede contactarte','',()=>go('privacyContact'),Phone],['Controla tu información personal','',()=>go('privacyInfo'),User],['Añade más privacidad a tus chats','',()=>go('privacyChats'),MessageCircle],['Añade más protección a tu cuenta','',()=>go('privacyAccount'),Lock]])}</>;break;
 case 'privacyContact':content=<><Hero icon={Users} title="Selecciona quién puede contactarte" detail="Elige cómo quieres recibir invitaciones, llamadas y mensajes."/>{privacyRows([['Grupos','Elige quién puede añadirte a grupos.',()=>chooseAudience('group'),Users],['Silenciar llamadas de desconocidos','Evita que suenen llamadas de números desconocidos.',()=>go('callPrivacy'),Phone],['Contactos bloqueados','Gestiona las personas que has bloqueado.',()=>go('blocked'),Shield]])}</>;break;
 case 'privacyInfo':content=<><Hero icon={Eye} title="Controla tu información personal" detail="Selecciona quién puede ver tu perfil y tu actividad."/>{privacyRows([['Foto del perfil','Selecciona quién puede ver tu foto.',()=>chooseAudience('photo'),User],['Hora de últ. vez y En línea','Controla quién puede ver tu actividad.',()=>chooseAudience('lastSeen'),Eye]])}<Switch label="Confirmaciones de lectura" value={privacy.readReceipts} onChange={readReceipts=>updatePrivacy({readReceipts})}/></>;break;
 case 'privacyChats':content=<><Hero icon={MessageCircle} title="Añade más privacidad a tus chats" detail="Gestiona el acceso y la duración de tus conversaciones."/>{privacyRows([['Bloqueo de aplicación','Configura el bloqueo local de Nexus.',()=>go('lockPrivacy'),Lock],['Duración predeterminada','Elige cuándo caducan los mensajes nuevos.',clock,Clock]])}</>;break;
 case 'privacyAccount':content=<><Hero icon={Lock} title="Añade más protección a tu cuenta" detail="Revisa tus herramientas de seguridad y de acceso."/>{privacyRows([['Notificaciones de seguridad','Elige qué avisos quieres recibir.',()=>go('security'),Shield],['Cuenta','Consulta tus opciones de cuenta.',()=>go('account'),User]])}</>;break;
 case 'lockPrivacy':content=<><Hero icon={Lock} title="Bloqueo de aplicación" detail="Configura un código local para proteger el acceso a Nexus en este navegador."/><button className="phone-settings-primary" onClick={()=>window.dispatchEvent(new Event('nexus:app-lock'))}>Abrir bloqueo de aplicación</button></>;break;
 case 'livePrivacy':content=<><Hero icon={MapPin} title="Ubicación en tiempo real" detail={activeLocations.length?'Compartes tu ubicación en los siguientes chats.':'No estás compartiendo tu ubicación en tiempo real con ningún chat en este navegador.'}/>{activeLocations.map(item=><Row key={item.id} label={item.chat.title||'Conversación'} detail="Dejar de compartir" icon={MapPin} onClick={()=>void stopLiveLocation(item.id).catch(()=>setLocationError('No se pudo confirmar el cierre en el servidor.'))}/>)}{locationError&&<p className="phone-setting-note" role="alert">{locationError}</p>}</>;break;
 case 'notifications':content=
  <div className="phone-notification-settings">
    <Switch label="Tonos de conversación" detail="Reproduce sonidos para mensajes entrantes y salientes."
      value={preferences.notifications.conversationTones!==false} onChange={conversationTones=>notificationPreference({conversationTones})}/>
    {notificationSection('messages','Mensajes')}
    {notificationSection('groups','Grupos')}
    {notificationSection('calls','Llamadas')}
    {notificationSection('statuses','Estado')}
    <div className="phone-settings-group">
      <Row label="Contador del icono de la aplicación" detail="Configura el contador de Nexus" onClick={()=>go('noticeBadge')}/>
      <Row label="Horarios de enfoque" detail={preferences.notifications.focus?preferences.notifications.focus.start+" – "+preferences.notifications.focus.end:'Silencia los avisos en los horarios que elijas'} onClick={()=>go('focus')}/>
    </div>
    {group('Avisos del navegador',<>
      <Switch label="Sonido de mensajes salientes" value={preferences.notifications.outgoingSound} onChange={outgoingSound=>notificationPreference({outgoingSound})}/>
      <Switch label="Mostrar vista previa" detail="Muestra el contenido de los mensajes en los avisos." value={preferences.notifications.preview} onChange={preview=>notificationPreference({preview})}/>
      <Row label="Avisos en pantalla" onClick={()=>radio('Avisos en pantalla',options([['always','Siempre'],['unfocused','Cuando la pestaña no está activa'],['never','Nunca']]),preferences.notifications.banner,value=>notificationPreference({banner:value as Preferences['notifications']['banner']}))}/>
      {p.pushControl}
      <Row label="Restablecer notificaciones" icon={RefreshCw} onClick={()=>setResetNotices(true)}/>
    </>)}
  </div>;break;
 case 'noticeBadge':content=<>
   <p className="phone-setting-note">Elige cómo se muestra el contador de mensajes en Nexus.</p>
   {options([['always','Mostrar mientras haya chats sin leer'],['unfocused','Ocultar cuando Nexus está visible'],['never','Desactivado']]).map(option=><label className="settings-radio" key={option.value}>
     <input type="radio" name="notice-badge" checked={preferences.notifications.badge===option.value}
       onChange={()=>notificationPreference({badge:option.value as Preferences['notifications']['badge']})}/>{option.label}
   </label>)}
 </>;break;
 case 'focus':content=<><Hero icon={CalendarClock} title="Horarios de enfoque" detail="Silencia los avisos y sonidos de mensajes, grupos y estados a las horas que elijas en este navegador. Las llamadas siguen disponibles."/><Row label="Horario personalizado" detail={preferences.notifications.focus?`${preferences.notifications.focus.start} – ${preferences.notifications.focus.end}`:'Elige cuándo empieza y termina'} icon={Clock} onClick={()=>{setSchedule(preferences.notifications.focus||{start:'22:00',end:'07:00'});setScheduleOpen(true);}}/>{preferences.notifications.focus&&<button className="phone-settings-text-action" onClick={()=>notificationPreference({focus:null})}>Desactivar horario</button>}</>;break;
 case 'storage':content=<><div className="phone-settings-group"><Row label="Liberar espacio" detail="Copias guardadas en este navegador" icon={Folder} onClick={()=>go('storageManage')}/><Row label="Uso de datos" detail={`${sizeLabel(usage.sent)} enviados · ${sizeLabel(usage.received)} recibidos`} icon={CircleGauge} onClick={()=>go('usage')}/><Switch label="Usar menos datos para llamadas" value={preferences.chat.lessCallData===true} onChange={lessCallData=>chatPreference({lessCallData})}/></div><div className="phone-settings-group"><Row label="Calidad de subida de archivos multimedia" detail={preferences.chat.uploadQuality==='hd'?'Calidad HD':'Calidad estándar'} icon={Image} onClick={()=>radio('Calidad de subida de archivos multimedia',[{value:'standard',label:'Calidad estándar',detail:'Archivos de fotos más pequeños.'},{value:'hd',label:'Calidad HD',detail:'Conserva más detalles de las fotos.'}],preferences.chat.uploadQuality,value=>chatPreference({uploadQuality:value as Preferences['chat']['uploadQuality']}),'Selecciona la calidad con la que se enviarán las fotos en los chats.','Guardar')}/></div>{group('Descarga automática',<><p className="phone-setting-note">Los mensajes de voz se descargan automáticamente.</p>{networks.map(network=><Row key={network.id} label={network.label} detail={labelFor(preferences.chat.networkDownloads?.[network.id]||preferences.chat.downloads)} onClick={()=>mediaChoices(network.id)}/>)}<Row label="Descarga automática general" detail={labelFor(preferences.chat.downloads)} icon={Wifi} onClick={()=>mediaChoices()}/><p className="phone-setting-note">{networkProfile(browserConnection())?'Nexus usa la regla de la conexión detectada.':'Tu navegador no identifica la red actual. Se aplica la regla general.'}</p></>)}</>;break;
 case 'storageManage':content=<>{p.storageManage}<Row label="Activa los mensajes temporales" detail="Elige cuándo caducarán los mensajes nuevos." icon={Clock} onClick={()=>go('storageTemporary')}/></>;break;
 case 'storageTemporary':content=<><Hero icon={Timer} title="Mensajes temporales" detail="Configura la duración de los mensajes nuevos. Los miembros del chat verán que activaste este ajuste."/>{group('Ajuste para tu cuenta',<Row label="Duración predeterminada" detail={duration} icon={User} onClick={clock}/>)}{group('Ajuste para tus chats actuales',<Row label="Aplica la duración de los mensajes a tus chats" icon={MessageCircle} onClick={()=>go('applyTemporary')}/>)}</>;break;
 case 'usage':content=<><div className="phone-usage-totals"><small>Uso de datos de archivos</small><h3>{sizeLabel(usage.sent+usage.received)}</h3><span>↑ Enviados<br/><strong>{sizeLabel(usage.sent)}</strong></span><span>↓ Recibidos<br/><strong>{sizeLabel(usage.received)}</strong></span></div><p className="phone-setting-note">El contador mide archivos transferidos por esta cuenta en este navegador. Las llamadas y el tráfico de mensajes tienen un consumo separado.</p><Row label="Reiniciar estadísticas" onClick={()=>setResetUsage(true)}/></>;break;
 default:content=<MobileSettingsHelp key={page} page={page} uid={uid} go={go}/>;
 }
 return <>{content}{choice&&<SettingsChoiceDialog choice={choice} onClose={()=>setChoice(null)}/>}{scheduleOpen&&<SettingsDialog title="Horario personalizado" onClose={()=>setScheduleOpen(false)} actions={<><button type="button" onClick={()=>setScheduleOpen(false)}>Cancelar</button><button type="button" disabled={!schedule.start||!schedule.end||schedule.start===schedule.end} onClick={()=>{notificationPreference({focus:schedule});setScheduleOpen(false);}}>Guardar</button></>}><div className="phone-focus-times"><label>Empieza<input type="time" value={schedule.start} onChange={event=>setSchedule({...schedule,start:event.target.value})}/></label><label>Termina<input type="time" value={schedule.end} onChange={event=>setSchedule({...schedule,end:event.target.value})}/></label></div></SettingsDialog>}{resetNotices&&<SettingsDialog title="¿Restablecer los ajustes de notificaciones?" onClose={()=>setResetNotices(false)} actions={<>
   <button type="button" onClick={()=>setResetNotices(false)}>Cancelar</button>
   <button type="button" onClick={()=>{notificationPreference({...DEFAULT_PREFERENCES.notifications,focus:null,conversationTones:true});setResetNotices(false);}}>Restablecer</button>
 </>}/>}{resetUsage&&<SettingsDialog title="¿Reiniciar estadísticas de uso de red?" onClose={()=>setResetUsage(false)} actions={<><button type="button" onClick={()=>setResetUsage(false)}>Cancelar</button><button type="button" onClick={()=>{localStorage.removeItem(transferKey(uid));setUsage(fileUsage(uid));window.dispatchEvent(new Event('nexus:transfer-usage'));setResetUsage(false);}}>Reiniciar</button></>}/> }</>;
}
