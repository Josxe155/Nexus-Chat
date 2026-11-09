import {useEffect,useState} from 'react';
import {AtSign,Pencil,Trash2} from 'lucide-react';
import type {UserProfile} from '../types';
import {SettingsDialog} from './MobileSettingsControls';
import {usernameAvailableAt} from './profileIdentity';
import './account-reference.css';
export default function AccountUsernamePage({user,go}:{user:UserProfile;go:(page:string)=>void}){
 const [editing,setEditing]=useState(false),available=usernameAvailableAt(user.usernameChangedAt),locked=available>Date.now();
 useEffect(()=>{const edit=()=>{if(!locked)setEditing(true);};window.addEventListener('nexus:edit-account-username',edit);return()=>window.removeEventListener('nexus:edit-account-username',edit);},[locked]);
 return <div className="reference-account-page reference-username-page"><AtSign className="reference-username-art"/><h3>{user.username}</h3><p>{locked?'Podrás cambiar tu nombre de usuario el '+new Date(available).toLocaleDateString('es')+'.':'Tu nombre de usuario está listo para usarse en Nexus Chat.'}</p><a className="reference-info-link" href="/guia.html" target="_blank" rel="noopener noreferrer">Más información</a>
 <button className="reference-username-contact" onClick={()=>go('accountUsernameContact')}><span>Contactarme con mi nombre de usuario</span><small>Todos</small></button>
 {editing&&<SettingsDialog title="Edita el nombre de usuario" className="reference-username-sheet" onClose={()=>setEditing(false)} actions={null}>
 <button className="reference-icon-row" disabled title="Pendiente de la referencia del formulario de cambio"><Pencil/><span>Cambiar nombre de usuario</span></button>
 <button className="reference-icon-row settings-danger" disabled title="Pendiente del proceso de eliminación y su referencia"><Trash2/><span>Eliminar nombre de usuario</span></button></SettingsDialog>}</div>;
}
export function AccountUsernameContact(){return <div className="reference-account-page reference-username-contact-page"><h3>Quién puede contactarme por nombre de usuario</h3><label><input type="radio" name="accountUsernameContact" checked readOnly/><span>Todos</span></label><label title="Pendiente de la función de clave de contacto"><input type="radio" name="accountUsernameContact" disabled/><span>Personas que conocen mi clave</span></label></div>}
