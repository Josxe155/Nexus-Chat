import {useState} from 'react';
import {sendPasswordResetEmail} from 'firebase/auth';
import {ArrowLeft,Check,Mail,LoaderCircle} from 'lucide-react';
import {auth} from '../firebase';
import {authErrorMessage} from '../features/authErrors';

export default function PasswordRecovery({initialEmail,onBack}:{initialEmail:string;onBack:()=>void}){
 const [email,setEmail]=useState(initialEmail),[busy,setBusy]=useState(false),[sent,setSent]=useState(false),[error,setError]=useState('');
 return <form className="password-recovery guest-form" aria-label="Recuperar tu cuenta" onSubmit={async event=>{event.preventDefault();if(busy||sent)return;setBusy(true);setError('');try{auth.languageCode='es';await sendPasswordResetEmail(auth,email.trim(),{url:location.origin+'/',handleCodeInApp:false});setSent(true);}catch(error){setError(authErrorMessage(error));}finally{setBusy(false);}}}>
  <span className="recovery-emblem" aria-hidden="true">{sent?<Check size={28}/>:<Mail size={28}/>}</span><h3 id="recovery-heading">{sent?'Revisa tu correo':'Recupera tu cuenta'}</h3><p className="recovery-description">{sent?'Si este correo tiene una cuenta con contraseña, recibirás un enlace para elegir una nueva.':'Escribe el correo con el que te registraste en Nexus Chat. Te enviaremos un enlace para cambiar tu contraseña.'}</p>
  {!sent?<><label htmlFor="recovery-email">Correo electrónico</label><input id="recovery-email" required type="email" autoComplete="email" autoFocus autoCapitalize="none" value={email} disabled={busy} onChange={event=>setEmail(event.target.value)}/><button className="signin-button guest-button" disabled={busy}>{busy?<><LoaderCircle size={18} className="animate-spin"/>Enviando…</>:'Enviar correo de recuperación'}</button></>:<div className="recovery-delivery" role="status"><strong>{email.trim()}</strong><p>Revisa también Spam o Correo no deseado. El enlace es personal y puede caducar; si eso ocurre, solicita uno nuevo.</p></div>}
  {error&&<p className="auth-error" role="alert">{error}</p>}<button type="button" className="back-link" disabled={busy} onClick={onBack}><ArrowLeft size={16}/>Volver a iniciar sesión</button><p className="guest-hint">Si entras con Google, utiliza «Continuar con Google». Las cuentas de invitado no tienen un correo de recuperación asociado.</p>
 </form>;
}
