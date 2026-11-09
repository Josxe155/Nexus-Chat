import {UserPlus,Bell,CloudUpload,Folder,LockKeyhole,LogOut} from 'lucide-react';
import './account-reference.css';
export default function AccountLogoutPage({go,logout,busy}:{go:(page:string)=>void;logout:()=>Promise<unknown>;busy:boolean}){
 return <div className="reference-account-page reference-logout-page"><p className="reference-logout-intro">Antes de cerrar sesión, revisa las opciones disponibles para tu cuenta.</p>
 <button className="reference-icon-row" disabled title="Pendiente de la función y las referencias de múltiples cuentas"><UserPlus/><span>Añadir cuenta</span></button>
 <button className="reference-icon-row" onClick={()=>go('lockPrivacy')}><LockKeyhole/><span>Bloquear aplicación</span></button>
 <button className="reference-icon-row" onClick={()=>go('notifications')}><Bell/><span>Administrar notificaciones</span></button>
 <button className="reference-icon-row reference-logout-storage" onClick={()=>go('storageManage')}><Folder/><span>Liberar espacio</span></button>
 <button className="reference-icon-row" disabled title="Pendiente de la referencia de copias de seguridad"><CloudUpload/><span>Realizar copia de seguridad de chats</span></button>
 <button className="reference-icon-row settings-danger" disabled={busy} onClick={()=>void logout()}><LogOut/><span>Cerrar sesión</span></button><p className="reference-logout-note">Se cerrará tu sesión de Nexus Chat en este navegador. <a className="reference-info-link" href="/guia.html" target="_blank" rel="noopener noreferrer">Más información</a></p>
 </div>;
}
