import {createPortal} from 'react-dom';
import type {UserProfile} from '../types';
import PhoneContactCode from './PhoneContactCode';
import {avatar} from './avatar';
import {useMobileBack} from './useMobileBack';
export default function ContactQrOverlay({user,onClose,onContact}:{user:UserProfile;onClose:()=>void;onContact:(uid:string)=>Promise<void>}){
 useMobileBack(true,onClose,100);
 return createPortal(<div className="pcm-qr-overlay"><PhoneContactCode user={user} photo={avatar(user.foto)} initialScan onBack={onClose} onContact={onContact}/></div>,document.body);
}
