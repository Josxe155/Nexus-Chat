import {doc,updateDoc} from 'firebase/firestore';
import {db} from '../firebase';
const INTERVAL=6*3600000;
export function activityDue(guest:boolean,last:number,now=Date.now()){return guest&&now-last>=INTERVAL;}
const pending=new Map<string,Promise<void>>();
export async function touchGuestActivity(uid:string,guest:boolean,last=0){
 if(!guest)return;
 let saved=0;try{saved=Number(localStorage.getItem('nexus-last-activity:'+uid))||0;}catch{}
 if(!activityDue(guest,Math.max(last,saved)))return;
 if(pending.has(uid))return pending.get(uid);
 const task=(async()=>{const now=Date.now();await updateDoc(doc(db,'users',uid),{lastActiveAt:now,isGuest:true});try{localStorage.setItem('nexus-last-activity:'+uid,String(now));}catch{}})();
 pending.set(uid,task);try{await task;}finally{pending.delete(uid);}
}
