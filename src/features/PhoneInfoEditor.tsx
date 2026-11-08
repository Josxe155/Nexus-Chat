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
  onSave: (bio: string, expiresAt: number, audience: Audience, excluded: string[]) => void;
}) {
  const [draft, setDraft] = useState(bio);
  const [duration, setDuration] = useState(()=>{
    if (bio&&!user.bioExpiresAt) return '0';
    const remaining = (user.bioExpiresAt||0)-Date.now();
    return remaining > 0 ? durations.find(option=>Number(option.value)>=remaining)?.value||'604800000' : '86400000';
  });
  const [durationEdited, setDurationEdited] = useState(false);
  const [audience, setAudience] = useState(privacy.infoAudience);
  const [excluded, setExcluded] = useState(privacy.infoExcluded);
  const [excludedDraft, setExcludedDraft] = useState(excluded);
  const [picker, setPicker] = useState<'duration'|'audience'|'excluded'|'emoji'>();
  const [preview, setPreview] = useState(false);
  const audienceLabel = audience==='except'&&excluded.length
    ? 'Mis contactos, excepto '+excluded.length : audiences.find(option=>option.value===audience)?.label;
  const text = draft.trim();
  const changed = text!==bio||durationEdited||audience!==privacy.infoAudience||
    excluded.length!==privacy.infoExcluded.length||excluded.some(uid=>!privacy.infoExcluded.includes(uid));

  return <form className="phone-info-editor" onSubmit={event=>{
    event.preventDefault();
    if (!changed||busy) return;
    const expiresAt = !text ? 0 : !durationEdited&&text===bio
      ? user.bioExpiresAt||0 : Number(duration) ? Date.now()+Number(duration) : 0;
    onSave(text, expiresAt, audience, excluded);
  }}>
    <div className="phone-info-field">
      <button type="button" aria-label="Añadir emoji" onClick={()=>setPicker('emoji')}><Smile size={21}/></button>
      <input value={draft} maxLength={Math.max(140,bio.length)} onChange={event=>setDraft(event.target.value)}
        placeholder="Comparte qué estás pensando" aria-label="Tu información"/>
      {draft&&<button type="button" aria-label="Borrar información" onClick={()=>setDraft('')}><X size={18}/></button>}
    </div>
    <div className="phone-info-options">
      <button type="button" onClick={()=>setPicker('duration')} aria-label={'Duración · '+durations.find(option=>option.value===duration)?.label}><Clock size={15}/>{durations.find(option=>option.value===duration)?.label}<ChevronDown size={13}/></button>
      <button type="button" onClick={()=>setPicker('audience')} aria-label={'Privacidad · '+audienceLabel}><Contact size={15}/><span>{audienceLabel}</span><ChevronDown size={13}/></button>
    </div>
    <div className="phone-info-suggestions">
      <h3 className="phone-setting-section-title">Sugerencias</h3>
      {suggestions.map(suggestion=><button type="button" key={suggestion} onClick={()=>setDraft(suggestion)}>
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
    {picker==='emoji'&&<EmojiPicker onClose={()=>setPicker(undefined)} onSelect={value=>{setDraft((draft+value).slice(0,Math.max(140,bio.length)));setPicker(undefined);}}/>}
    {picker==='duration'&&<SettingsChoiceDialog onClose={()=>setPicker(undefined)} choice={{
      title:'Duración',options:durations,selected:[duration],save:values=>{setDuration(values[0]);setDurationEdited(true);},
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
