import {useEffect,useState} from 'react';
import {doc,onSnapshot,serverTimestamp,setDoc,type Firestore} from 'firebase/firestore';
import {Eye,Wrench} from 'lucide-react';

export default function MaintenanceMode({db}:{db:Firestore}){
 const [active,setActive]=useState<boolean>();
 const [busy,setBusy]=useState(false),[retry,setRetry]=useState(0),[error,setError]=useState('');
 const [message,setMessage]=useState('');
 useEffect(()=>{
  setError('');
  return onSnapshot(doc(db,'publicConfig','availability'),{includeMetadataChanges:true},snapshot=>{
   if(!snapshot.metadata.fromCache&&!snapshot.metadata.hasPendingWrites)setActive(snapshot.data()?.maintenance===true);
  },()=>{setActive(undefined);setError('No se pudo comprobar el modo mantenimiento.');});
 },[db,retry]);
 async function change(){
  if(active===undefined||busy)return;
  const next=!active;
  if(next&&!confirm('¿Mostrar el aviso de mantenimiento a todos los visitantes? El dashboard seguirá disponible.'))return;
  setBusy(true);setError('');setMessage('');
  try{
   await setDoc(doc(db,'publicConfig','availability'),{maintenance:next,updatedAt:serverTimestamp()});
   setMessage(next?'Aviso de mantenimiento activado.':'Nexus Chat está disponible de nuevo.');
  }catch{setError('No se pudo guardar el estado. Comprueba la conexión y vuelve a intentarlo.');}
  finally{setBusy(false);}
 }
 return <section className="panel-card maintenance-mode">
  <span className="badge"><Wrench size={15}/> DISPONIBILIDAD DE LA WEB</span>
  <h2>Modo mantenimiento</h2>
  <p>Muestra un aviso en Nexus Chat para celular, tablet y computadora. Puedes volver aquí para desactivarlo.</p>
  <div className="maintenance-indicator" data-active={active===true}><span/>{active===undefined?'Comprobando…':active?'Mantenimiento activo':'Sitio disponible'}</div>
  <div className="actions">
   <button type="button" disabled={active===undefined||busy} onClick={()=>void change()}>{active?'Desactivar mantenimiento':'Activar mantenimiento'}</button>
   {active===undefined&&error&&<button type="button" className="secondary" onClick={()=>setRetry(n=>n+1)}>Reintentar</button>}
  </div>
  {message&&<p role="status">{message}</p>}
  {error&&<p role="alert">{error}</p>}
  <details className="report-preview"><summary><Eye size={16}/> Vista previa del aviso</summary><h3>Nexus Chat está en mantenimiento</h3><p>Estamos preparando mejoras. Vuelve en unos minutos.</p></details>
 </section>;
}
