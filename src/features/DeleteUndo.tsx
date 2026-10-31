import {useEffect,useRef,useState} from 'react';
import {restoreHiddenMessages,type HiddenTicket} from './PersonalState';
export function useDeleteUndo(uid:string){
 const [ticket,setTicket]=useState<HiddenTicket|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const alive=useRef(true);useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useEffect(()=>{setTicket(null);setError('');},[uid]);
 useEffect(()=>{if(!ticket)return;const timer=setTimeout(()=>setTicket(null),Math.max(0,ticket.at+5000-Date.now()));return()=>clearTimeout(timer);},[ticket]);
 return {offer:(value:HiddenTicket)=>{if(value.messages.length){setError('');setTicket(value);}},notice:ticket?<aside className="message-undo-notice" role="status"><span>{ticket.messages.length===1?'Mensaje eliminado para ti.':'Mensajes eliminados para ti.'}</span><button disabled={busy} onClick={async()=>{if(busy||Date.now()>ticket.at+5000){setTicket(null);return;}setBusy(true);try{await restoreHiddenMessages(uid,ticket);if(alive.current)setTicket(null);}catch{if(alive.current)setError('No se pudo deshacer. Inténtalo con conexión.');}finally{if(alive.current)setBusy(false);}}}>Deshacer</button>{error&&<small role="alert">{error}</small>}</aside>:null};
}
