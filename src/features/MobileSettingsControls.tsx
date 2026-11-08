import {useEffect,useRef,useState,type ComponentType,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {useMobileBack} from './useMobileBack';

export function SettingsRow({label,detail,icon:Icon,end,onClick}:{label:string;detail?:string;icon?:ComponentType<{size?:number}>;end?:ReactNode;onClick:()=>void}){
 return <button type="button" className="phone-setting-row" onClick={onClick}>{Icon&&<Icon size={23}/>}<span><strong>{label}</strong>{detail&&<small>{detail}</small>}</span>{end}</button>;
}
export function SettingsHero({icon:Icon,title,detail}:{icon:ComponentType<{size?:number}>;title:string;detail:string}){
 return <div className="phone-settings-hero"><span><Icon size={44}/></span><h3>{title}</h3><p>{detail}</p></div>;
}
export function SettingsDialog({title,children,onClose,actions}:{title:string;children?:ReactNode;onClose:()=>void;actions:ReactNode}){
 const box=useRef<HTMLDivElement>(null);
 useMobileBack(true,onClose,75);
 useEffect(()=>{
  const before=document.activeElement as HTMLElement|null;
  (box.current?.querySelector<HTMLElement>('input:checked,input:not([type=radio]),button')||box.current)?.focus({preventScroll:true});
  return()=>before?.focus({preventScroll:true});
 },[]);
 return createPortal(<div className="phone-settings-mask" onClick={event=>{if(event.target===event.currentTarget)onClose();}}><div ref={box} className="phone-settings-dialog" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} onKeyDown={event=>{
  if(event.key==='Escape'){event.stopPropagation();onClose();}
  if(event.key==='Tab'){
   const controls=Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled):not([type=radio]),input[type=radio]:checked,select,textarea'));
   if(event.shiftKey&&document.activeElement===controls[0]){event.preventDefault();controls.at(-1)?.focus();}
   else if(!event.shiftKey&&document.activeElement===controls.at(-1)){event.preventDefault();controls[0]?.focus();}
  }
 }}><h3>{title}</h3>{children}<footer>{actions}</footer></div></div>,document.body);
}

export type SettingsOption={value:string;label:string;detail?:string};
export type SettingsChoice={title:string;description?:string;options:SettingsOption[];selected:string[];multiple?:boolean;accept?:string;save:(values:string[])=>void};
export function SettingsChoiceDialog({choice,onClose}:{choice:SettingsChoice;onClose:()=>void}){
 const [selected,setSelected]=useState(choice.selected);
 return <SettingsDialog title={choice.title} onClose={onClose} actions={<><button type="button" onClick={onClose}>Cancelar</button><button type="button" onClick={()=>{choice.save(selected);onClose();}}>{choice.accept||'Aceptar'}</button></>}>
  {choice.description&&<p>{choice.description}</p>}
  <div className="phone-setting-options">{choice.options.map(option=><label key={option.value}><input name="phone-settings-choice" type={choice.multiple?'checkbox':'radio'} checked={selected.includes(option.value)} onChange={event=>setSelected(choice.multiple?event.target.checked?[...selected,option.value]:selected.filter(value=>value!==option.value):[option.value])}/><span>{option.label}{option.detail&&<small>{option.detail}</small>}</span></label>)}</div>
 </SettingsDialog>;
}
