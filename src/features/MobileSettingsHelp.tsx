import {useEffect,useState} from 'react';
import {BookOpen,Bug,FileText,Flag,HelpCircle,Info,Search} from 'lucide-react';
import {collection,onSnapshot,query,where} from 'firebase/firestore';
import {db} from '../firebase';
import SupportCenter,{supportArticles} from './SupportCenter';
import {SettingsHero,SettingsRow} from './MobileSettingsControls';
import {mobileIconURL,readMobileIcon} from './mobileSettingsModel';

export const mobileHelpTitles={helpCenter:'Centro de ayuda',helpFeedback:'Enviar comentarios',helpPolicy:'Condiciones y Política de privacidad',helpReports:'Reportes del canal',helpAbout:'Info. de la aplicación'};

export default function MobileSettingsHelp({page,uid,go}:{page:string;uid:string;go:(next:string)=>void}){
 const [search,setSearch]=useState(''),[all,setAll]=useState(false),[feedback,setFeedback]=useState(''),[files,setFiles]=useState<File[]>([]),[result,setResult]=useState('');
 const [reports,setReports]=useState<{id:string;reason:string;at:number}[]|null>(null),[release,setRelease]=useState('');
 useEffect(()=>{
  if(page==='helpReports')return onSnapshot(query(collection(db,'communityReports'),where('reporter','==',uid)),snapshot=>setReports(snapshot.docs.flatMap(item=>{
   const data=item.data();return data.kind==='channel'?[{id:item.id,reason:String(data.reason||''),at:Number(data.at)||0}]:[];
  }).sort((a,b)=>b.at-a.at)),()=>setResult('No se pudieron cargar los reportes.'));
  if(page==='helpAbout'){
   const controller=new AbortController();fetch('/release.json',{signal:controller.signal}).then(response=>response.json()).then(value=>{if(typeof value.id==='string')setRelease(value.id.slice(0,12));}).catch(()=>{});return()=>controller.abort();
  }
 },[page,uid]);
 async function shareFeedback(){
  const text=feedback.trim();if(!text)return;
  const data={title:'Comentarios sobre Nexus Chat',text,...(files.length?{files}:{})};
  setResult('');
  try{
   if(navigator.share&&(!files.length||navigator.canShare?.(data))){await navigator.share(data);setResult('Comentario compartido.');return;}
   const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'})),link=document.createElement('a');
   link.href=url;link.download='comentario-nexus.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
   setResult(files.length?'Se descargó el texto. Adjunta los archivos por separado al compartirlo.':'Se descargó el comentario para compartir.');
  }catch(error){if(!(error instanceof DOMException&&error.name==='AbortError'))setResult('No se pudo compartir el comentario.');}
 }
 if(page==='help')return <div className="phone-settings-group">{[
  ['helpCenter','Centro de ayuda','Obtén ayuda sobre Nexus.',HelpCircle],['helpFeedback','Enviar comentarios','Describe un problema técnico.',Bug],['helpPolicy',mobileHelpTitles.helpPolicy,'',FileText],['helpReports',mobileHelpTitles.helpReports,'',Flag],['helpAbout',mobileHelpTitles.helpAbout,'',Info],
 ].map(([id,label,detail,Icon])=><SettingsRow key={id as string} label={label as string} detail={detail as string} icon={Icon as typeof Info} onClick={()=>go(id as string)}/>)}</div>;
 if(page==='helpCenter'){
  const matches=supportArticles.filter(([,label,text])=>(label+' '+text).toLocaleLowerCase('es').includes(search.trim().toLocaleLowerCase('es')));
  return <><SettingsHero icon={HelpCircle} title="¿Cómo podemos ayudarte?" detail="Busca información para usar Nexus Chat."/><label className="phone-settings-search"><Search size={19}/><input type="search" placeholder="Buscar en el Centro de ayuda" value={search} onChange={event=>setSearch(event.target.value)}/></label><h3 className="phone-setting-section-title">{search?'Resultados':'Artículos populares'}</h3>
   {(search||all?matches:matches.slice(0,4)).map(([id,label,text])=><details key={id} className="phone-help-article"><summary><BookOpen size={19}/>{label}</summary><p>{text}</p></details>)}
   {!matches.length&&<p className="phone-setting-note">No encontramos artículos para esa búsqueda.</p>}
   {!all&&!search&&<button className="phone-settings-text-action" onClick={()=>setAll(true)}>Mostrar más</button>}
   <button className="phone-settings-primary" onClick={()=>go('helpFeedback')}>Enviar comentarios</button></>;
 }
 if(page==='helpFeedback')return <div className="phone-help-feedback"><p>Describe qué pasó. Puedes compartir el comentario y los archivos que elijas con la persona que administra tu comunidad.</p><label>Describe el problema técnico<textarea aria-label="Describe el problema técnico" value={feedback} maxLength={4000} onChange={event=>setFeedback(event.target.value)}/></label><label>Capturas de pantalla o grabaciones (opcional)<input type="file" multiple accept="image/*,video/*" onChange={event=>{setFiles(Array.from(event.target.files||[]).slice(0,3));event.target.value='';}}/></label>{files.map((file,index)=><SettingsRow key={index} label={file.name} detail="Toca para quitar" onClick={()=>setFiles(items=>items.filter(item=>item!==file))}/>)}<button className="phone-settings-primary" disabled={!feedback.trim()} onClick={()=>void shareFeedback()}>Compartir comentario</button>{result&&<p role="status">{result}</p>}</div>;
 if(page==='helpPolicy')return <SupportCenter policiesOnly/>;
 if(page==='helpReports')return <>{result?<p className="phone-setting-note" role="alert">{result}</p>:reports===null?<p className="phone-setting-note" role="status">Cargando reportes…</p>:reports.length?reports.map(report=><div className="phone-report" key={report.id}><strong>{report.reason}</strong><small>{new Date(report.at).toLocaleDateString('es')}</small></div>):<div className="phone-settings-empty"><h3>No hay informes</h3><p>Cuando reportas un canal, puedes consultar aquí tu reporte.</p></div>}</>;
 return <div className="phone-settings-about"><h3>Nexus Chat</h3><p>{release?'Versión '+release:'Mensajería desde tu navegador'}</p><img src={mobileIconURL(readMobileIcon())} alt=""/><p>Nexus Chat</p><a className="phone-settings-primary" href="/guia.html">Guía de Nexus</a></div>;
}
