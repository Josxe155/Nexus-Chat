import {draftError,limitAnswer} from './assistantLimits';
import {useEffect,useRef,useState} from 'react';
import {Send,Sparkles,Square} from 'lucide-react';
import type {Firestore} from 'firebase/firestore';
import type {Database} from 'firebase/database';
import type {User} from 'firebase/auth';
import {createDashboardReader,dataMap,readDeclarations} from './aiReads';
import {requestsImmediateAction} from './assistantActionCore';
import {actionDeclarations,createAssistantActions,type AssistantAction} from './assistantActions';
import {loadAssistantHistory,saveAssistantHistory,assistantContextHistory,localHistoryDeclaration,searchAssistantHistory,assistantAnchorValid,historyKey,clearAssistantHistory,type StoredTurn} from './assistantHistory';
import {DictateQuestion,SpeakAnswer} from './dashboardSpeech';
import TransientNotice from './TransientNotice';
import {verifyDashboardAccess} from './session';
import type {OverviewSnapshot} from './Overview';
import {version} from '../webVersion.json';
import {parseMessageEditCommand} from './messageEditCommand';
import {editMessageByCommand} from './editMessage';
import RichText from '../features/RichText';

function proposals(plans:AssistantAction[]){return plans.filter(plan=>!plan.executedAt).map(plan=>'\n\nCambio preparado: **'+({create:'crear',update:'actualizar',delete:'eliminar',cleanup:'limpieza'}[plan.operation])+'** en `'+plan.path+'`.\n```json\n'+JSON.stringify(plan.data,null,2)+'\n```\nPara ejecutarlo escribe **'+(plan.kind==='cleanup'?'LIMPIAR AHORA ':'CONFIRMAR ')+plan.id+'**.').join('');}
export default function DashboardAI({db,rtdb,user,snapshot}:{db:Firestore;rtdb:Database;user:User;snapshot?:OverviewSnapshot}){
 const [question,setQuestion]=useState(''),[error,setError]=useState('');
 const [turns,setTurns]=useState<StoredTurn[]>([]),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[committing,setCommitting]=useState(false);
 const request=useRef<AbortController|null>(null),baseDraft=useRef(''),storageFailed=useRef(false),historyOwner=useRef('');
 const bottom=useRef<HTMLDivElement|null>(null);
 const answer=[...turns].reverse().find(turn=>turn.answer)?.answer||'';
 useEffect(()=>{let live=true;const load=async()=>{setReady(false);storageFailed.current=false;try{const history=await loadAssistantHistory(user.uid);if(live){historyOwner.current=user.uid;setTurns(history);}}catch{if(live){setTurns([]);setError('No se pudo abrir el historial local. Esta conversación permanecerá solo durante la sesión.');storageFailed.current=true;}}finally{if(live)setReady(true);}};void load();const clear=()=>{request.current?.abort();void load();};const focus=()=>{void assistantAnchorValid().then(valid=>{if(live&&!valid)clear();});};const storage=(event:StorageEvent)=>{if(event.newValue===null&&(event.key===null||event.key===historyKey(user.uid)))clear();};window.addEventListener('nexus:assistant-history-cleared',clear);window.addEventListener('focus',focus);window.addEventListener('storage',storage);return()=>{live=false;window.removeEventListener('nexus:assistant-history-cleared',clear);window.removeEventListener('focus',focus);window.removeEventListener('storage',storage);};},[user.uid]);
 useEffect(()=>{if(!ready||storageFailed.current||historyOwner.current!==user.uid)return;try{saveAssistantHistory(user.uid,turns);}catch{storageFailed.current=true;setError('No se pudo guardar el historial local. Revisa el espacio y los permisos del navegador.');}},[turns,ready,user.uid]);
 useEffect(()=>{bottom.current?.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});},[turns,busy]);
 useEffect(()=>()=>{request.current?.abort();request.current=null;},[]);
 async function ask(){
  if(request.current||!question.trim()||!ready)return;
  const invalid=draftError(question);if(invalid){setError(invalid);return;}
  const prompt=question.trim();
  if(/^(?:borra|elimina|vac[ií]a|limpia)\s+(?:(?:el|este)\s+)?(?:historial|conversaci[oó]n)(?:\s+local)?(?:\s+(?:de\s+Nexus\s+Assistant|del\s+asistente))?\s*[.!]?$/iu.test(prompt)){clearAssistantHistory(user.uid);setQuestion('');return;}
  const controller=new AbortController();request.current=controller;
  let timer=setTimeout(()=>controller.abort('timeout'),600000);const index=turns.length,plans:AssistantAction[]=[],executed:string[]=[];
  const complete=(text:string,actions:AssistantAction[]=plans)=>setTurns(previous=>previous.map((turn,i)=>i===index?{...turn,answer:limitAnswer(text).text,...(actions.length?{actions}:{} )}:turn));
  const commit=()=>{clearTimeout(timer);setCommitting(true);};
  setTurns(previous=>[...previous,{question:prompt,answer:'',at:Date.now()}]);setQuestion('');setBusy(true);setError('');
  try{
   if(!await verifyDashboardAccess(user,db))throw Error('Tu acceso de administración ya no está disponible.');
   const actions=createAssistantActions(db,rtdb,user,plan=>plans.push(plan));
   const confirmation=/^(CONFIRMAR|LIMPIAR AHORA)\s+([a-f0-9-]{36})$/i.exec(prompt);
   if(confirmation){
    const action=turns.flatMap(turn=>(turn.actions||[]) as AssistantAction[]).find(plan=>plan.id===confirmation[2]);
    if(!action)throw Error('No se encontró esa propuesta en el historial local. Solicita una nueva.');
    if(action.executedAt)throw Error('Esa propuesta ya se ejecutó. Solicita otra si necesitas un nuevo cambio.');
    if(action.kind==='cleanup'&&confirmation[1].toUpperCase()!=='LIMPIAR AHORA')throw Error('Para la limpieza escribe LIMPIAR AHORA seguido del identificador.');
    complete(await actions.execute(action,controller.signal,commit));
    setTurns(previous=>previous.map(turn=>({...turn,...(turn.actions?{actions:(turn.actions as AssistantAction[]).map(plan=>plan.id===action.id?{...plan,executedAt:Date.now()}:plan)}:{})})));return;
   }
   const command=parseMessageEditCommand(prompt);
   if(command){complete(await editMessageByCommand(db,user,command,controller.signal,commit));return;}
   const read=createDashboardReader(db,rtdb,user);
   const executeTool=async(name:string,args:Record<string,unknown>,signal:AbortSignal)=>{
    if(name==='search_local_history')return searchAssistantHistory(turns,args);
    if(readDeclarations.some(declaration=>declaration.name===name))return read(name,args,signal);
    const result=await actions.prepare(name,args,signal);
    const plan=plans.find(plan=>plan.id===(result as any).id);
    if(plan&&requestsImmediateAction(prompt,plan)){
     const text=await actions.execute(plan,signal,commit);plan.executedAt=Date.now();executed.push(text);
     complete(executed.join('\n\n'));setCommitting(false);timer=setTimeout(()=>controller.abort('timeout'),600000);
     return {executed:true,id:plan.id,message:text};
    }
    return result;
   };
   const {askDashboardAI}=await import('./askDashboardAI');
   const context=JSON.stringify({version:'v'+version,fecha:new Date().toISOString(),administradorActual:user.uid,mapa:dataMap,resumen:snapshot??null,conversacion:assistantContextHistory(turns)});
   const result=await askDashboardAI(prompt,context,controller.signal,{declarations:[...readDeclarations,...actionDeclarations,localHistoryDeclaration],execute:executeTool});
   if(!controller.signal.aborted)complete(result.text+(executed.length?'\n\nAcciones realizadas:\n'+executed.join('\n'): '')+proposals(plans)+(result.truncated?'\n\nNo se pudo completar toda la respuesta. Conservamos lo recibido; puedes pedir que continúe.':''));
  }catch(failure){if(request.current===controller){if(plans.length)complete((executed.length?'Acciones completadas:\n\n'+executed.join('\n\n'):'Se prepararon los siguientes cambios. Aún no se han ejecutado.')+proposals(plans));setQuestion(prompt);setError(controller.signal.reason==='timeout'?'La consulta tardó demasiado. Puedes volver a intentarlo.':controller.signal.aborted?'Consulta cancelada.':failure instanceof Error?failure.message:'No se pudo completar la consulta.');}}
  finally{clearTimeout(timer);if(request.current===controller){request.current=null;setBusy(false);setCommitting(false);}}
 }
 return <section className="dashboard-ai dashboard-chat">
  <header className="dashboard-chat-header"><Sparkles size={20}/><div><h2>Nexus Assistant</h2><small>Administración de Nexus Chat</small></div></header>
  <div className="dashboard-ai-transcript" role="log" aria-label="Conversación de Nexus Assistant" aria-live="polite">
   {!ready?<p>Cargando historial local…</p>:!turns.length&&<div className="dashboard-chat-welcome"><Sparkles size={36}/><h3>¿En qué te ayudo?</h3><p>Consulta, crea o modifica los datos de Nexus.</p></div>}
   {turns.map((turn,index)=><article key={index} className="dashboard-ai-turn"><div className="dashboard-ai-user-message"><RichText text={turn.question}/></div>{turn.answer&&<div className="report-preview" aria-label="Respuesta de Nexus Assistant"><strong>Nexus Assistant</strong><RichText text={turn.answer}/></div>}</article>)}
   {busy&&<p className="assistant-working" role="status">{committing?'Ejecutando la acción…':'Nexus Assistant está trabajando…'}</p>}
   <div ref={bottom}/>
  </div>
  <form className="dashboard-ai-composer" aria-label="Escribir una consulta" onSubmit={event=>{event.preventDefault();void ask();}}>
   <TransientNotice message={error} onClose={()=>setError('')}/>
   <SpeakAnswer text={answer} compact/>
   <textarea aria-label="Escribe un mensaje" rows={1} value={question} disabled={busy||!ready} onChange={event=>{setQuestion(event.target.value);const invalid=draftError(event.target.value);if(invalid)setError(invalid);}} placeholder="Escribe un mensaje" title="Hasta 500 líneas. Usa Mayús + Intro para un salto de línea." onKeyDown={event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.nativeEvent.isComposing){event.preventDefault();void ask();}}}/>
   <DictateQuestion compact disabled={busy||!ready} onStart={()=>{baseDraft.current=question;}} onText={text=>setQuestion([baseDraft.current.trimEnd(),text].filter(Boolean).join(' '))}/>
   {busy?<button type="button" className="dashboard-ai-composer-icon" disabled={committing} onClick={()=>request.current?.abort()} aria-label="Cancelar consulta"><Square size={18}/></button>:<button type="submit" className="dashboard-ai-composer-icon" disabled={!ready||!question.trim()||!!draftError(question)} aria-label="Enviar consulta"><Send size={18}/></button>}
  </form>
 </section>;
}
