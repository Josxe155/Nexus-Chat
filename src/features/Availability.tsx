import {useEffect,useState} from 'react';
import {doc,onSnapshot} from 'firebase/firestore';
import {RefreshCw,Wrench} from 'lucide-react';
import {db} from '../firebase';
import './availability.css';

type Mode='online'|'maintenance'|'disabled';
export default function Availability({children}:{children:React.ReactNode}){
 const [staticMode,setStaticMode]=useState<Mode>('online'),[maintenance,setMaintenance]=useState(false);
 const [ready,setReady]=useState(false);
 const [attempt,setAttempt]=useState(0);
 useEffect(()=>{
  let live=true;
  const check=()=>fetch('/availability.json',{cache:'no-store',signal:AbortSignal.timeout(5000)})
   .then(response=>response.ok?response.json():null).then(data=>{
    if(live&&['online','maintenance','disabled'].includes(data?.mode))setStaticMode(data.mode);
   }).catch(()=>{});
  void check();
  const fallback=setTimeout(()=>setReady(true),2200);
  const timer=setInterval(check,60000);
  const unsubscribe=onSnapshot(doc(db,'publicConfig','availability'),{includeMetadataChanges:true},snapshot=>{
   if(!live||(snapshot.metadata.fromCache&&!snapshot.exists()))return;
   setMaintenance(snapshot.data()?.maintenance===true);
   setReady(true);
  },()=>{if(live)setReady(true);});
  return()=>{live=false;clearTimeout(fallback);clearInterval(timer);unsubscribe();};
 },[attempt]);
 if(staticMode==='disabled')return <iframe title="Disponibilidad de Nexus Chat" src="/error.html?mode=disabled" style={{position:'fixed',inset:0,width:'100%',height:'100%',border:0}}/>;
 if(staticMode==='maintenance'||maintenance)return <main className="nexus-maintenance">
  <section aria-labelledby="nexus-maintenance-title">
   <span className="nexus-maintenance-brand"><img src="/nexus-icon.svg" alt="" width="32" height="32"/> Nexus Chat</span>
   <div className="nexus-maintenance-icon"><Wrench aria-hidden="true"/></div>
   <small>PAUSA PROGRAMADA</small>
   <h1 id="nexus-maintenance-title">Nexus Chat está en mantenimiento</h1>
   <p>Estamos preparando mejoras. Vuelve en unos minutos. Esta pantalla se quitará cuando Nexus vuelva a estar disponible.</p>
   <button type="button" onClick={()=>setAttempt(n=>n+1)}><RefreshCw size={17}/> Comprobar disponibilidad</button>
  </section>
 </main>;
 if(!ready)return <div className="nexus-maintenance nexus-availability-loading" role="status"><img src="/nexus-icon.svg" width="44" height="44" alt="Nexus Chat"/></div>;
 return children;
}
