import {useEffect, useRef, useState} from 'react';
import {Flashlight, FlashlightOff, Images} from 'lucide-react';
import {parseContactCode} from './contactCode';

type TorchCapabilities = MediaTrackCapabilities & {torch?: boolean};

export default function PhoneContactScanner({paused, onCode}: {paused: boolean; onCode: (token: string) => void}) {
  const video = useRef<HTMLVideoElement>(null);
  const camera = useRef<MediaStreamTrack | undefined>(undefined);
  const readingFile = useRef(false);
  const lastCameraCode = useRef('');
  const mounted = useRef(false);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  const callback = useRef(onCode);
  callback.current = onCode;
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [ready, setReady] = useState(false);
  const [torch, setTorch] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [visible, setVisible] = useState(()=>document.visibilityState==='visible');

  useEffect(()=>{
    const update=()=>setVisible(document.visibilityState==='visible');
    document.addEventListener('visibilitychange',update);
    return()=>document.removeEventListener('visibilitychange',update);
  },[]);

  useEffect(() => {
    if (paused||!visible) return;
    const player = video.current;
    if (!player) return;
    let alive = true, stream: MediaStream | undefined, timer: ReturnType<typeof setInterval> | undefined;
    setReady(false);
    setHasTorch(false);
    setTorch(false);
    setError('');
    async function start() {
      const {default: decode} = await import('jsqr');
      if (!alive) return;
      stream = await navigator.mediaDevices.getUserMedia({video: {facingMode: {ideal: 'environment'}}, audio: false});
      if (!alive) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      camera.current = stream.getVideoTracks()[0];
      const capabilities=camera.current?.getCapabilities?.() as TorchCapabilities | undefined;
      setHasTorch(!!capabilities?.torch);
      player!.srcObject = stream;
      await player!.play();
      if (!alive) return;
      setReady(true);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', {willReadFrequently: true});
      if (!ctx) throw Error('No se pudo iniciar el escáner.');
      timer = setInterval(() => {
        if (readingFile.current||player!.readyState < 2 || !player!.videoWidth) return;
        const width=Math.min(560,player!.videoWidth);
        const height=Math.max(1,Math.round(width*player!.videoHeight/player!.videoWidth));
        if(canvas.width!==width||canvas.height!==height){
          canvas.width=width;canvas.height=height;
        }
        ctx.drawImage(player!, 0, 0, canvas.width, canvas.height);
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = decode(frame.data, canvas.width, canvas.height, {inversionAttempts: 'dontInvert'});
        if (!code) {lastCameraCode.current='';return;}
        if(code.data===lastCameraCode.current)return;
        lastCameraCode.current=code.data;
        const token = parseContactCode(code.data);
        if (!token) {
          setError('Escanea un código de contacto de Nexus Chat.');
          return;
        }
        clearInterval(timer);
        callback.current(token);
      }, 180);
    }
    void start().catch(() => {
      stream?.getTracks().forEach(track => track.stop());
      if (alive) {setReady(false);setError('No se pudo abrir la cámara. Revisa el permiso o elige una imagen.');}
    });
    return () => {
      alive = false;
      clearInterval(timer);
      camera.current = undefined;
      stream?.getTracks().forEach(track => track.stop());
      player.srcObject = null;
    };
  }, [paused, retry, visible]);

  async function scanImage(file: File) {
    if(paused||readingFile.current)return;
    readingFile.current=true;
    setError('');
    try {
      if (file.size > 12 * 1024 ** 2) throw Error('Elige una imagen de hasta 12 MB.');
      const {default: decode} = await import('jsqr');
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 1100 / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const ctx = canvas.getContext('2d');
      try {
        if (!ctx) throw Error('No se pudo leer la imagen.');
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      } finally {
        bitmap.close();
      }
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = decode(pixels.data, canvas.width, canvas.height);
      const token = code && parseContactCode(code.data);
      if (!token) throw Error('No se encontró un código de contacto de Nexus Chat en esta imagen.');
      if(mounted.current)callback.current(token);
    } catch (error) {
      if(mounted.current)setError(error instanceof Error ? error.message : 'No se pudo leer la imagen.');
    } finally {
      readingFile.current=false;
    }
  }

  return <div className="phone-qr-scan">
    <div className="phone-qr-camera"><video ref={video} muted autoPlay playsInline aria-label="Vista de la cámara"/></div>
    <p>Escanea un código QR de Nexus Chat</p>
    {error&&<p role="alert">{error}</p>}
    {!ready&&error&&<button type="button" className="phone-settings-text-action" onClick={()=>setRetry(value=>value+1)}>Reintentar cámara</button>}
    <footer>
      <label><Images size={22}/><span className="sr-only">Escanear desde la galería</span><input type="file" accept="image/*" aria-label="Escanear desde la galería" onChange={event=>{
        const file=event.target.files?.[0];event.target.value='';if(file)void scanImage(file);
      }}/></label>
      <button type="button" aria-label={torch?'Apagar linterna':'Encender linterna'} disabled={!hasTorch||paused||!visible} onClick={async()=>{
        try {
          await camera.current?.applyConstraints({advanced:[{torch:!torch} as MediaTrackConstraintSet]});
          setTorch(!torch);
        } catch {setError('No se pudo usar la linterna.');}
      }}>{torch?<Flashlight size={22}/>:<FlashlightOff size={22}/>}</button>
    </footer>
  </div>;
}
