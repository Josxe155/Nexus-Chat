import {useEffect,useState} from 'react';
import {version} from '../webVersion.json';
import {BookOpen,Bug,Camera,FileText,Flag,HelpCircle,Info,MessageCircle,Search,Shield,Users} from 'lucide-react';
import {collection,onSnapshot,query,where} from 'firebase/firestore';
import {db} from '../firebase';
import SupportCenter,{supportArticles} from './SupportCenter';
import {SettingsRow} from './MobileSettingsControls';

export const mobileHelpTitles={helpCenter:'Centro de ayuda',helpFeedback:'Enviar comentarios',helpPolicy:'Condiciones y Política de privacidad',helpReports:'Reportes del canal',helpAbout:'Info. de la aplicación'};

export default function MobileSettingsHelp({page,uid,go}:{page:string;uid:string;go:(next:string)=>void}){
 const [search,setSearch]=useState(''),[all,setAll]=useState(false),[feedback,setFeedback]=useState(''),[files,setFiles]=useState<File[]>([]),[result,setResult]=useState('');
 const [reports,setReports]=useState<{id:string;reason:string;at:number}[]|null>(null),[topic,setTopic]=useState('');
 useEffect(()=>{
  if(page==='helpReports')return onSnapshot(query(collection(db,'communityReports'),where('reporter','==',uid)),snapshot=>setReports(snapshot.docs.flatMap(item=>{
   const data=item.data();return data.kind==='channel'?[{id:item.id,reason:String(data.reason||''),at:Number(data.at)||0}]:[];
  }).sort((a,b)=>b.at-a.at)),()=>setResult('No se pudieron cargar los reportes.'));
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
  const matches=supportArticles.filter(([id,label,text])=>(!topic||id===topic)&&(label+' '+text).toLocaleLowerCase('es').includes(search.trim().toLocaleLowerCase('es')));
  return <><div className="phone-help-brand"><img src="/nexus-icon.svg?v=3" alt=""/><h3>¿Cómo podemos ayudarte?</h3></div><label className="phone-settings-search"><Search size={19}/><input type="search" placeholder="Buscar en el Centro de ayuda" value={search} onChange={event=>{setTopic('');setSearch(event.target.value);}}/></label>{!search&&!topic&&!all&&<section className="phone-settings-group phone-help-topics"><h3 className="phone-setting-section-title">Temas de ayuda</h3>{([['messages','Chats',MessageCircle],['voice','Llamadas y videollamadas',Camera],['states','Novedades y comunidades',Users],['privacy','Privacidad, protección y seguridad',Shield],['appearance','Apariencia',Info]] as const).map(([id,label,Icon])=><SettingsRow key={id} icon={Icon} label={label} onClick={()=>setTopic(id)}/>)}</section>}{topic&&<button className="phone-settings-text-action" onClick={()=>setTopic('')}>Todos los temas</button>}<h3 className="phone-setting-section-title">{search||topic?'Resultados':'Artículos populares'}</h3>
   {(search||all?matches:matches.slice(0,4)).map(([id,label,text])=><details key={id} className="phone-help-article"><summary><BookOpen size={19}/>{label}</summary><p>{text}</p></details>)}
   {!matches.length&&<p className="phone-setting-note">No encontramos artículos para esa búsqueda.</p>}
   {!all&&!search&&!topic&&<button className="phone-settings-text-action" onClick={()=>setAll(true)}>Mostrar más</button>}
   <div className="phone-help-action"><button className="phone-settings-primary" onClick={()=>go('helpFeedback')}><MessageCircle size={18}/> Enviar comentarios</button></div></>;
 }
 if(page==='helpFeedback')return <div className="phone-help-feedback"><p>Describe qué pasó. Puedes compartir el comentario y los archivos que elijas con la persona que administra tu comunidad.</p><label><textarea placeholder="Describe el problema técnico" aria-label="Describe el problema técnico" value={feedback} maxLength={4000} onChange={event=>setFeedback(event.target.value)}/></label><p>Capturas de pantalla o grabaciones (opcional)</p><label className="phone-feedback-file"><Camera size={21}/><span className="sr-only">Adjuntar capturas o grabaciones</span><input type="file" multiple accept="image/*,video/*" onChange={event=>{setFiles(Array.from(event.target.files||[]).slice(0,3));event.target.value='';}}/></label>{files.map((file,index)=><SettingsRow key={index} label={file.name} detail="Toca para quitar" onClick={()=>setFiles(items=>items.filter(item=>item!==file))}/>)}<button className="phone-settings-primary" disabled={!feedback.trim()} onClick={()=>void shareFeedback()}>Compartir comentario</button>{result&&<p role="status">{result}</p>}</div>;
 if(page==='helpPolicy')return <SupportCenter policiesOnly/>;
 if(page==='helpReports')return <>{result?<p className="phone-setting-note" role="alert">{result}</p>:reports===null?<p className="phone-setting-note" role="status">Cargando reportes…</p>:reports.length?reports.map(report=><div className="phone-report" key={report.id}><strong>{report.reason}</strong><small>{new Date(report.at).toLocaleDateString('es')}</small></div>):<div className="phone-settings-empty"><h3>No hay informes</h3><p>Cuando reportas un canal, puedes consultar aquí tu reporte.</p></div>}</>;
 return <div className="phone-settings-about phone-help-about"><h3>Nexus Chat</h3><p>Versión {version}</p><img src="/nexus-icon.svg?v=3" alt=""/><SettingsRow label="Acerca de la web" icon={Info} onClick={()=>go('aboutWeb')}/></div>;
}
