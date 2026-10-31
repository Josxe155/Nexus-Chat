import {useEffect,useState} from 'react';
import {uuid} from './uuid';
// Only one tab handles incoming calls. This does not link devices or accounts.
export function useCallInboxOwner(uid:string){
 const [owner,setOwner]=useState(false);
 useEffect(()=>{let live=true,release:()=>void=()=>{};setOwner(false);
 if(navigator.locks){const controller=new AbortController();navigator.locks.request('nexus-call-inbox:'+uid,{signal:controller.signal},async()=>{if(!live)return;setOwner(true);await new Promise<void>(resolve=>release=resolve);}).catch(()=>{});return()=>{live=false;controller.abort();release();};}
 const key='nexus-call-inbox:'+uid,id=uuid();const tick=()=>{try{const value=JSON.parse(localStorage.getItem(key)||'null');if(!value||value.until<Date.now()||value.id===id){localStorage.setItem(key,JSON.stringify({id,until:Date.now()+12000}));setOwner(true);}else setOwner(false);}catch{setOwner(true);}};tick();const timer=setInterval(tick,4000);window.addEventListener('storage',tick);return()=>{live=false;clearInterval(timer);window.removeEventListener('storage',tick);try{if(JSON.parse(localStorage.getItem(key)||'null')?.id===id)localStorage.removeItem(key);}catch{}};
 },[uid]);return owner;
}
