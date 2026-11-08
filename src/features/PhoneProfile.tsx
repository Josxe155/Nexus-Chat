import {useState} from 'react';
import {AtSign, Camera, Images, Info, Phone, Trash2, User} from 'lucide-react';
import type {UserProfile} from '../types';
import {SettingsDialog, SettingsRow} from './MobileSettingsControls';
import {usernameAvailableAt} from './profileIdentity';
import {copyText} from './copyText';

type EditField = 'name' | 'username';

export default function PhoneProfile({user, photo, bio, number, busy, error, go, onIdentity}: {
  user: UserProfile; photo: string; bio: string; number: string; busy: boolean; error: string; go: (next: string) => void;
  onIdentity: (field: EditField, value: string) => Promise<boolean>;
}) {
  const [field, setField] = useState<EditField>();
  const [draft, setDraft] = useState('');
  const [numberOpen, setNumberOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const available = usernameAvailableAt(user.usernameChangedAt);
  const locked = available > Date.now();
  const edit = (next: EditField) => {setDraft(next==='name'?user.nombre:user.username);setField(next);};
  return <div className="phone-profile-page">
    <div className="phone-profile-photo">
      <button type="button" className="phone-profile-image-button" aria-label="Ver foto del perfil" onClick={()=>go('profilePhoto')}><img src={photo} alt="Foto del perfil"/></button>
      <button type="button" className="phone-profile-camera" aria-label="Cambiar foto del perfil" onClick={()=>go('profilePhotoEdit')}><Camera size={22}/></button>
    </div>
    <SettingsRow label="Nombre" detail={user.nombre} icon={User} onClick={()=>edit('name')}/>
    <SettingsRow label="Info." detail={bio||'Completar sección Info.'} icon={Info} onClick={()=>go('info')}/>
    <SettingsRow label={user.usernameProvisional?'Nombre de usuario':'Nombre de usuario reservado'} detail={'@'+user.username} icon={AtSign} onClick={()=>edit('username')}/>
    <SettingsRow label="Número de Nexus" detail={number||'Número todavía no asignado'} icon={Phone} onClick={()=>{setNumberOpen(true);setCopied(false);}}/>
    {field&&<SettingsDialog title={field==='name'?'Editar nombre':'Nombre de usuario'} onClose={()=>{if(!busy)setField(undefined);}} actions={<>
      <button type="button" disabled={busy} onClick={()=>setField(undefined)}>Cancelar</button>
      <button type="button" disabled={busy||!draft.trim()||(field==='username'&&locked)} onClick={async()=>{
        if(await onIdentity(field,draft))setField(undefined);
      }}>Guardar</button>
    </>}>
      {field==='username'&&<p>{locked?'Podrás cambiar tu usuario el '+new Date(available).toLocaleDateString('es')+'.':'Puedes cambiar tu nombre de usuario cada 30 días.'}</p>}
      <input className="phone-profile-edit-input" aria-label={field==='name'?'Nombre':'Nombre de usuario'} value={draft}
        disabled={busy||(field==='username'&&locked)} maxLength={field==='name'?128:32} onChange={event=>setDraft(event.target.value)}/>
      {error&&<p role="alert">{error}</p>}
    </SettingsDialog>}
    {numberOpen&&<SettingsDialog title="Número de Nexus" onClose={()=>setNumberOpen(false)} actions={<>
      <button type="button" onClick={()=>setNumberOpen(false)}>Cerrar</button>
      <button type="button" disabled={!number} onClick={()=>void copyText(number).then(()=>setCopied(true)).catch(()=>setCopied(false))}>Copiar</button>
    </>}><p>{number||'Número todavía no asignado'}</p>{copied&&<p role="status">Número copiado.</p>}</SettingsDialog>}
  </div>;
}

export function PhoneProfilePhotoActions({hasPhoto, busy, onPhoto}: {
  hasPhoto: boolean; busy: boolean; onPhoto: (file: File | null) => Promise<boolean>;
}) {
  return <div className="phone-profile-photo-actions">
    <label><Camera size={23}/><span>Cámara</span><input type="file" accept="image/*" capture="user" aria-label="Tomar foto" disabled={busy} onChange={event=>{
      const file=event.target.files?.[0];event.target.value='';if(file)void onPhoto(file);
    }}/></label>
    <label><Images size={23}/><span>Galería</span><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" aria-label="Elegir foto de la galería" disabled={busy} onChange={event=>{
      const file=event.target.files?.[0];event.target.value='';if(file)void onPhoto(file);
    }}/></label>
    {hasPhoto&&<button type="button" disabled={busy} onClick={()=>void onPhoto(null)}><Trash2 size={23}/> Quitar foto</button>}
  </div>;
}
