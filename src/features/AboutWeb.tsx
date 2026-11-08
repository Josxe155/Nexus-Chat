import {BookOpen, RefreshCw, Shield} from 'lucide-react';
import {version} from '../webVersion.json';

export default function AboutWeb({onPolicies}: {onPolicies: () => void}) {
  return (
    <div className="phone-settings-about">
      <div className="web-about-brand">
        <h3>Nexus Chat</h3>
        <p>Versión {version}</p>
        <img src="/nexus-icon.svg?v=3" alt="" />
        <p>Mensajería, comunidades y llamadas desde tu navegador.</p>
        <button
          type="button"
          className="phone-settings-primary"
          onClick={() => window.dispatchEvent(new Event('nexus:show-update'))}
        >
          <RefreshCw size={18} aria-hidden="true" /> Buscar actualizaciones
        </button>
      </div>
      <div className="web-about-links">
        <a href="/guia.html" target="_blank" rel="noopener noreferrer">
          <BookOpen size={21} aria-hidden="true" /> Guía de Nexus
        </a>
        <button type="button" onClick={onPolicies}>
          <Shield size={21} aria-hidden="true" /> Condiciones y Política de privacidad
        </button>
      </div>
    </div>
  );
}
