import {useEffect,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ArrowUpRight,Bell,CalendarClock,FileText,Flag,LayoutDashboard,LogOut,ShieldCheck,Sparkles,Wifi,WifiOff} from 'lucide-react';
import {deleteField,getDoc,onSnapshot,runTransaction,type Firestore} from 'firebase/firestore';
import type {Database} from 'firebase/database';
import type {User} from 'firebase/auth';
import {version} from '../webVersion.json';
import DashboardAI from './DashboardAI';
import DashboardReport from './DashboardReport';
import MessageReports from './MessageReports';
import OfficialNotices from './OfficialNotices';
import MaintenanceMode from './MaintenanceMode';
import Overview,{type OverviewSnapshot} from './Overview';
import {useDashboardSession,loginGoogle,loginPassword,logoutDashboard} from './session';
import {createActions} from './actions';
import './style.css';

const navigation=[
 ['resumen','Resumen',LayoutDashboard],
 ['reportes','Reportes',Flag],
 ['avisos','Avisos oficiales',Bell],
 ['mantenimiento','Mantenimiento',CalendarClock],
 ['informes','Informes',FileText],
 ['modo-ia','Modo IA',Sparkles],
] as const;
type Page=typeof navigation[number][0];
type Plan={enabled?:boolean;nextDueAt?:number;lastCompletedAt?:number;status?:string;leaseUntil?:number;execution?:string};
const currentPage=():Page=>navigation.find(([id])=>'#'+id===location.hash)?.[0]||'resumen';
const dateLabel=(value:number)=>new Date(value).toLocaleString('es-EC',{timeZone:'America/Guayaquil',dateStyle:'medium',timeStyle:'short'});
const validDate=(value:unknown):value is number=>typeof value==='number'&&Number.isFinite(value)&&value>0&&value<=8.64e15;

function useAction(){
 const lock=useRef(false);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 async function run(action:()=>Promise<void>){
  if(lock.current)return;
  lock.current=true;
  setBusy(true);setMessage('');setError('');
  try{await action();}
  catch(error){setError(error instanceof Error?error.message:'No se pudo completar la acción.');}
  finally{lock.current=false;setBusy(false);}
 }
 return {busy,message,error,setMessage,run};
}
function Feedback({busy,message,error}:{busy:boolean;message:string;error:string}){
 return <>{(busy||message)&&<p className="feedback" role="status">{message||'Procesando…'}</p>}{error&&<p className="feedback error" role="alert">{error}</p>}</>;
}

function Access({user,error,retry,onLogout}:{user:User|null;error?:string;retry:()=>void;onLogout:()=>Promise<void>}){
 const [password,setPassword]=useState(''),[email,setEmail]=useState('');
 const action=useAction();
 return <section className="access panel-card"><span className="eyebrow">ACCESO PRIVADO</span><h1>Accede al dashboard</h1>
  <p>Usa una cuenta administradora autorizada de Nexus Chat.</p>
  {user&&<p>Sesión actual: {user.email||'Cuenta de Nexus'}.</p>}
  {error&&<p className="feedback error" role="alert">{error}</p>}
  {user&&<button className="secondary" disabled={action.busy} onClick={retry}>Volver a comprobar acceso</button>}
  <button disabled={action.busy} onClick={()=>void action.run(async()=>{await loginGoogle();retry();})}>Continuar con Google</button>
  <form className="password-access" onSubmit={event=>{
   event.preventDefault();const value=password;setPassword('');void action.run(async()=>{await loginPassword(email,value);retry();});
  }}>
   <label>Correo de tu cuenta administradora<input type="email" aria-label="Correo de administración" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required/></label>
   <label>Contraseña alternativa<input type="password" aria-label="Contraseña del panel" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>
   <button type="submit" className="secondary" disabled={action.busy||!password||!email.trim()}>Entrar al panel</button>
   <small>El acceso con contraseña se conserva hasta que cierres la pestaña.</small>
  </form>
  {user&&<button className="secondary" disabled={action.busy} onClick={()=>void action.run(onLogout)}>Cerrar sesión</button>}
  <Feedback {...action}/>
 </section>;
}

