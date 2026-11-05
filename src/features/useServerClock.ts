import {useEffect,useState} from 'react';
import {onValue,ref} from 'firebase/database';
import {rtdb} from '../firebase';
/** Compare last-seen timestamps against Firebase time even if a device clock is wrong. */
export default function useServerClock(){
 const [now,setNow]=useState(Date.now());
 useEffect(()=>{let offset=0;const tick=()=>setNow(Date.now()+offset);const stop=onValue(ref(rtdb,'.info/serverTimeOffset'),snapshot=>{const value=snapshot.val();offset=typeof value==='number'&&Number.isFinite(value)?value:0;tick();},()=>{});const timer=setInterval(tick,1000);window.addEventListener('pageshow',tick);return()=>{stop();clearInterval(timer);window.removeEventListener('pageshow',tick);};},[]);
 return now;
}
