import {BookOpen, Shield} from 'lucide-react';
import ReleaseManager from './ReleaseManager';
import {version} from '../webVersion.json';

export default function AboutWeb({onPolicies}: {onPolicies: () => void}) {
  return (
    <div className="phone-settings-about">
      <div className="web-about-brand">
        <h3>Nexus Chat</h3>
        <p>Versión v{version}</p>
        <img src="/nexus-icon.svg?v=3" alt="" />
        <p>Mensajería, comunidades y llamadas desde tu navegador.</p>
        <ReleaseManager/>
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
