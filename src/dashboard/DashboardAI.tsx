import {useEffect,useRef,useState} from 'react';
import {Send,Sparkles} from 'lucide-react';
import type {Firestore} from 'firebase/firestore';
import type {Database} from 'firebase/database';
import type {User} from 'firebase/auth';
import {createDashboardReader,dataMap,readDeclarations} from './aiReads';
import {DictateQuestion,SpeakAnswer} from './dashboardSpeech';
import {verifyDashboardAccess} from './session';
import type {OverviewSnapshot} from './Overview';
import {version} from '../webVersion.json';

export default function DashboardAI({db,rtdb,user,snapshot}:{db:Firestore;rtdb:Database;user:User;snapshot?:OverviewSnapshot}){
 const [question,setQuestion]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [turns,setTurns]=useState<{question:string;answer:string}[]>([]),[busy,setBusy]=useState(false);
 const request=useRef<AbortController|null>(null);
 const answer=turns.at(-1)?.answer||'';
 useEffect(()=>()=>{request.current?.abort();request.current=null;},[]);
 async function ask(){
  if(request.current||!question.trim())return;
  const prompt=question.trim(),controller=new AbortController();request.current=controller;
  const timer=setTimeout(()=>controller.abort('timeout'),180000);
  setBusy(true);setError('');setNotice('Consultando Nexus…');
  try{
   if(!await verifyDashboardAccess(user,db))throw Error('Tu acceso de administración ya no está disponible.');
   const {askDashboardAI}=await import('./askDashboardAI');
   const context=JSON.stringify({version:'v'+version,fecha:new Date().toISOString(),mapa:dataMap,resumen:snapshot??null,conversacion:turns});
   const result=await askDashboardAI(prompt,context,controller.signal,{declarations:readDeclarations,execute:createDashboardReader(db,rtdb,user),onRead:()=>setNotice('Consultando los datos necesarios…')});
   if(!controller.signal.aborted){setTurns(previous=>[...previous,{question:prompt,answer:result.text}]);setQuestion('');setNotice(result.truncated?'La respuesta quedó incompleta. Puedes pedir que continúe.':'');}
  }catch(error){if(request.current===controller){setError(controller.signal.reason==='timeout'?'La consulta tardó demasiado. Puedes volver a intentarlo.':controller.signal.aborted?'Consulta cancelada.':error instanceof Error?error.message:'No se pudo completar la consulta.');setNotice('');}}
  finally{clearTimeout(timer);if(request.current===controller){request.current=null;setBusy(false);}}
 }
 return <section className="panel-card dashboard-ai">
  <header className="dashboard-ai-header"><div><span className="badge"><Sparkles size={15}/> ASISTENTE DEL PANEL</span><h2>Modo IA</h2></div></header>
  <p>Pregunta sobre Nexus Chat. El asistente consultará la información necesaria con tu acceso de administración. Los datos consultados se comparten con el servicio de IA para responderte.</p>
  {notice&&<p role="status">{notice}</p>}
  {busy&&<button type="button" className="secondary" onClick={()=>request.current?.abort()}>Cancelar consulta</button>}
  {error&&<p className="feedback error" role="alert">{error}</p>}
  <div className="dashboard-ai-transcript" aria-label="Conversación de Modo IA" aria-live="polite">
   {turns.map((turn,index)=><article key={index} className="dashboard-ai-turn"><p className="dashboard-ai-user-message">{turn.question}</p><div className="report-preview" aria-label="Respuesta del Modo IA"><strong>Modo IA</strong><p>{turn.answer}</p></div></article>)}
  </div>
  <form className="dashboard-ai-composer" aria-label="Escribir una consulta" onSubmit={event=>{event.preventDefault();void ask();}}>
   <SpeakAnswer key={answer} text={answer} compact/>
   <textarea aria-label="Escribe un mensaje" rows={1} maxLength={1500} value={question} disabled={busy} onChange={event=>setQuestion(event.target.value)} placeholder="Escribe un mensaje" onKeyDown={event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.nativeEvent.isComposing){event.preventDefault();void ask();}}}/>
   <DictateQuestion compact disabled={busy} onText={text=>setQuestion(previous=>[previous.trim(),text].filter(Boolean).join(' ').slice(0,1500))}/>
   <button type="submit" className="dashboard-ai-composer-icon" disabled={busy||!question.trim()} aria-label="Enviar consulta" title="Enviar consulta"><Send size={18}/></button>
  </form>
 </section>;
}
