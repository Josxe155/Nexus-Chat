import {useEffect,useRef,useState,type FormEvent} from 'react';
import {addDoc,collection,deleteDoc,doc,serverTimestamp,type Firestore} from 'firebase/firestore';
import {noticeCategories,noticeLimit,subscribeToOfficialNotices,type OfficialNotice} from '../features/officialNotices';

export default function OfficialNotices({db}:{db:Firestore}){
 const [category,setCategory]=useState<OfficialNotice['category']>('Novedad'),[title,setTitle]=useState(''),[body,setBody]=useState('');
 const [notices,setNotices]=useState<OfficialNotice[]|null>(null),[busy,setBusy]=useState(false),[feedback,setFeedback]=useState(''),[error,setError]=useState('');
 const [loadFailed,setLoadFailed]=useState(false),[retry,setRetry]=useState(0);
 const working=useRef(false);
 useEffect(()=>{
  setLoadFailed(false);
  return subscribeToOfficialNotices(db,setNotices,()=>setLoadFailed(true));
 },[db,retry]);
 async function act(action:()=>Promise<unknown>,success:string,failure:string){
  if(working.current)return;
  working.current=true;setBusy(true);setFeedback('');setError('');
  try{await action();setFeedback(success);}catch{setError(failure);}finally{working.current=false;setBusy(false);}
 }
 function publish(event:FormEvent){
  event.preventDefault();
  const draft={category,title:title.trim(),body:body.trim()};
  if(working.current||!draft.title||!draft.body||!confirm('¿Publicar «'+draft.title+'» en Nexus Chat Oficial para quienes usan Nexus Chat?'))return;
  void act(async()=>{
   await addDoc(collection(db,'officialNotices'),{...draft,publishedAt:serverTimestamp()});
   setTitle('');setBody('');
  },'Aviso publicado.','No se pudo publicar el aviso. Comprueba tu conexión y el acceso al panel.');
 }
 return <section className="official-notice-admin" aria-labelledby="official-notices-heading">
  <span className="badge">COMUNICACIÓN</span><h2 id="official-notices-heading">Nexus Chat Oficial</h2>
  <p>Publica novedades y avisos para celular, tablet y computadora. Los mensajes aparecen en una conversación de solo lectura.</p>
  <form className="password-access" onSubmit={publish}>
   <label>Categoría<select value={category} disabled={busy} onChange={event=>setCategory(event.target.value as OfficialNotice['category'])}>{noticeCategories.map(name=><option key={name}>{name}</option>)}</select></label>
   <label>Título<input value={title} required maxLength={100} disabled={busy} onChange={event=>setTitle(event.target.value)}/></label>
   <label>Mensaje<textarea rows={4} value={body} required maxLength={2000} disabled={busy} onChange={event=>setBody(event.target.value)}/></label>
   <button disabled={busy||!title.trim()||!body.trim()}>Publicar aviso</button>
  </form>
  {feedback&&<p role="status" className="feedback">{feedback}</p>}{error&&<p className="notice" role="alert">{error}</p>}
  {(title.trim()||body.trim())&&<aside className="report-preview"><small>Vista previa · {category}</small><h3>{title.trim()||'Título del aviso'}</h3><p className="reported-content">{body.trim()}</p></aside>}
  <h3>Publicaciones recientes</h3>
  {loadFailed?<p role="alert">No se pudieron cargar las publicaciones. <button type="button" className="secondary" onClick={()=>setRetry(value=>value+1)}>Reintentar</button></p>:notices===null?<p role="status">Cargando publicaciones…</p>:!notices.length?<p>Todavía no has publicado avisos.</p>:<>
   <p>Se muestran los últimos {noticeLimit} avisos.</p>
   <ul>{notices.map(notice=><li key={notice.id}><div><strong>{notice.title}</strong><small>{notice.category} · {notice.publishedAt.toDate().toLocaleString('es')}</small></div>
    <button type="button" className="secondary" disabled={busy} aria-label={'Retirar '+notice.title} onClick={()=>{
     if(!working.current&&confirm('¿Retirar «'+notice.title+'» del chat oficial para todos?'))void act(()=>deleteDoc(doc(db,'officialNotices',notice.id)),'Aviso retirado.','No se pudo retirar el aviso.');
    }}>Retirar</button></li>)}</ul>
  </>}
 </section>;
}
