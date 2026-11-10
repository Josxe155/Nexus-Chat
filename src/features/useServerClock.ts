import {useEffect,useState} from 'react';
import {onValue,ref,type Database} from 'firebase/database';
import {rtdb} from '../firebase';
/** Compare last-seen timestamps against Firebase time even if a device clock is wrong. */
export default function useServerClock(interval=1000,database:Database=rtdb){
 const [now,setNow]=useState(Date.now());
 useEffect(()=>{let offset=0;const tick=()=>setNow(Date.now()+offset);const stop=onValue(ref(database,'.info/serverTimeOffset'),snapshot=>{const value=snapshot.val();offset=typeof value==='number'&&Number.isFinite(value)?value:0;tick();},()=>{});const timer=setInterval(tick,interval);window.addEventListener('pageshow',tick);return()=>{stop();clearInterval(timer);window.removeEventListener('pageshow',tick);};},[interval,database]);
 return now;
}
