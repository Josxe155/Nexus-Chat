import type {AssistantAction} from './assistantActionCore';
type Turn={actions?:unknown[]};
export const isAssistantConfirmation=(text:string)=>/^CONFIRMAR$/iu.test(text.trim());
export function latestAssistantProposal(turns:Turn[],actor:string,now=Date.now()):AssistantAction{
 // Never fall back to an older proposal after confirming the latest one.
 const turn=[...turns].reverse().find(turn=>Array.isArray(turn.actions)&&turn.actions.length);
 if(!turn)throw Error('No hay una propuesta pendiente. Pide preparar un cambio primero.');
 const actions=[...new Map((turn.actions as AssistantAction[]).map(action=>[action.id,action])).values()];
 const pending=actions.filter(action=>!action.executedAt);
 if(!pending.length)throw Error('La última propuesta ya se ejecutó. Pide preparar un cambio nuevo.');
 if(pending.length!==1)throw Error('Hay varios cambios en la última propuesta. Pide preparar un único cambio y después escribe CONFIRMAR.');
 const action=pending[0];
 if(action.actor!==actor)throw Error('Esta propuesta pertenece a otra sesión de administración. Solicita una nueva.');
 if(!Number.isFinite(action.createdAt)||action.createdAt>now+60000||now-action.createdAt>86400000)throw Error('La propuesta ya no está vigente. Solicita una nueva.');
 return action;
}
export function simpleConfirmationText(text:string){
 // Preserve message data, JSON previews and code. Only shorten instruction lines.
 return text.split(/(```[\s\S]*?(?:```|$)|`[^`\n]*`)/g).map((part,index)=>index%2?part:part
  .replace(/^([ \t]*(?:Para (?:ejecutarlo|confirmarlo|confirmar|continuar)\s+)?(?:escribe|env[ií]a|responde con)\s+(?:\*\*)?)(?:CONFIRMAR|LIMPIAR AHORA)\s+[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}\b/gimu,'$1CONFIRMAR')
  .replace(/^([ \t]*(?:\*\*)?)(?:CONFIRMAR|LIMPIAR AHORA)\s+[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}((?:\*\*)?[.!]?[ \t]*)$/gimu,'$1CONFIRMAR$2')).join('');
}
export function confirmationProposals(plans:AssistantAction[]){
 const pending=plans.filter(plan=>!plan.executedAt);if(!pending.length)return '';
 const details=pending.map(plan=>'\n\nCambio preparado: **'+({create:'crear',update:'actualizar',delete:'eliminar',cleanup:'limpieza'}[plan.operation])+'** en `'+plan.path+'`.\n```json\n'+JSON.stringify(plan.data,null,2)+'\n```').join('');
 return details+(pending.length===1?'\nPara ejecutarlo escribe **CONFIRMAR**.':'\nHay varios cambios preparados. Pide preparar un único cambio y después escribe **CONFIRMAR**.');
}
