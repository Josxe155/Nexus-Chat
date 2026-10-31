import {useEffect,useRef} from 'react';

// One same-document history entry protects the current mobile screen. Each
// overlay registers its own close action; the last opened one closes first.
const layers=new Map<symbol,{close:()=>void;priority:number}>();
let armed=false,removing=false,scheduled=false,installed=false;
function sync(){
 if(scheduled)return;scheduled=true;
 setTimeout(()=>{scheduled=false;if(removing)return;
  if(layers.size&&!armed){history.pushState({...history.state,nexusMobileLayer:true},'',location.href);armed=true;}
  else if(!layers.size&&armed){armed=false;removing=true;history.back();}
 },0);
}
function install(){if(installed)return;installed=true;window.addEventListener('popstate',()=>{
 if(removing){removing=false;sync();return;}
 if(!armed)return;armed=false;
 const layer=Array.from(layers.values()).sort((a,b)=>a.priority-b.priority).at(-1);layer?.close();sync();
});}
export function useMobileBack(active:boolean,onBack:()=>void,priority=50){
 const callback=useRef(onBack);callback.current=onBack;
 useEffect(()=>{if(!active)return;install();const key=Symbol(),query=matchMedia('(max-width:1023px), (hover:none) and (max-width:1366px)');
  const update=()=>{if(query.matches){if(!layers.has(key))layers.set(key,{close:()=>callback.current(),priority});}else layers.delete(key);sync();};
  update();query.addEventListener('change',update);return()=>{query.removeEventListener('change',update);layers.delete(key);sync();};},[active,priority]);
}
