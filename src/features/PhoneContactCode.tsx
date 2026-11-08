import {useEffect, useRef, useState} from 'react';
import {ArrowLeft, MoreVertical, Share2} from 'lucide-react';
import type {UserProfile} from '../types';
import {contactCodeURL, resolveContactCode, updateContactCode, validContactCode, watchContactCode} from './contactCode';
import PhoneContactScanner from './PhoneContactScanner';
import {SettingsDialog} from './MobileSettingsControls';
import {useMobileBack} from './useMobileBack';

async function makeShareCard(qr: string, name: string) {
  const image = new Image();
  image.src = qr;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 680;
  const ctx = canvas.getContext('2d');
  if (!ctx) return qr;
  ctx.fillStyle = '#148647';
  ctx.fillRect(0, 0, 480, 680);
  ctx.fillStyle = '#fff';
  ctx.fillRect(46, 119, 388, 414);
  ctx.textAlign = 'center';
  ctx.font = '600 30px system-ui';
  ctx.fillText('Nexus Chat', 240, 79, 388);
  ctx.fillStyle = '#102018';
  ctx.font = '600 26px system-ui';
  ctx.fillText(name, 240, 169, 345);
  ctx.font = '18px system-ui';
  ctx.fillText('Contacto de Nexus Chat', 240, 204, 345);
  ctx.drawImage(image, 94, 223, 292, 292);
  ctx.fillStyle = '#fff';
  ctx.font = '18px system-ui';
  ctx.fillText('Escanea este código para abrir el contacto.', 240, 597, 410);
  return canvas.toDataURL('image/png');
}

export function ContactCodeConfirmation({token, uid, onClose, onContact}: {
  token: string; uid: string; onClose: () => void; onContact: (uid: string) => Promise<void>;
}) {
  const [person, setPerson] = useState<Awaited<ReturnType<typeof resolveContactCode>>>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    resolveContactCode(token).then(contact => {
      if (!active) return;
      if (contact.uid === uid) setError('Este es tu propio código QR.');
      else setPerson(contact);
    }).catch(() => {if (active) setError('Este código QR ya no está disponible o no puedes abrirlo.');});
    return () => {active = false;};
  }, [token, uid]);
  return <SettingsDialog title={person?.nombre || 'Contacto de Nexus Chat'} onClose={()=>{if(!busy)onClose();}} actions={<>
    <button type="button" disabled={busy} onClick={onClose}>Cerrar</button>
    {person&&<button type="button" disabled={busy} onClick={async()=>{
      setBusy(true);
      setError('');
      try {
        const latest = await resolveContactCode(token);
        await onContact(latest.uid);
        onClose();
      } catch {
        setError('No se pudo abrir este contacto. Comprueba el código y tu conexión.');
      } finally {
        setBusy(false);
      }
    }}>{busy?'Abriendo…':'Abrir chat'}</button>}
  </>}>
    {person?.username&&<p>@{person.username}</p>}
    {!person&&!error&&<p role="status">Consultando contacto…</p>}
    {error&&<p role="alert">{error}</p>}
  </SettingsDialog>;
}

export function ContactCodeLink({uid, onContact}: {uid: string; onContact: (uid: string) => Promise<void>}) {
  const [token, setToken] = useState(() => new URLSearchParams(location.search).get('contact'));
  useEffect(()=>{
    if(!validContactCode(token))return;
    const url = new URL(location.href);
    url.searchParams.delete('contact');
    history.replaceState(history.state, '', url);
  },[token]);
  if (!validContactCode(token)) return null;
  return <ContactCodeConfirmation token={token} uid={uid} onContact={onContact} onClose={()=>setToken(null)}/>;
}

