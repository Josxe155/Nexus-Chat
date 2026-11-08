import {useEffect,useRef,useState} from 'react';
import {KeyRound,Send,Sparkles} from 'lucide-react';
import type {Firestore,QueryDocumentSnapshot} from 'firebase/firestore';
import type {User} from 'firebase/auth';
import {findChats,findPeople,readChat,readSection,sources,type ChatChoice,type Person,type Source} from './aiContext';
import {DictateQuestion,SpeakAnswer} from './dashboardSpeech';
import {verifyDashboardAccess} from './session';
import type {OverviewSnapshot} from './Overview';

export default function DashboardAI({db,user,snapshot}:{db:Firestore;user:User;snapshot?:OverviewSnapshot}){
 const [source,setSource]=useState<Source>('Vista general'),[question,setQuestion]=useState('');
 const [search,setSearch]=useState(''),[people,setPeople]=useState<Person[]>([]),[chats,setChats]=useState<ChatChoice[]>([]);
 const [person,setPerson]=useState<Person>(),[chat,setChat]=useState<ChatChoice>(),[cursor,setCursor]=useState<QueryDocumentSnapshot>();
 const [payload,setPayload]=useState(''),[answer,setAnswer]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [phase,setPhase]=useState<'idle'|'reading'|'sending'>('idle');
 const token=useRef('');
 const [connected,setConnected]=useState(false);
 const request=useRef<AbortController|null>(null);
 const busy=phase!=='idle';
 useEffect(()=>()=>{request.current?.abort();request.current=null;token.current='';},[]);

 function resetPayload(){setPayload('');setCursor(undefined);setAnswer('');setNotice('');setError('');}
 async function read(action:()=>Promise<void>){
  setPhase('reading');setError('');
  try{
   if(!await verifyDashboardAccess(user,db))throw Error('Tu acceso de administración ya no está disponible.');
   await action();
  }catch(error){setError(error instanceof Error&&error.message.startsWith('Tu acceso')?error.message:'No se pudo consultar esa sección. Comprueba el acceso y la conexión.');}
  finally{setPhase('idle');}
 }
 const loadChat=(next?:QueryDocumentSnapshot)=>void read(async()=>{
  if(!chat||!person)return;
  const context=await readChat(db,chat,person,next);
  setCursor(context.next);setPayload(JSON.stringify(context.payload,null,2));setAnswer('');setNotice('');
 });
 function prepare(){
  const requestedPerson=/^(?:revisa|analiza)\s+(?:el\s+)?(?:chat|conversación)\s+de\s+(.+?)[.!?]?$/i.exec(question.trim())?.[1];
  if(requestedPerson&&source!=='Chats'){
   setSource('Chats');setSearch(requestedPerson);resetPayload();setNotice('Busca la cuenta y elige una conversación para revisar.');
   return;
  }
  if(source==='Chats'){loadChat();return;}
  const section=(source==='Actividad'||source==='Vista general')&&/\bajustes\b/i.test(question)?'Ajustes':source;
  if(section!==source)setSource(section);
  void read(async()=>{setPayload(JSON.stringify(await readSection(db,section,snapshot,user.uid),null,2));setAnswer('');setNotice('');});
 }
 async function ask(){
  if(request.current||!payload||!question.trim())return;
  if(!token.current){setError('Conecta Hugging Face antes de enviar la consulta.');return;}
  const controller=new AbortController();request.current=controller;
  const timer=setTimeout(()=>controller.abort('timeout'),45000);
  setPhase('sending');setError('');setAnswer('');setNotice('');
  try{
   if(!await verifyDashboardAccess(user,db))throw Error('Tu acceso de administración ya no está disponible.');
   controller.signal.throwIfAborted();
   const {askDashboardAI}=await import('./askDashboardAI');
   controller.signal.throwIfAborted();
   const result=await askDashboardAI(token.current,question.trim(),payload,controller.signal);
   if(!controller.signal.aborted){setAnswer(result.text);if(result.truncated)setNotice('La respuesta se cortó. Haz una pregunta más concreta sobre esta muestra.');}
  }catch(error){
   if(request.current===controller)setError(controller.signal.reason==='timeout'?'Se agotó el tiempo de respuesta.':controller.signal.aborted?'Consulta cancelada.':error instanceof Error?error.message:'No se pudo completar la consulta.');
  }finally{
   clearTimeout(timer);
   if(request.current===controller){request.current=null;setPhase('idle');}
  }
 }
 return <section className="panel-card dashboard-ai">
  <header className="dashboard-ai-header"><div><span className="badge"><Sparkles size={15}/> ASISTENTE DEL PANEL</span><h2>Modo IA</h2></div><span className="dashboard-ai-connection" data-connected={connected}>{connected?'Token cargado':'Sin conexión de inferencia'}</span></header>
  <p>Consulta secciones de Nexus con tu sesión administradora. La pregunta y los datos preparados se comparten con Hugging Face al enviarlos. El dictado y la lectura pueden usar los servicios de voz del navegador.</p>
  <details className="dashboard-ai-token" open={!connected?true:undefined}>
   <summary><KeyRound size={16}/> Conectar Hugging Face</summary>
   {connected?<button type="button" className="secondary" disabled={busy} onClick={()=>{token.current='';setConnected(false);setError('');}}>Quitar token de esta sesión</button>:
    <form onSubmit={event=>{
     event.preventDefault();
     const form=event.currentTarget,value=String(new FormData(form).get('hf-token')||'').trim();
     if(!/^hf_[A-Za-z0-9]+$/.test(value)){setError('Introduce un token válido de Hugging Face.');return;}
     token.current=value;form.reset();setConnected(true);setError('');
    }}>
     <label>Token de Hugging Face<input type="password" name="hf-token" autoComplete="off" spellCheck={false} required disabled={busy}/></label>
     <button type="submit" className="secondary" disabled={busy}>Conectar para esta sesión</button>
    </form>}
   <small>Usa un token con permiso de Inference Providers. Se conserva en memoria mientras este panel esté abierto.</small>
  </details>
  <label>Pregunta<textarea rows={3} maxLength={1500} value={question} disabled={busy} onChange={e=>setQuestion(e.target.value)} placeholder="Por ejemplo, revisa el chat de una persona o revisa los ajustes."/></label>
  <DictateQuestion disabled={busy} onText={text=>setQuestion(previous=>[previous.trim(),text].filter(Boolean).join(' ').slice(0,1500))}/>
  <label>Sección<select disabled={busy} value={source} onChange={e=>{setSource(e.target.value as Source);resetPayload();}}>{sources.map(value=><option key={value}>{value}</option>)}</select></label>
  {source==='Chats'&&<div className="dashboard-ai-chats">
   <label>Nombre o usuario<input value={search} disabled={busy} onChange={e=>{setSearch(e.target.value);setPeople([]);setPerson(undefined);setChats([]);setChat(undefined);resetPayload();}}/></label>
   <button type="button" className="secondary" disabled={busy||search.trim().length<2} onClick={()=>void read(async()=>{
    const matches=await findPeople(db,search);setPeople(matches);setNotice(matches.length?'Selecciona una cuenta.':'No se encontraron cuentas.');
   })}>Buscar cuenta</button>
   {people.length>0&&<label>Cuenta<select value={person?.id||''} disabled={busy} onChange={e=>{
    const value=people.find(p=>p.id===e.target.value);
    setPerson(value);setChat(undefined);setChats([]);resetPayload();
    if(value)void read(async()=>{const rows=await findChats(db,value);setChats(rows);if(!rows.length)setNotice('La cuenta no tiene conversaciones disponibles.');});
   }}><option value="">Selecciona una cuenta</option>{people.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select></label>}
   {chats.length>0&&<label>Conversación<select value={chat?.id||''} disabled={busy} onChange={e=>{setChat(chats.find(c=>c.id===e.target.value));resetPayload();}}>
    <option value="">Selecciona una conversación</option>{chats.map(c=><option key={c.id} value={c.id}>{c.label} · {c.kind==='direct'?'Directo':c.kind==='group'?'Grupo':'Canal'}</option>)}
   </select></label>}
  </div>}
  <div className="actions">
   <button type="button" className="secondary" disabled={busy||(source==='Chats'&&!chat)} onClick={prepare}>Preparar vista previa</button>
   {source==='Chats'&&cursor&&<button type="button" className="secondary" disabled={busy} onClick={()=>loadChat(cursor)}>Ver mensajes anteriores</button>}
  </div>
  {payload&&<div className="report-preview">
   <h3>Información que se enviará</h3>
   <p>Revisa el texto antes de enviarlo y evita compartir datos sensibles. Esta consulta es de solo lectura.</p>
   <pre tabIndex={0}>{JSON.stringify({pregunta:question.trim(),contexto:JSON.parse(payload)},null,2)}</pre>
   <button type="button" className="icon-action" disabled={busy||!connected||!question.trim()} onClick={()=>void ask()}><Send size={16}/> Enviar a Hugging Face</button>
  </div>}
  {phase==='reading'&&<p role="status">Consultando Nexus…</p>}
  {phase==='sending'&&<div className="actions"><span role="status">Preparando respuesta…</span><button type="button" className="secondary" onClick={()=>request.current?.abort()}>Cancelar</button></div>}
  {notice&&<p role="status">{notice}</p>}
  {error&&<p className="feedback error" role="alert">{error}</p>}
  {answer&&<article className="report-preview" aria-label="Respuesta del Modo IA"><h3>Respuesta del Modo IA</h3><p>{answer}</p><SpeakAnswer key={answer} text={answer}/></article>}
 </section>;
}
