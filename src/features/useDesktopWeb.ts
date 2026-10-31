import {useEffect,useState} from 'react';
const query='(min-width:1024px) and (hover:hover) and (pointer:fine)';
const matches=()=>window.matchMedia(query).matches&&!/Android|iPad|Tablet/i.test(navigator.userAgent)&&!(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
export function useDesktopWeb(){const [desktop,setDesktop]=useState(matches);useEffect(()=>{const media=matchMedia(query),update=()=>{const value=matches();setDesktop(value);document.documentElement.dataset.nexusWeb=value?'desktop':'messenger';};update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);return desktop;}
