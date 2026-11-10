import type {ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {ArrowLeft} from 'lucide-react';
import {useMobileBack} from './useMobileBack';
export function PhoneReferencePage({title,onBack,actions,children,footer,className=''}:{title:string;onBack:()=>void;actions?:ReactNode;children:ReactNode;footer?:ReactNode;className?:string}){
 useMobileBack(true,onBack,60);
 return createPortal(<section className={'phone-reference-page '+className} role="dialog" aria-modal="true" aria-label={title}><header><button type="button" aria-label={'Volver de '+title} onClick={onBack}><ArrowLeft/></button><h2>{title}</h2>{actions}</header><main>{children}</main>{footer&&<footer>{footer}</footer>}</section>,document.body);
}
export function ChannelBroadcast({size=96}:{size?:number}){return <span className="phone-channel-broadcast" style={{width:size,height:size}} aria-hidden="true"><svg viewBox="0 0 120 100" fill="none"><path d="M13 16C0 34 0 66 13 84M24 25c-8 14-8 36 0 50M107 16c13 18 13 50 0 68M96 25c8 14 8 36 0 50" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/><circle cx="60" cy="50" r="30" fill="#21c063"/></svg><img src="/nexus-icon.svg" alt=""/></span>}
