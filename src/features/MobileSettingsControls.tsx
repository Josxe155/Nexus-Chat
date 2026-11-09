import {useEffect,useRef,useState,type ComponentType,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {useMobileBack} from './useMobileBack';

function dialogControls(dialog: HTMLElement) {
 const controls=Array.from(dialog.querySelectorAll<HTMLElement>(
  'button,input,select,textarea,a[href],[tabindex="0"]',
 )).filter(control=>!control.matches(':disabled,[tabindex="-1"]')&&control.getClientRects().length);
 return controls.filter(control=>{
  if(!(control instanceof HTMLInputElement)||control.type!=='radio'||!control.name)return true;
  const group=controls.filter(item=>item instanceof HTMLInputElement&&item.type==='radio'&&item.name===control.name);
  return control===(group.find(item=>(item as HTMLInputElement).checked)||group[0]);
 });
}

export function SettingsRow({label,detail,icon:Icon,end,onClick}:{label:string;detail?:string;icon?:ComponentType<{size?:number}>;end?:ReactNode;onClick:()=>void}){
 return <button type="button" className="phone-setting-row" onClick={onClick}>{Icon&&<Icon size={23}/>}<span><strong>{label}</strong>{detail&&<small>{detail}</small>}</span>{end!=null&&<span className="phone-setting-end">{end}</span>}</button>;
}
export function SettingsHero({icon:Icon,title,detail}:{icon:ComponentType<{size?:number}>;title:string;detail:string}){
 return <div className="phone-settings-hero"><span><Icon size={44}/></span><h3>{title}</h3><p>{detail}</p></div>;
}
export function SettingsDialog({title,children,onClose,actions}:{title:string;children?:ReactNode;onClose:()=>void;actions:ReactNode}){
 const box=useRef<HTMLDivElement>(null);
 useMobileBack(true,onClose,75);
 useEffect(()=>{
  const before=document.activeElement as HTMLElement|null;
  const dialog=box.current;
  if(dialog)(dialogControls(dialog)[0]||dialog).focus({preventScroll:true});
  return()=>{if(before?.isConnected)before.focus({preventScroll:true});};
 },[]);
 return createPortal(<div className="phone-settings-mask" onClick={event=>{if(event.target===event.currentTarget)onClose();}}><div ref={box} className="phone-settings-dialog" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} onKeyDown={event=>{
  if(event.key==='Escape'){event.stopPropagation();onClose();}
  if(event.key==='Tab'){
   const dialog=event.currentTarget,controls=dialogControls(dialog);
   const active=document.activeElement;
   if(!controls.includes(active as HTMLElement)||active===(event.shiftKey?controls[0]:controls.at(-1))){
    event.preventDefault();
    ((event.shiftKey?controls.at(-1):controls[0])||dialog).focus();
   }
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
