import {useMobileBack} from './useMobileBack';
import {useState} from 'react';
import {ArrowLeft,ChevronRight} from 'lucide-react';
export default function MobileChatOptions({group,canEdit,canAdd,muted,onAction}:{group:boolean;canEdit:boolean;canAdd:boolean;muted:boolean;onAction:(action:string)=>void}){
 const [more,setMore]=useState(false);
 useMobileBack(more,()=>setMore(false),110);
 const entries=more?[['export','Exportar chat'],['clear','Vaciar chat'],[group?'leave':'block',group?'Salir del grupo':'Bloquear contacto'],['report',group?'Reportar grupo':'Reportar contacto'],...(!group?[['delete','Eliminar chat']]:[])]:[...(group&&canAdd?[['members','Añadir miembro']]:[]),['info',group?'Info. del grupo':'Ver contacto'],['files','Archivos, enlaces y documentos'],['search','Buscar'],['mute',muted?'Desactivar silencio de notificaciones':'Silenciar notificaciones'],...(canEdit?[['temporary','Mensajes temporales']]:[]),['appearance','Estilo del chat']];
 return <>{more&&<button role="menuitem" onClick={()=>setMore(false)}><ArrowLeft size={18}/>Volver</button>}{entries.map(([action,label])=><button role="menuitem" key={action} onClick={()=>onAction(action)}>{label}</button>)}{!more&&<button role="menuitem" aria-haspopup="menu" onClick={()=>setMore(true)}>Más<ChevronRight size={18}/></button>}</>;
}
