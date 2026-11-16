import {useEffect,useState} from 'react';
import {ShieldX} from 'lucide-react';
import './blocked-account.css';
export default function BlockedAccount({onLogout,theme='dark'}:{onLogout:()=>Promise<void>;theme?:'light'|'dark'}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{if(!error)return;const timer=setTimeout(()=>setError(''),3000);return()=>clearTimeout(timer);},[error]);
 return <main className="blocked-account" data-theme={theme}><section aria-labelledby="blocked-account-title">
  <img src="/icons/nexus-192.png" width="96" height="96" alt="Nexus Chat"/>
  <ShieldX className="blocked-account-symbol" size={30} aria-hidden="true"/>
  <h1 id="blocked-account-title">Esta cuenta ha sido bloqueada</h1>
  <p>Esta cuenta no puede usar Nexus Chat debido a una medida de seguridad.</p>
  <button disabled={busy} onClick={async()=>{if(busy)return;setBusy(true);try{await onLogout();}catch{setError('No se pudo cerrar la sesión. Inténtalo de nuevo.');}finally{setBusy(false);}}}>{busy?'Cerrando sesión…':'Cerrar sesión'}</button>
  {error&&<p className="blocked-account-error" role="alert">{error}</p>}
 </section></main>;
}
