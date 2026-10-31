import {useEffect,useState} from 'react';
export function useEncryptionRevision(){const [revision,setRevision]=useState(0);useEffect(()=>{const ready=()=>setRevision(v=>v+1);window.addEventListener('nexus:keys-ready',ready);return()=>window.removeEventListener('nexus:keys-ready',ready);},[]);return revision;}
