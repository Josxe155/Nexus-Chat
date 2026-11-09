import {AtSign, FileText, KeyRound, LockKeyhole, LogOut, Mail, MoreVertical, Phone, Shield, Trash2} from 'lucide-react';
import {useState} from 'react';
import FloatingMenu from './FloatingMenu';
import {SettingsRow} from './MobileSettingsControls';
import './account-settings.css';

export function AccountMenu({go}:{go:(page:string)=>void}) {
 const [at,setAt]=useState<{x:number;y:number}>();
 return <><button type="button" className="settings-overflow" aria-label="Opciones de cuenta" aria-haspopup="menu" aria-expanded={!!at} onClick={event=>{const box=event.currentTarget.getBoundingClientRect();setAt({x:box.right-320,y:box.bottom+4});}}><MoreVertical size={24}/></button>
 {at&&<FloatingMenu at={at} onClose={()=>setAt(undefined)} label="Opciones de cuenta" className="settings-account-menu">
 <button type="button" role="menuitem" onClick={()=>{setAt(undefined);go('report');}}><FileText size={22}/><span>Solicitar info. de mi cuenta</span></button>
 <button type="button" role="menuitem" className="settings-danger" onClick={()=>{setAt(undefined);go('delete');}}><Trash2 size={22}/><span>Eliminar cuenta</span></button>
 </FloatingMenu>}</>;
}
export default function AccountSettings({username,go,onLogout}:{username:string;go:(page:string)=>void;onLogout:()=>void}) {
 return <div className="account-settings-page">
 <section className="account-settings-group" aria-labelledby="account-security-title"><h3 id="account-security-title">Inicio de sesión y seguridad</h3>
 <SettingsRow label="Bloqueo de aplicación" icon={LockKeyhole} onClick={()=>go('lockPrivacy')}/>
 <SettingsRow label="Contraseña" icon={KeyRound} onClick={()=>go('accountPassword')}/>
 <SettingsRow label="Dirección de correo electrónico" icon={Mail} onClick={()=>go('accountEmail')}/>
 <SettingsRow label="Notificaciones de seguridad" icon={Shield} onClick={()=>go('security')}/></section>
 <section className="account-settings-group" aria-labelledby="account-identity-title"><h3 id="account-identity-title">Tu cuenta</h3>
 <SettingsRow label="Nombre de usuario" detail={'@'+username} icon={AtSign} onClick={()=>go('accountUsername')}/>
 <SettingsRow label="Número de Nexus" icon={Phone} onClick={()=>go('accountNumber')}/></section>
 <button type="button" className="phone-setting-row account-logout settings-danger" onClick={onLogout}><LogOut size={23}/><span>Cerrar sesión</span></button>
 </div>;
}
