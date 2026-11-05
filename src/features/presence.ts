import type {UserProfile} from '../types';
export function presenceFor(user:UserProfile,sessions:any,lastSeen:any,available=true){
 const entries=sessions&&typeof sessions==='object'?Object.values(sessions):[];
 return {...user,online:available&&!user.privacy?.hideOnline&&entries.some(value=>value===true),lastSeen:user.privacy?.hideLastSeen?0:typeof lastSeen==='number'&&Number.isFinite(lastSeen)?lastSeen:(user.privacy?.schemaVersion===2?0:user.lastSeen||0)};
}
export function lastSeenLabel(value:number,now=Date.now(),_mobile=false){
 if(!Number.isFinite(value)||value<=0||value>now+60000)return '';
 const seen=new Date(Math.min(value,now)),today=new Date(now),yesterday=new Date(now);yesterday.setDate(yesterday.getDate()-1);
 const same=(a:Date,b:Date)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
 const time=seen.toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit',hour12:false});
 if(same(seen,today))return `últ. vez hoy a las ${time}`;
 if(same(seen,yesterday))return `últ. vez ayer a las ${time}`;
 return `últ. vez el ${seen.toLocaleDateString('es',{day:'2-digit',month:'2-digit',year:'numeric'})} a las ${time}`;
}
