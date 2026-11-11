import PermissionReview from '../features/PermissionReview';
import PasswordRecovery from './PasswordRecovery';
import {useMobileBack} from '../features/useMobileBack';
import {reportRegistrationStatus} from '../features/registrationStatus';
import PhoneField,{internationalPhone} from '../features/PhoneField';
import {admitAccount} from '../features/admission';
import {authErrorMessage} from '../features/authErrors';
import {migrateOwnProfile} from '../features/privacy';
import {avatar,DEFAULT_AVATAR} from '../features/avatar';
import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signInAnonymously, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, getDoc,writeBatch } from 'firebase/firestore';
import { ArrowRight, ArrowUpRight, MessageCircle, Moon, Sun, Sparkles, Paperclip, CheckCheck, Smile, Users, Image, LoaderCircle } from 'lucide-react';

interface AuthScreenProps {
  onAuthSuccess: (user: any) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export default function AuthScreen({ onAuthSuccess, theme, onToggleTheme }: AuthScreenProps) {
  const [loading, setLoading] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [error, setError] = useState('');
  const [emailMode,setEmailMode]=useState(false);
  const [usernameInput,setUsernameInput]=useState(''),[country,setCountry]=useState('EC'),[phone,setPhone]=useState(''),[confirmPassword,setConfirmPassword]=useState('');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [signUp,setSignUp]=useState(false);
  const [notice,setNotice]=useState('');const [recovering,setRecovering]=useState(false);
  useMobileBack(recovering||emailMode||showGuestForm,()=>{if(loading)return;if(recovering)setRecovering(false);else if(signUp)setSignUp(false);else{setEmailMode(false);setShowGuestForm(false);}setError('');setNotice('');},30);

  const registerUserInDB = async (firebaseUser: any, customName?: string, registration?:{username:string;phone:string}) => {
    try {
      const admission=await admitAccount(firebaseUser,registration);if(admission.verificationRequired)return;
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userRef);

      const username=(customName||firebaseUser.email?.split('@')[0]||'usuario').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9_.]/g,'_').slice(0,18)+'_'+firebaseUser.uid.slice(0,10).toLowerCase();

      const finalName = customName || firebaseUser.displayName || 'Usuario Nexus';
      const finalFoto = firebaseUser.photoURL || DEFAULT_AVATAR;

      const userData = userDoc.exists() ? {
        ...userDoc.data(), online: false, typing:false, lastSeen: userDoc.data().privacy?.hideLastSeen?0:(userDoc.data().lastSeen||0)
      } : {
        uid: firebaseUser.uid,
        nombre: finalName,
        username: registration?.username||username,
        usernameProvisional: !registration&&!firebaseUser.isAnonymous,
        foto: '',
        bio: '',
        estado: 'Disponible',
        online: false,
        lastSeen:0,
        createdAt: Date.now()
      };

