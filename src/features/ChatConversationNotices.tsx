import {MessageCircle} from 'lucide-react';
export function ConversationStartNotice(){return <div className="conversation-start-wrap"><div className="conversation-start-notice" role="note"><MessageCircle size={22} aria-hidden="true"/><span>Este puede ser el comienzo de una buena conversación. Comparte un saludo, una foto o una nota de voz para empezar a conectar.</span></div></div>;}
function DisappearingTimer(){return <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3a9 9 0 1 0 8.5 12"/><path d="M12 7v5l3-2"/><path d="m17 4 .1 .1M20 7l.1 .1M21 11l.1 .1"/></svg>;}
export function DisappearingDurationNotice({duration,onChange}:{duration:number;onChange:()=>void}){
 const label=duration===86400000?'24 horas':duration===604800000?'7 días':duration===7776000000?'90 días':null;
 if(!label)return null;
 return <div className="mobile-temporary-notice temporary-duration-notice conversation-duration-reference" role="note"><span><DisappearingTimer/> Se actualizó la duración de los mensajes. Los mensajes nuevos desaparecerán de este chat después de {label} de haber sido enviados, a menos que se use la opción para conservarlos. <button type="button" onClick={onChange}>Cambiar duración</button></span></div>;
}
