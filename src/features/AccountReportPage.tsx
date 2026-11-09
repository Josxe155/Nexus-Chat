import {useEffect,useState} from 'react';
import {FileText,History} from 'lucide-react';
import {createAccountReport,downloadAccountReport,localReport,readReportSettings,saveReportSetting,type LocalReport,type ReportSettings} from './accountReports';
import type {ReportKind} from './accountReportModel';
import './account-reference.css';
export default function AccountReportPage({uid}:{uid:string}){
 const [settings,setSettings]=useState<ReportSettings>({account:false,channels:false}),[reports,setReports]=useState<Partial<Record<ReportKind,LocalReport>>>({}),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let active=true;const load=async()=>{try{const [settings,account,channels]=await Promise.all([readReportSettings(uid),localReport(uid,'account'),localReport(uid,'channels')]);if(active){setSettings(settings);setReports({account,channels});setLoading(false);}}catch{if(active)setError('No se pudieron consultar tus informes. Vuelve a abrir este apartado.');}};void load();window.addEventListener('nexus:account-reports',load);return()=>{active=false;window.removeEventListener('nexus:account-reports',load);};},[uid]);
 useEffect(()=>{if(!error)return;const timer=setTimeout(()=>setError(''),3000);return()=>clearTimeout(timer);},[error]);
 const act=async(fn:()=>Promise<void>)=>{if(busy)return;setBusy(true);setError('');try{await fn();}catch{setError('No se pudo completar la solicitud. Revisa tu conexión y vuelve a intentarlo.');}finally{setBusy(false);}};
 return <div className="reference-account-page report-reference-page">{(['account','channels'] as const).map(kind=><section className="reference-report-section" key={kind}>
 <h3>{kind==='account'?'Información de la cuenta':'Actividad de los canales'}</h3>
 <button type="button" className="reference-icon-row" disabled={busy||loading} onClick={()=>void act(async()=>{if(reports[kind])downloadAccountReport(reports[kind]!);else{const report=await createAccountReport(uid,kind);setReports(previous=>({...previous,[kind]:report}));}})}><FileText/><span>{reports[kind]?'Descargar informe':kind==='account'?'Solicitar informe de la cuenta':'Solicitar informe de canales'}</span></button>
 <p>{kind==='account'?'Crea un informe de los ajustes y la información de tu cuenta de Nexus. De esta manera, podrás acceder al informe o transferirlo a otra aplicación. El informe no incluye tus mensajes.':'Crea un informe de la información de los canales que sigues o administras. De esta manera, podrás acceder al informe o transferirlo a otra aplicación.'} <a className="reference-info-link" href="/guia.html" target="_blank" rel="noopener noreferrer">Más información</a></p>
 <label className="reference-icon-row reference-report-auto"><History/><span>Crear informes<br/>automáticamente</span><input type="checkbox" role="switch" aria-label={'Crear informes automáticamente de '+(kind==='account'?'la cuenta':'canales')} disabled={busy||loading} checked={settings[kind]} onChange={event=>{const enabled=event.target.checked;void act(async()=>{await saveReportSetting(uid,kind,enabled);setSettings(previous=>({...previous,[kind]:enabled}));if(enabled){const report=await createAccountReport(uid,kind);setReports(previous=>({...previous,[kind]:report}));}});}}/></label>
 <p>Se creará un nuevo informe cada mes al abrir Nexus Chat.<br/><a className="reference-info-link" href="/guia.html" target="_blank" rel="noopener noreferrer">Más información</a></p>
 </section>)}{error&&<p className="reference-inline-error" role="alert">{error}</p>}</div>;
}