      if(firebaseUser.isAnonymous&&customName){userData.nombre=customName;await setDoc(doc(db,'users',firebaseUser.uid,'private','profile'),{nombre:customName},{merge:true});}
      if(!userDoc.exists())Object.assign(userData,{isGuest:firebaseUser.isAnonymous,lastActiveAt:Date.now()});
      if(userDoc.exists()){if(firebaseUser.isAnonymous&&customName)await setDoc(userRef,{nombre:customName},{merge:true});}else{const batch=writeBatch(db);batch.set(userRef,userData);batch.set(doc(db,'users',firebaseUser.uid,'private','profile'),{nombre:finalName,username,foto:finalFoto,bio:'¡Hola! Estoy usando Nexus Chat.'});batch.set(doc(db,'usernames',username),{uid:firebaseUser.uid});try{await batch.commit();}catch(error:any){if(error.code!=='permission-denied')throw error;let legacy=false;try{await getDoc(doc(db,'usernames',username));}catch(check:any){legacy=check.code==='permission-denied';}if(!legacy)throw error;const compatible=writeBatch(db);compatible.set(userRef,userData);compatible.set(doc(db,'users',firebaseUser.uid,'private','profile'),{nombre:finalName,username,foto:finalFoto,bio:'¡Hola! Estoy usando Nexus Chat.'});await compatible.commit();}}
      const privateProfile=await getDoc(doc(db,'users',firebaseUser.uid,'private','profile'));
      const profile={...userData,...(privateProfile.exists()?privateProfile.data():{}),username:userData.username,usernameChangedAt:userDoc.exists()?userDoc.data().usernameChangedAt:undefined} as any;try{onAuthSuccess(await migrateOwnProfile(profile));}catch(error:any){if(error.code!=='permission-denied')throw error;console.warn('Las nuevas opciones de privacidad requieren publicar las reglas actualizadas.');onAuthSuccess(profile);}
    } catch (err: any) {
      console.error("Error writing user to db", err);
      setError(err?.code?authErrorMessage(err):err.message||'No se pudo preparar tu perfil.');
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await registerUserInDB(result.user);
    } catch (err: any) {
      console.error(err);
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    setLoading(true);
    setError('');
    try {
      const result = await signInAnonymously(auth);
      await registerUserInDB(result.user, guestName.trim());
    } catch (err: any) {
      console.error(err);
      setError(authErrorMessage(err,'No se pudo iniciar la sesión de invitado. Inténtalo de nuevo.'));
    } finally {
      setLoading(false);
    }
  };

  const handleEmail=async(e:React.FormEvent)=>{e.preventDefault();setLoading(true);setError('');setNotice('');try{
    let registration: {username:string;phone:string}|undefined;
    if(signUp){if(password!==confirmPassword)throw Error('Las contraseñas no coinciden.');if(password.length<12||!/[a-zA-Z]/.test(password)||!/[0-9]/.test(password))throw Object.assign(Error(),{code:'auth/weak-password'});if(!/^[a-z0-9_.]{3,32}$/.test(usernameInput.trim().toLowerCase()))throw Error('El usuario debe tener entre 3 y 32 letras, números, puntos o guiones bajos.');registration={username:usernameInput.trim().toLowerCase(),phone:''};}
    if(signUp)reportRegistrationStatus('Estamos preparando tu cuenta y el correo de verificación.');const result=signUp?await createUserWithEmailAndPassword(auth,email.trim(),password):await signInWithEmailAndPassword(auth,email.trim(),password);
    if(signUp){await admitAccount(result.user,registration);auth.languageCode='es';await sendEmailVerification(result.user);setNotice('Te enviamos un correo para verificar tu cuenta.');reportRegistrationStatus('Te enviamos un correo para verificar tu cuenta.');}else await registerUserInDB(result.user);
  }catch(e:any){const message=e?.code?authErrorMessage(e):e.message||'No se pudo continuar.';setError(message);if(signUp&&auth.currentUser&&!auth.currentUser.emailVerified)reportRegistrationStatus(message);}finally{setLoading(false);}};
  return (
    <div className="auth-shell" data-theme={theme}><PermissionReview/>
      <header className="auth-header">
        <a className="nexus-brand" href="/" aria-label="Nexus Chat, inicio"><img className="brand-mark" src="/icons/nexus-48.png?v=4" width="43" height="43" alt=""/><span>Nexus<span className="brand-light"> Chat</span><span className="brand-dot">.</span></span></a>
        <div className="header-actions"><span className="header-note">Un espacio para estar cerca</span><button className="theme-button" onClick={onToggleTheme} id="toggle_theme_btn" aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'} title="Cambiar tema">{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</button></div>
      </header>
      <main className="auth-main">
        <section className="welcome-story" aria-labelledby="welcome-heading">
          <span className="eyebrow"><span className="live-dot" /> TU CONEXIÓN ES INTERNET.</span>
          <h1 id="welcome-heading">Sin SIM.<br /><span>Conéctate.</span><span className="headline-star" aria-hidden="true">✳</span></h1>
          <p className="hero-description">¿Para qué comprar una tarjeta SIM?<br className="desktop-break" /> Chatea gratis por internet.</p>
          <div className="conversation-preview" aria-hidden="true">
            <div className="preview-top"><span className="preview-avatars"><span>M</span><span>A</span><span>Tú</span></span><span>Pequeños mensajes.<br /><strong>Grandes conexiones.</strong></span><MessageCircle size={20} /></div>
            <div className="preview-bubble received">¿Y si hacemos algo diferente hoy? <span>10:24</span></div>
            <div className="preview-bubble sent">Me gusta cómo suena eso ✨ <span>10:25 <CheckCheck size={14} /></span></div>
            <div className="preview-typing"><i /><i /><i /><span>La conversación sigue…</span></div>
          </div>
          <div className="hero-caption"><span className="caption-line" /><span>MENOS DISTANCIA. MÁS CONVERSACIÓN.</span></div>
        </section>
        <section className="auth-card" aria-labelledby={recovering?'recovery-heading':'signin-heading'}>
          <div className="card-topline"><span className="card-icon"><Sparkles size={22} /></span><span>ESTE ES TU ESPACIO</span></div>
          {!recovering&&<><h2 id="signin-heading">Qué bueno<br /> tenerte aquí.</h2>
          <p className="card-description">Entra a Nexus Chat y dale vida a tu próxima conversación.</p></>}
          {error && <div role="alert" className="auth-error">{error}</div>}
          {recovering?<PasswordRecovery initialEmail={email} onBack={()=>{setRecovering(false);setEmailMode(true);setError('');}}/>:emailMode ? <form className="guest-form" onSubmit={handleEmail} aria-label={signUp?'Registro por correo':'Acceso por correo'}>
            <h3>{signUp?'Regístrate en Nexus Chat':'Entrar con correo'}</h3>
            {signUp&&<><label htmlFor="signup-username">Nombre de usuario</label><input id="signup-username" required minLength={3} maxLength={32} autoComplete="username" autoCapitalize="none" value={usernameInput} onChange={e=>setUsernameInput(e.target.value)}/></>}
            <label htmlFor="email-input">Correo electrónico</label><input id="email-input" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/>
            
            <label htmlFor="password-input">Contraseña</label><input id="password-input" type="password" autoComplete={signUp?'new-password':'current-password'} required minLength={signUp?12:undefined} value={password} onChange={e=>setPassword(e.target.value)}/>
            {signUp&&<><label htmlFor="confirm-password">Confirmar contraseña</label><input id="confirm-password" type="password" required autoComplete="new-password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)}/><p className="guest-hint">Al menos 12 caracteres, con letras y números. Verifica tu correo para entrar.</p></>}
            <button className="signin-button guest-button" disabled={loading}>{loading?'Conectando…':signUp?'Registrarme':'Entrar'}</button>
            <button type="button" className="back-link" disabled={loading} onClick={()=>{setSignUp(!signUp);setError('');setNotice('');}}>{signUp?'Ya tengo cuenta, iniciar sesión':'Si no estás registrado, regístrate'}</button>
            {!signUp&&<button type="button" className="back-link" disabled={loading} onClick={()=>{setRecovering(true);setError('');setNotice('');}}>¿Olvidaste tu contraseña?</button>}
            <button type="button" className="back-link" disabled={loading} onClick={()=>{setEmailMode(false);setError('');}}>Volver a las opciones de acceso</button>{notice&&<p role="status">{notice}</p>}</form> : !showGuestForm ? <div className="signin-options">
            <button id="google_signin_btn" className="signin-button google-button" onClick={handleGoogleLogin} disabled={loading}>
              {loading ? <LoaderCircle size={20} className="animate-spin" /> : <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.89-1.74 2.98-4.3 2.98-7.36Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.41 13.92a6 6 0 0 1 0-3.84V7.49H3.07a10 10 0 0 0 0 9.02l3.34-2.59Z"/><path fill="#EA4335" d="M12 5.96c1.47 0 2.79.51 3.82 1.51l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.49l3.34 2.59A5.99 5.99 0 0 1 12 5.96Z"/></svg>}
              {loading ? 'Conectando…' : 'Continuar con Google'}
            </button>
            <div className="signin-divider"><span />o entra a tu manera<span /></div>
            <button id="guest_signin_btn" className="signin-button guest-button" onClick={() => {setShowGuestForm(true); setError('');}} disabled={loading}>Entrar como invitado<ArrowRight size={19} /></button>
            <button className="back-link" disabled={loading} onClick={()=>{setEmailMode(true);setError('');}}>Usar correo y contraseña</button><p className="guest-hint">Solo necesitas un nombre para empezar como invitado.</p>
          </div> : <form onSubmit={handleGuestLogin} className="guest-form">
            <label htmlFor="guest_name_input">¿Cómo te llamas?</label>
            <input id="guest_name_input" type="text" value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Tu nombre o apodo" required maxLength={32} autoComplete="nickname" autoFocus disabled={loading} />
            <button type="submit" className="signin-button guest-button" disabled={loading || !guestName.trim()}>{loading ? <><LoaderCircle size={19} className="animate-spin" />Conectando…</> : <>Empezar a conversar<ArrowRight size={19} /></>}</button>
            <button type="button" className="back-link" onClick={() => {setShowGuestForm(false);setError('');}} disabled={loading}>Volver a las opciones de acceso</button>
            <p className="guest-hint">Para volver a tus chats desde otros dispositivos, elige Google.</p>
          </form>}
          {!recovering&&<><p className="guest-hint">El país se sugiere por la región del navegador. El micrófono y la cámara se solicitan únicamente cuando eliges usarlos.</p><div className="card-bottom"><span className="live-dot" /><span>Nexus Chat · Solo internet.</span><ArrowUpRight size={15} /></div></>}
        </section>
      </main>
      <section className="welcome-features" aria-label="Lo que puedes hacer en Nexus Chat">
        <div><span className="feature-icon"><MessageCircle size={21} /></span><span><strong>Conversaciones que fluyen</strong><small>Un espacio para hablar, reír y estar.</small></span></div>
        <div><span className="feature-icon"><Image size={21} /></span><span><strong>Comparte tu mundo</strong><small>Fotos, archivos y notas de voz.</small></span></div>
        <div><span className="feature-icon"><Smile size={21} /></span><span><strong>Hazlo tuyo</strong><small>Tu perfil, tu estilo, tu manera.</small></span></div>
      </section>
      <footer className="auth-footer"><span>© {new Date().getFullYear()} Nexus Chat</span><a href="/guia.html">Guía de Nexus Chat</a><span>Sin tarjeta SIM. Solo internet.<span className="footer-spark"> ✳</span></span></footer>
    </div>
  );
}
