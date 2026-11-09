import {useState} from 'react';
import {nextProfileQuestion} from './profileQuestions';
import {Accessibility, Bell, CalendarDays, ChevronDown, HardDrive, HelpCircle, Info, KeyRound, List, Lock, MessageSquare, Palette, UserPlus} from 'lucide-react';
import type {UserProfile} from '../types';
import {SettingsRow} from './MobileSettingsControls';

const sections = [
  ['account', 'Cuenta', 'Notificaciones de seguridad e información de la cuenta', KeyRound],
  ['privacy', 'Privacidad', 'Cuentas bloqueadas, mensajes temporales', Lock],
  ['lists', 'Listas', 'Administrar personas y grupos', List],
  ['chats', 'Chats', 'Ajustes e historial de chats', MessageSquare],
  ['appAppearance', 'Apariencia', 'Estilo del chat, ícono de la aplicación, estilo de la aplicación', Palette],
  ['events', 'Eventos', 'Visualizar eventos de tus chats', CalendarDays],
  ['notifications', 'Notificaciones', 'Tonos de mensajes, grupos y llamadas', Bell],
  ['storage', 'Almacenamiento y datos', 'Uso de red, descarga automática', HardDrive],
  ['accessibility', 'Accesibilidad', 'Aumentar contraste, animación', Accessibility],
  ['help', 'Ayuda y comentarios', 'Centro de ayuda, comentarios, política de privacidad', HelpCircle],
  ['invite', 'Invitar amigos', '', UserPlus],
  ['aboutWeb', 'Acerca de la web', 'Información de Nexus y actualizaciones', Info],
] as const;

function searchKey(value: string) {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('es');
}

export default function PhoneSettingsHome({user, photo, bio, search, go}: {
  user: UserProfile; photo: string; bio: string; search?: string; go: (id: string) => void;
}) {
  const [question]=useState(()=>nextProfileQuestion(user.uid));
  const terms = searchKey(search?.trim() || '').split(/\s+/);
  const results = sections.filter(([,label, detail]) => terms.every(term => searchKey(label+' '+detail).includes(term)));
  return <>
    {search===undefined&&<div className="phone-settings-identity">
      <button className="phone-settings-info-bubble" type="button" onClick={()=>go('info')}>{bio?.trim()?bio:question}</button>
      <button className="phone-settings-identity-profile" type="button" aria-label="Abrir perfil" onClick={()=>go('profile')}>
        <img src={photo} alt=""/>
        <strong>{user.nombre}<ChevronDown size={18} aria-hidden="true"/></strong>
        <small>@{user.username}</small>
      </button>
    </div>}
    <div className="phone-settings-index">
      {results.map(([id, label, detail, Icon])=><SettingsRow key={id} label={label} detail={detail} icon={Icon} onClick={()=>go(id)}/>)}
      {!results.length&&<p className="phone-setting-note" role="status">No se encontraron ajustes.</p>}
    </div>
  </>;
}
