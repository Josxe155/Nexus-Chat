import {useMobileBack} from './useMobileBack';
import {useState} from 'react';
import {ArrowLeft,ChevronRight,Info,Images,Search,Bell,BellOff,Timer,Palette,Download,Trash2,LogOut,Shield,Flag,UserPlus,MoreHorizontal} from 'lucide-react';
export default function MobileChatOptions({group,canEdit,canAdd,muted,onAction}:{group:boolean;canEdit:boolean;canAdd:boolean;muted:boolean;onAction:(action:string)=>void}){
 const [more,setMore]=useState(false);
 useMobileBack(more,()=>setMore(false),110);
 const entries=more?[['export','Exportar chat'],['clear','Vaciar chat'],[group?'leave':'block',group?'Salir del grupo':'Bloquear contacto'],['report',group?'Reportar grupo':'Reportar contacto'],...(!group?[['delete','Eliminar chat']]:[])]:[...(group&&canAdd?[['members','Añadir miembro']]:[]),['info',group?'Info. del grupo':'Ver contacto'],['files','Archivos, enlaces y documentos'],['search','Buscar'],['mute',muted?'Desactivar silencio de notificaciones':'Silenciar notificaciones'],...(canEdit?[['temporary','Mensajes temporales']]:[]),['appearance','Estilo del chat']];
 const icons:Record<string,typeof Info>={info:Info,files:Images,search:Search,mute:muted?Bell:BellOff,temporary:Timer,appearance:Palette,export:Download,clear:Trash2,leave:LogOut,block:Shield,report:Flag,delete:Trash2,members:UserPlus};
 return <>{more&&<button role="menuitem" onClick={()=>setMore(false)}><ArrowLeft size={19}/>Volver</button>}{entries.map(([action,label])=>{const Icon=icons[action];return <button role="menuitem" key={action} onClick={()=>onAction(action)}><Icon size={19} aria-hidden="true"/><span>{label}</span></button>;})}{!more&&<button role="menuitem" aria-haspopup="menu" aria-expanded={false} onClick={()=>setMore(true)}><MoreHorizontal size={19}/><span>Más</span><ChevronRight size={18}/></button>}</>;
}
