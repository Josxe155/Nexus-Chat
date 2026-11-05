import {MobileFullscreenExit} from '../features/MobileFullscreenSetting';

import VoicePlaybackBar from '../features/VoicePlaybackControls';
import {pauseVoice} from '../features/voicePlayback';
import {auth} from '../firebase';import AppLock from '../features/AppLock';
import {useInterfacePalette} from '../features/InterfacePalette';
import {applyExperience} from '../features/DeviceExperience';
import React, {useEffect, useState} from 'react';
interface Props {theme: 'light' | 'dark'; showChat: boolean; sidebar: React.ReactNode; children: React.ReactNode;}
export default function WorkspaceLayout({theme,showChat,sidebar,children}: Props) {
  const [locked,setLocked]=useState(()=>!!auth.currentUser?.uid&&!!localStorage.getItem('nexus-lock-'+auth.currentUser.uid));const palette=useInterfacePalette();
  useEffect(()=>{if(locked)pauseVoice();},[locked]);
  useEffect(()=>{const element=document.documentElement;element.dataset.nexusSurface='workspace';element.dataset.nexusMode=theme;element.dataset.nexusPalette=palette;return()=>{delete element.dataset.nexusSurface;delete element.dataset.nexusMode;delete element.dataset.nexusPalette;};},[theme,palette]);
  const [viewportHeight, setViewportHeight] = useState<number>();
  useEffect(()=>{applyExperience();window.addEventListener('nexus:experience',applyExperience);window.addEventListener('storage',applyExperience);return()=>{window.removeEventListener('nexus:experience',applyExperience);window.removeEventListener('storage',applyExperience);};},[]);
  useEffect(() => {
    const viewport = window.visualViewport;
    const update = () => setViewportHeight(viewport?.height ?? window.innerHeight);
    update();
    viewport?.addEventListener('resize', update);
    window.addEventListener('resize', update);
    return () => {viewport?.removeEventListener('resize', update); window.removeEventListener('resize', update);};
  }, []);
  return <div style={{height: viewportHeight ? `min(100dvh, ${viewportHeight}px)` : undefined}} className="nexus-workspace" data-theme={theme}><MobileFullscreenExit/><AppLock uid={auth.currentUser?.uid||''} onLock={setLocked}/>{!locked&&<VoicePlaybackBar uid={auth.currentUser?.uid}/ >}{!locked&&<div className="workspace-frame"><aside className={`workspace-sidebar ${showChat ? 'mobile-hidden' : ''}`} aria-label="Conversaciones y perfil">{sidebar}</aside><main className={`workspace-chat ${showChat ? '' : 'mobile-hidden'}`} aria-label="Conversación">{children}<div id="workspace-detail-host"/></main></div>}</div>;
}