export default function PhoneContactCode({user, photo, onBack, onContact}: {
  user: UserProfile; photo: string; onBack: () => void; onContact: (uid: string) => Promise<void>;
}) {
  const [token, setToken] = useState('');
  const [rendered, setRendered] = useState<{token:string;qr:string;card?:string}>();
  const qr = rendered?.token===token ? rendered?.qr : undefined;
  const shareCard = rendered?.token===token ? rendered?.card : undefined;
  const [sharing, setSharing] = useState(false);
  const [scan, setScan] = useState(false);
  const [menu, setMenu] = useState(false);
  const [reset, setReset] = useState(false);
  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState('');
  const [message, setMessage] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const pending = useRef(false);

  async function load(rotate = false) {
    if(pending.current)return;
    pending.current=true;
    setBusy(true);
    setMessage('');
    try {
      await updateContactCode(user.uid, rotate);
      setReset(false);
    } catch {
      setMessage(rotate ? 'No se pudo restablecer el código QR.' : 'No se pudo preparar tu código QR.');
    } finally {
      pending.current=false;
      setBusy(false);
    }
  }
  useEffect(() => {void load();}, [user.uid]);
  useEffect(() => watchContactCode(user.uid,setToken,()=>{
    setToken('');
    setMessage('No se pudo actualizar el código QR.');
  }), [user.uid]);
  useEffect(() => {
    if (!token) return;
    let active = true;
    import('qrcode').then(module => (module.default || module).toDataURL(contactCodeURL(token), {
      width:480, margin:3, errorCorrectionLevel:'M',
    })).then(async image => {
      if(!active)return;
      setRendered({token,qr:image});
      const card=await makeShareCard(image,user.nombre).catch(()=>image);
      if(active)setRendered({token,qr:image,card});
    }).catch(()=>{
      if(active)setMessage('No se pudo dibujar el código QR.');
    });
    return () => {active = false;};
  }, [token,user.nombre]);
  useEffect(() => {
    if (!menu) return;
    function dismiss(event: PointerEvent) {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) setMenu(false);
    }
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [menu]);
  useMobileBack(menu||scan, ()=>{if(menu)setMenu(false);else setScan(false);}, 55);

  async function share() {
    if (!shareCard || sharing) return;
    setSharing(true);
    setMessage('');
    const file = new File([Uint8Array.from(atob(shareCard.split(',')[1]), char => char.charCodeAt(0))],
      'contacto-nexus.png', {type:'image/png'});
    try {
      if (navigator.canShare?.({files:[file]})) await navigator.share({files:[file]});
      else if (navigator.share) await navigator.share({title:'Contacto de Nexus Chat', url:contactCodeURL(token)});
      else {
        const link=document.createElement('a');
        link.href=shareCard;link.download=file.name;link.click();
        setMessage('Código QR guardado.');
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) setMessage('No se pudo compartir el código.');
    } finally {
      setSharing(false);
    }
  }

  return <section className="settings-center mobile-settings phone-qr-page" aria-label="Código QR">
    <header className="settings-heading">
      <button type="button" aria-label="Volver a configuración" onClick={onBack}><ArrowLeft/></button>
      <h2>Código QR</h2>
      {!scan&&<div className="phone-settings-actions" ref={menuRef}>
        <button type="button" aria-label="Compartir código QR" disabled={!shareCard||sharing||busy} onClick={()=>void share()}><Share2 size={21}/></button>
        <button type="button" aria-label="Más opciones del código QR" aria-expanded={menu} onClick={()=>setMenu(!menu)}><MoreVertical size={22}/></button>
        {menu&&<div className="phone-qr-menu">
          <button type="button" disabled={busy||!token} onClick={()=>{setMenu(false);setReset(true);}}>Restablecer código QR</button>
        </div>}
      </div>}
    </header>
    <nav className="phone-qr-tabs" aria-label="Código QR de contacto">
      <button type="button" aria-pressed={!scan} onClick={()=>{setScan(false);setMenu(false);}}>Mi código</button>
      <button type="button" aria-pressed={scan} onClick={()=>{setScan(true);setMenu(false);}}>Escanear código</button>
    </nav>
    <div className="settings-scroll">
      {scan?<PhoneContactScanner paused={!!target} onCode={setTarget}/>:<div className="phone-qr-content">
        <div className="phone-qr-card">
          <img className="phone-qr-avatar" src={photo} alt=""/>
          <strong>{user.nombre}</strong>
          <small>Contacto de Nexus Chat</small>
          {qr?<img className="phone-qr-image" src={qr} alt="Mi código QR de Nexus Chat"/>:<p role="status">{busy?'Preparando código QR…':'Código no disponible'}</p>}
        </div>
        <p>Comparte este código con las personas que quieras que puedan abrir un chat contigo en Nexus.</p>
        {message&&<p role="status">{message}</p>}
        {!token&&!busy&&<button type="button" className="phone-settings-text-action" onClick={()=>void load()}>Reintentar</button>}
      </div>}
    </div>
    {reset&&<SettingsDialog title="¿Deseas restablecer el código QR?" onClose={()=>{if(!busy)setReset(false);}} actions={<>
      <button type="button" disabled={busy} onClick={()=>setReset(false)}>Mantener</button>
      <button type="button" disabled={busy} onClick={()=>void load(true)}>{busy?'Restableciendo…':'Restablecer'}</button>
    </>}><p>El código QR existente dejará de funcionar.</p>{message&&<p role="alert">{message}</p>}</SettingsDialog>}
    {target&&<ContactCodeConfirmation token={target} uid={user.uid} onClose={()=>setTarget('')} onContact={onContact}/>}
  </section>;
}
