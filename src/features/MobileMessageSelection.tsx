import {useLayoutEffect,useRef,useState} from 'react';
import {ArrowLeft,Bookmark,CornerUpLeft,Edit3,Forward,MoreVertical,Plus,Trash2} from 'lucide-react';
import FloatingMenu from './FloatingMenu';
import {useMobileBack} from './useMobileBack';
export type MobileSelectionAction='reply'|'edit'|'star'|'delete'|'forward'|'copy'|'keep'|'info'|'pin'|'ai'|'translate'|'report';
type Props={ids:string[];mine:boolean;editable:boolean;kept:boolean;temporary:boolean;starred:boolean;pinned:boolean;canPin:boolean;canForward:boolean;canReact:boolean;canTranslate:boolean;onAction:(action:MobileSelectionAction)=>void;onReact:(emoji:string)=>void;onMoreReactions:()=>void;onClose:()=>void};
export default function MobileMessageSelection(p:Props){
 const [more,setMore]=useState(false),[anchor,setAnchor]=useState({x:0,y:0}),[reactionStyle,setReactionStyle]=useState<{left:number;top:number;width:number}>(),host=useRef<HTMLDivElement>(null);
 const single=p.ids.length===1;
 useMobileBack(more,()=>setMore(false),80);
 useLayoutEffect(()=>{setMore(false);let frame=0;const place=()=>{const node=document.getElementById('message-'+p.ids[0]),room=node?.closest('.nexus-chat-window'),history=node?.closest('.chat-history');if(!single||!node||!room||!history){setReactionStyle(undefined);return;}const r=room.getBoundingClientRect(),m=node.getBoundingClientRect(),h=history.getBoundingClientRect();if(m.bottom<h.top+10||m.top>h.bottom-10){setReactionStyle(undefined);return;}const width=Math.max(0,r.width-16),top=Math.max(h.top+4,Math.min(m.top-62,h.bottom-60));setReactionStyle({left:r.left+8,top,width});};const update=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(place);};place();window.addEventListener('scroll',update,true);window.addEventListener('resize',update);const observer=new ResizeObserver(update);if(host.current?.parentElement)observer.observe(host.current.parentElement);return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('scroll',update,true);window.removeEventListener('resize',update);};},[p.ids.join('|'),single]);
 const run=(action:MobileSelectionAction)=>{setMore(false);p.onAction(action);};
 return <><div ref={host} className="mobile-selection-header" role="toolbar" aria-label="Mensajes seleccionados"><button aria-label="Cancelar selección" onClick={p.onClose}><ArrowLeft/></button><strong aria-live="polite">{p.ids.length}</strong><span/>{single&&<button aria-label="Responder" onClick={()=>run('reply')}><CornerUpLeft/></button>}{single&&<button aria-label={p.editable?'Editar mensaje':p.starred?'Quitar de destacados':'Destacar mensaje'} onClick={()=>run(p.editable?'edit':'star')}>{p.editable?<Edit3/>:<Bookmark fill={p.starred?'currentColor':'none'}/>}</button>}<button aria-label="Eliminar seleccionados" disabled={!p.ids.length} onClick={()=>run('delete')}><Trash2/></button><button aria-label="Reenviar seleccionados" disabled={!p.canForward} onClick={()=>run('forward')}><Forward/></button><button aria-label="Más opciones de selección" aria-expanded={more} onClick={e=>{const rect=e.currentTarget.getBoundingClientRect();setAnchor({x:rect.right-260,y:rect.bottom+4});setMore(!more);}}><MoreVertical/></button></div>
 {single&&p.canReact&&reactionStyle&&<div className="mobile-selection-reactions" role="toolbar" aria-label="Reaccionar al mensaje seleccionado" style={reactionStyle}><div>{['👍','❤️','😂','😮','😢','🙏','😐','🔥','💯'].map(emoji=><button key={emoji} aria-label={'Reaccionar '+emoji} onClick={()=>p.onReact(emoji)}>{emoji}</button>)}</div><button className="mobile-reaction-more" aria-label="Más reacciones" onClick={p.onMoreReactions}><Plus/></button></div>}
 {more&&<FloatingMenu at={anchor} label="Opciones del mensaje seleccionado" className="mobile-selection-overflow" onClose={()=>setMore(false)}>
 {single&&p.mine&&p.temporary&&<button role="menuitem" onClick={()=>run('keep')}>{p.kept?'Dejar de conservar':'Conservar'}</button>}
 {single&&p.mine&&<button role="menuitem" onClick={()=>run('info')}>Info.</button>}
 <button role="menuitem" onClick={()=>run('copy')}>Copiar</button>
 {single&&p.canPin&&p.canReact&&<button role="menuitem" onClick={()=>run('pin')}>{p.pinned?'Desfijar':'Fijar'}</button>}
 {single&&!p.mine&&<button role="menuitem" onClick={()=>run('ai')}>Preguntar a Nexus AI</button>}
 {single&&p.canTranslate&&<button role="menuitem" onClick={()=>run('translate')}>Traducir</button>}
 {single&&!p.mine&&<button role="menuitem" onClick={()=>run('report')}>Reportar</button>}
 </FloatingMenu>}</>;
}
