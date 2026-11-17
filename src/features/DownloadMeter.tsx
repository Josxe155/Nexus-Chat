import type {DownloadProgress} from './resumableVoice';
import './download-meter.css';
const mb=(bytes:number)=>(bytes/1_000_000).toLocaleString('es',{minimumFractionDigits:1,maximumFractionDigits:1})+' MB';
export default function DownloadMeter({progress}:{progress?:DownloadProgress}){
 return <div className="voice-download-meter" role="status" aria-live="polite">
  <span className="voice-download-ring" role="progressbar" aria-label={progress?'Descarga de voz':'Preparación de voz'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress?.percent} style={progress?{'--download-percent':progress.percent+'%'} as React.CSSProperties:undefined}><span>{progress?progress.percent+' %':'…'}</span></span>
  <span>{progress?<><strong>{progress.percent===100?'Descarga completa · Preparando voz':'Descargando voz'}</strong><small>{mb(progress.downloaded)} de {mb(progress.total)}</small><small>Pendientes: {mb(progress.remaining)}</small></>:<><strong>Preparando voz</strong><small>Comprobando los archivos necesarios…</small></>}</span>
 </div>;
}
