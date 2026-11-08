import {useState} from 'react';
import {Check, ChevronDown, Clock, Contact, Smile, X} from 'lucide-react';
import type {UserProfile} from '../types';
import type {Audience, PrivacyOptions} from './privacy';
import {SettingsChoiceDialog, SettingsDialog} from './MobileSettingsControls';
import EmojiPicker from './EmojiPicker';

const suggestions = ['🌙 Ausente, dejar un mensaje', '😴 Durmiendo', '💼 En el trabajo', '✈️ De viaje', '💪 En el gimnasio'];
const durations = [
  {value:'3600000',label:'1 hora'},
  {value:'28800000',label:'8 horas'},
  {value:'86400000',label:'1 día'},
  {value:'604800000',label:'1 semana'},
  {value:'0',label:'Sin caducidad'},
];
const audiences: {value:Audience; label:string}[] = [
  {value:'everyone',label:'Todos'},
  {value:'contacts',label:'Mis contactos'},
  {value:'except',label:'Mis contactos, excepto…'},
  {value:'nobody',label:'Nadie'},
];

export default function PhoneInfoEditor({user, photo, bio, privacy, contacts, busy, onSave}: {
  user: UserProfile; photo: string; bio: string; privacy: PrivacyOptions; contacts: UserProfile[]; busy: boolean;
  onSave: (privacy: Partial<PrivacyOptions>, info?: {bio:string;bioExpiresAt:number}) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState<string>();
  const [selectedDuration, setDuration] = useState<string>();
  const duration = selectedDuration ?? (() => {
    if (bio&&!user.bioExpiresAt) return '0';
    const remaining = (user.bioExpiresAt||0)-Date.now();
    return remaining > 0 ? durations.find(option=>Number(option.value)>=remaining)?.value||'604800000' : '86400000';
  })();
  const [audienceDraft, setAudience] = useState<Audience>();
  const audience = audienceDraft ?? privacy.infoAudience;
  const [excludedIds, setExcluded] = useState<string[]>();
  const excluded = excludedIds ?? privacy.infoExcluded;
  const [excludedDraft, setExcludedDraft] = useState(excluded);
  const [picker, setPicker] = useState<'duration'|'audience'|'excluded'|'emoji'>();
  const [preview, setPreview] = useState(false);
  const audienceLabel = audience==='except'&&excluded.length
    ? 'Mis contactos, excepto '+excluded.length : audiences.find(option=>option.value===audience)?.label;
  const fieldValue = draft ?? bio;
  const text = fieldValue.trim();
  const changedInfo = (draft!==undefined&&text!==bio)||(!!text&&selectedDuration!==undefined);
  const changedExclusions = excludedIds!==undefined&&(excluded.length!==privacy.infoExcluded.length||
    excluded.some(uid=>!privacy.infoExcluded.includes(uid)));
  const changed = changedInfo || audience!==privacy.infoAudience || changedExclusions;

  return <form className="phone-info-editor" onSubmit={async event=>{
    event.preventDefault();
    if (!changed||busy) return;
    const patch:Partial<PrivacyOptions>={};
    if(audience!==privacy.infoAudience)patch.infoAudience=audience;
    if(changedExclusions)patch.infoExcluded=excluded;
    const info=changedInfo?{bio:text,bioExpiresAt:text&&Number(duration)?Date.now()+Number(duration):0}:undefined;
    if(await onSave(patch,info)){
      setDraft(undefined);
      setDuration(undefined);
      setAudience(undefined);
      setExcluded(undefined);
    }
  }}>
    <div className="phone-info-field">
      <button type="button" aria-label="Añadir emoji" disabled={busy} onClick={()=>setPicker('emoji')}><Smile size={21}/></button>
      <input value={fieldValue} maxLength={Math.max(140,bio.length)} disabled={busy} onChange={event=>setDraft(event.target.value)}
        placeholder="Comparte qué estás pensando" aria-label="Tu información"/>
      {fieldValue&&<button type="button" disabled={busy} aria-label="Borrar información" onClick={()=>setDraft('')}><X size={18}/></button>}
    </div>
    <div className="phone-info-options">
      <button type="button" disabled={busy} onClick={()=>setPicker('duration')} aria-label={'Duración · '+durations.find(option=>option.value===duration)?.label}><Clock size={15}/>{durations.find(option=>option.value===duration)?.label}<ChevronDown size={13}/></button>
      <button type="button" disabled={busy} onClick={()=>setPicker('audience')} aria-label={'Privacidad · '+audienceLabel}><Contact size={15}/><span>{audienceLabel}</span><ChevronDown size={13}/></button>
    </div>
    <div className="phone-info-suggestions">
      <h3 className="phone-setting-section-title">Sugerencias</h3>
      {suggestions.map(suggestion=><button type="button" disabled={busy} key={suggestion} onClick={()=>setDraft(suggestion)}>
        <span>{suggestion.slice(0,suggestion.indexOf(' '))}</span>{suggestion.slice(suggestion.indexOf(' ')+1)}
      </button>)}
    </div>
    <footer className="phone-info-preview">
      <div>
        <button type="button" onClick={()=>setPreview(!preview)} aria-expanded={preview}>Vista previa <ChevronDown size={15}/></button>
        <button type="submit" className="phone-info-save" aria-label="Guardar información" disabled={!changed||busy}><Check size={24}/></button>
      </div>
      {preview&&<div className="phone-info-preview-card"><img src={photo} alt=""/><span><strong>{user.nombre}</strong><small>{text||'Así verán los demás tu sección Info. en el chat.'}</small></span></div>}
    </footer>
    {picker==='emoji'&&<EmojiPicker onClose={()=>setPicker(undefined)} onSelect={value=>{setDraft((fieldValue+value).slice(0,Math.max(140,bio.length)));setPicker(undefined);}}/>}
    {picker==='duration'&&<SettingsChoiceDialog onClose={()=>setPicker(undefined)} choice={{
      title:'Duración',options:durations,selected:[duration],save:values=>setDuration(values[0]),
    }}/>}
    {picker==='audience'&&<SettingsChoiceDialog onClose={()=>setPicker(current=>current==='audience'?undefined:current)} choice={{
      title:'Quién puede ver mi Info.',options:audiences,selected:[audience],save:([value])=>{
        if (value==='except') {setExcludedDraft(excluded);setPicker('excluded');}
        else setAudience(value as Audience);
      },
    }}/>}
    {picker==='excluded'&&<SettingsDialog title="Mis contactos, excepto…" onClose={()=>setPicker(undefined)} actions={<>
      <button type="button" onClick={()=>setPicker(undefined)}>Cancelar</button>
      <button type="button" onClick={()=>{setExcluded(excludedDraft);setAudience('except');setPicker(undefined);}}>Aceptar</button>
    </>}>
      <div className="phone-setting-options">{contacts.map(person=><label key={person.uid}><input type="checkbox"
        checked={excludedDraft.includes(person.uid)} onChange={event=>{
          setExcludedDraft(event.target.checked?[...excludedDraft,person.uid]:excludedDraft.filter(uid=>uid!==person.uid));
        }}/>{person.nombre}</label>)}</div>
      {!contacts.length&&<p>No tienes contactos guardados.</p>}
    </SettingsDialog>}
  </form>;
}