function Workspace({user,db,rtdb,onLogout}:{user:User;db:Firestore;rtdb:Database;onLogout:()=>Promise<void>}){
 const engine=useMemo(()=>createActions({db,rtdb}),[db,rtdb]);
 const {planRef}=engine;
 const action=useAction();
 const [page,setPage]=useState(currentPage),[snapshot,setSnapshot]=useState<OverviewSnapshot>();
 const [plan,setPlan]=useState<Plan>(),[planError,setPlanError]=useState(''),[retry,setRetry]=useState(0);
 const [preview,setPreview]=useState<{counts:Awaited<ReturnType<typeof engine.inspect>>} & ({kind:'estimate';cutoff:number}|{kind:'deleted'})>();
 const [confirmation,setConfirmation]=useState(''),[manualConfirmation,setManualConfirmation]=useState(''),[auto,setAuto]=useState(false),[now,setNow]=useState(Date.now());
 const [online,setOnline]=useState(()=>navigator.onLine),[published,setPublished]=useState(''),[versionError,setVersionError]=useState(''),[checkingVersion,setCheckingVersion]=useState(false);
 const attempted=useRef<number | undefined>(undefined);

 useEffect(()=>{
  const syncPage=()=>setPage(currentPage());
  const syncConnection=()=>setOnline(navigator.onLine);
  const timer=setInterval(()=>setNow(Date.now()),30000);
  window.addEventListener('hashchange',syncPage);window.addEventListener('online',syncConnection);window.addEventListener('offline',syncConnection);
  return()=>{clearInterval(timer);window.removeEventListener('hashchange',syncPage);window.removeEventListener('online',syncConnection);window.removeEventListener('offline',syncConnection);};
 },[]);
 useEffect(()=>{
  setPlanError('');
  return onSnapshot(planRef,s=>setPlan(s.data()||{}),()=>{setPlan(undefined);setAuto(false);setPlanError('No se pudo consultar el plan.');});
 },[planRef,retry]);
 const hasDate=validDate(plan?.nextDueAt);
 const due=hasDate&&(plan?.enabled||plan!.nextDueAt!>now)?plan!.nextDueAt!:engine.nextMonth(now);
 const leased=plan?.status==='running'&&(plan.leaseUntil??0)>now;
 const ready=!!plan&&!planError;
 const run=(manual=false)=>action.run(async()=>{
  setPreview(undefined);
  try{
   const result=await engine.executeDue(action.setMessage,manual);
   setPreview({kind:'deleted',counts:result});setConfirmation('');setManualConfirmation('');
  }catch(error){setAuto(false);throw error;}
  if(manual){action.setMessage('');return;}
  const latest=await getDoc(planRef).then(s=>s.data()).catch(()=>undefined);
  if(!latest||validDate(latest.nextDueAt)&&latest.nextDueAt<=Date.now()){
   setAuto(false);action.setMessage('Limpieza completada. Revisa la próxima fecha antes de continuar.');
  }else action.setMessage('Limpieza completada.');
 });
 useEffect(()=>{
  if(!auto||action.busy||!plan?.enabled||leased||!hasDate)return;
  const dueAt=plan.nextDueAt!;
  if(dueAt<=Date.now()&&attempted.current!==dueAt){attempted.current=dueAt;void run();}
 },[auto,action.busy,plan?.enabled,plan?.nextDueAt,leased,hasDate,now]);
 async function activate(){
  if(!confirm('¿Activar la limpieza mensual para la fecha mostrada?'))return;
  await runTransaction(db,async transaction=>{
   const current=(await transaction.get(planRef)).data();
   if(current?.enabled||Number(current?.leaseUntil)>Date.now())throw Error('El plan ya está activo o en ejecución.');
   transaction.set(planRef,{enabled:true,execution:'browser',firstDueAt:new Date(due).toISOString(),nextDueAt:due,warningDays:3,status:'scheduled',leaseUntil:0,manualCutoff:deleteField()},{merge:true});
  });
  action.setMessage('Plan mensual guardado.');
 }

 return <>
  <div className="heading dashboard-hero">
   <div><span className="eyebrow"><ShieldCheck size={16}/> ADMINISTRACIÓN DE NEXUS</span><h1>Dashboard</h1><p>Actividad, moderación y mantenimiento de Nexus Chat.</p></div>
   <div className="hero-art" aria-hidden="true"><img src="/nexus-icon.svg" width="112" height="112" alt=""/><span className="hero-orbit"/></div>
   <button className="secondary icon-action" disabled={action.busy} onClick={()=>void action.run(onLogout)}><LogOut size={17}/> Salir del panel</button>
  </div>
  <div className="dashboard-highlights">
   <section><small><ShieldCheck size={15}/> Cuenta autorizada</small><strong>{user.email||'Cuenta de Nexus'}</strong></section>
   <section><small><CalendarClock size={15}/> Limpieza mensual</small><strong>{!ready?'Sin comprobar':plan.enabled?'Plan activo':'Sin activar'}</strong>
    {ready&&plan.enabled&&hasDate&&<small>{dateLabel(plan.nextDueAt!)} · Ecuador</small>}</section>
   <section><small><LayoutDashboard size={15}/> Versión de Nexus</small><strong><span className="version-prefix">v</span>{version}</strong></section>
   <section><small>{online?<Wifi size={15}/>:<WifiOff size={15}/>} Navegador</small><strong>{online?'En línea':'Sin conexión'}</strong></section>
  </div>
  <nav className="dashboard-nav" aria-label="Secciones del dashboard">
   {navigation.map(([id,label,Icon])=><a key={id} href={'#'+id} aria-current={page===id?'page':undefined}><Icon size={18}/>{label}</a>)}
  </nav>
  <div className="dashboard-panels">
   <div hidden={page!=='resumen'}><Overview db={db} rtdb={rtdb} onData={setSnapshot}/></div>
   {page==='reportes'&&<MessageReports db={db}/>}
   {page==='avisos'&&<OfficialNotices db={db}/>}
   {page==='modo-ia'&&<DashboardAI db={db} rtdb={rtdb} user={user} snapshot={snapshot}/>}
   {page==='informes'&&<DashboardReport snapshot={snapshot} plan={ready?{enabled:!!plan.enabled,dueAt:hasDate?plan.nextDueAt:undefined}:undefined}/>}
   {page==='mantenimiento'&&<div className="grid">
    <section className="cleanup panel-card"><span className="badge">CONTENIDO Y ESPACIO</span><h2>Limpieza mensual</h2>
     <p>Revisa y programa la limpieza de mensajes, archivos de chats y estados. Se conservan las cuentas, contactos, grupos y perfiles.</p>
     {!ready&&<p role={planError?'alert':'status'}>{planError||'Comprobando el plan…'} {planError&&<button className="secondary" onClick={()=>setRetry(n=>n+1)}>Reintentar</button>}</p>}
     {ready&&plan.enabled&&!hasDate&&<p className="notice" role="alert">La fecha del plan no es válida. Páusalo y actívalo con una nueva fecha.</p>}
     {leased&&<p className="notice" role="status">Hay una limpieza en curso.</p>}
     {ready&&<div className="schedule"><small>{plan.enabled&&hasDate?'Próxima fecha':'Fecha propuesta'} · Ecuador</small><strong>{dateLabel(due)}</strong>
      {validDate(plan.lastCompletedAt)&&<small>Última ejecución · {dateLabel(plan.lastCompletedAt)}</small>}</div>}
     <div className="actions">
      <button disabled={action.busy||!ready||plan?.enabled||leased} onClick={()=>void action.run(activate)}>Activar plan mensual</button>
      <button className="secondary" disabled={action.busy||!ready||!plan?.enabled||leased} onClick={()=>void action.run(async()=>{
       await runTransaction(db,async transaction=>{
        const current=(await transaction.get(planRef)).data();
        if(Number(current?.leaseUntil)>Date.now())throw Error('Hay una limpieza en curso.');
        transaction.update(planRef,{enabled:false,manualCutoff:deleteField()});
       });setAuto(false);action.setMessage('Plan pausado.');
      })}>Pausar plan</button>
     </div>
     <label className="toggle"><input type="checkbox" checked={auto} disabled={action.busy||!ready||!plan?.enabled||!hasDate} onChange={e=>{attempted.current=undefined;setAuto(e.target.checked);}}/>Ejecutar al llegar la fecha mientras este panel esté abierto</label>
     <p className="notice">La ejecución automática requiere mantener el panel abierto y la sesión iniciada. El aviso a los usuarios se muestra tres días antes.</p>
     <button className="secondary" disabled={action.busy||!ready} onClick={()=>void action.run(async()=>{setPreview(undefined);const counts=await engine.inspect(due,false,action.setMessage);setPreview({kind:'estimate',counts,cutoff:due});action.setMessage('');})}>Revisar qué se eliminaría</button>
     {preview&&<div className="result" role="status"><h3>{preview.kind==='estimate'?'Vista previa de la limpieza':preview.counts.messages||preview.counts.statuses||preview.counts.files?'Contenido eliminado':'No se encontró contenido elegible'}</h3>{preview.kind==='estimate'&&<small>Estimación hasta {dateLabel(preview.cutoff)} · Ecuador</small>}<p>{preview.counts.messages} mensajes · {preview.counts.statuses} estados · {preview.counts.files} archivos · {(preview.counts.bytes/1048576).toFixed(2)} MB</p><small>{preview.counts.protectedFiles} archivos excluidos por protección o carga reciente.</small>{preview.kind==='deleted'&&<p>Realtime Database · {preview.counts.realtimeFiles} archivos encontrados y retirados. Firestore · {preview.counts.files} fichas de archivos retiradas.</p>}</div>}
     <div className="danger"><h3>Ejecución manual</h3><p>El borrado es irreversible y está disponible cuando llegue la fecha del plan.</p>
      <label htmlFor="cleanup-confirmation">Escribe BORRAR CONTENIDO</label><input id="cleanup-confirmation" aria-label="Confirmación de limpieza" value={confirmation} onChange={e=>setConfirmation(e.target.value)} autoComplete="off"/>
      <button disabled={action.busy||!ready||!plan?.enabled||!hasDate||leased||due>now||confirmation!=='BORRAR CONTENIDO'} onClick={()=>void run()}>Ejecutar limpieza pendiente</button>
     </div>
     <div className="danger"><h3>Ejecutar ahora</h3><p>Borra los mensajes, estados y archivos elegibles existentes hasta el momento de iniciar. Conserva perfiles, contactos, grupos y la fecha del plan mensual.</p>
      <label htmlFor="cleanup-now-confirmation">Escribe LIMPIAR AHORA</label>
      <input id="cleanup-now-confirmation" value={manualConfirmation} onChange={e=>setManualConfirmation(e.target.value)} autoComplete="off"/>
      <button type="button" disabled={action.busy||!ready||leased||manualConfirmation!=='LIMPIAR AHORA'} onClick={()=>{
       if(confirm('¿Ejecutar la limpieza inmediata? El contenido eliminado no se puede recuperar.')){setAuto(false);void run(true);}
      }}>Ejecutar limpieza ahora</button>
     </div>
    </section>
    <div className="side">
     <MaintenanceMode db={db}/>
     <section className="panel-card"><span className="badge">PUBLICACIÓN</span><h2>Versión de Nexus</h2><strong className="version-value">v{version}</strong>
      {published&&<p role="status">La versión de Nexus es <span className="version-prefix">v</span>{published}. {published===version?'No hay actualizaciones disponibles.':'Hay una actualización disponible para este panel. Recarga para abrirla.'}</p>}
      {versionError&&<p role="alert">{versionError}</p>}
      <button className="secondary" disabled={checkingVersion} onClick={async()=>{
       setCheckingVersion(true);setVersionError('');setPublished('');
       try{const response=await fetch('/release.json',{cache:'no-store',signal:AbortSignal.timeout(12000)});
       if(!response.ok)throw Error('No se pudo comprobar la versión.');
       const data=await response.json();
       if(typeof data.version!=='string'||!/^\d+\.\d+(?:\.\d+)?$/.test(data.version))throw Error('La publicación no indica una versión válida.');
       setPublished(data.version);
       }catch{setVersionError('No se pudo comprobar la versión. Intenta de nuevo.');}
       finally{setCheckingVersion(false);}
      }}>{checkingVersion?'Comprobando versión…':'Comprobar versión'}</button>
     </section>
     <section className="panel-card"><span className="badge">ESTE NAVEGADOR</span><h2>Caché de actualizaciones</h2>
      <p>Libera las descargas de versiones guardadas en este equipo.</p>
      <button className="secondary" disabled={action.busy} onClick={()=>void action.run(async()=>{
       if(!confirm('¿Eliminar solo la caché de actualizaciones de este navegador?'))return;
       if(!('caches' in window))throw Error('Este navegador no permite administrar la caché.');
       const keys=(await caches.keys()).filter(key=>key.startsWith('nexus-update-'));
       await Promise.all(keys.map(key=>caches.delete(key)));
       action.setMessage(keys.length?'Caché de actualizaciones liberada.':'No hay descargas de versiones guardadas.');
      })}>Liberar caché local</button>
     </section>
    </div>
   </div>}
  </div>
  <Feedback {...action}/>
 </>;
}
function Dashboard(){
 const {user,allowed,checking,error,retry,db,rtdb,sessionAuth}=useDashboardSession();
 const logout=()=>logoutDashboard(sessionAuth);
 return <>
  <header className="dashboard-header"><a href="/dashboard.html" className="dashboard-brand"><img src="/nexus-icon.svg" width="42" height="42" alt=""/><span>Dashboard · Nexus Chat<small>Panel privado</small></span></a>
   <a className="dashboard-open" href="/">Abrir Nexus <ArrowUpRight size={16}/></a></header>
  <main>{checking?<section className="panel-card"><h1>Comprobando acceso…</h1></section>:allowed&&user
   ?<Workspace key={user.uid+sessionAuth.app?.name} user={user} db={db} rtdb={rtdb} onLogout={logout}/>
   :<Access user={user} error={error} retry={retry} onLogout={logout}/>}</main>
  <footer>Dashboard · Nexus Chat <span>v{version}</span></footer>
 </>;
}
createRoot(document.getElementById('root')!).render(<Dashboard/>);
